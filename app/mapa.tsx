import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { BackHandler, View } from "react-native";
import { WebView } from "react-native-webview";
import { API_ENDPOINTS } from "./config/api";
import { useAlarmContext } from "./context/AlarmContext";
import styles from "./styles/mapa_styles";

const POLL_INTERVAL_MS = 5000; // 5 seconds

interface FirefighterLocation {
  firefighter_id: number;
  lat: number;
  lng: number;
  label: string | null;
  updated_at: string;
}

interface Firefighter {
  id: number;
  name: string;
  surname: string;
}

function generateLeafletHTML(initialLat: number = 49.742863, initialLng: number = 20.627574) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    
    #searchButton {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 1001;
      width: 40px;
      height: 40px;
      background: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    #searchButton:hover {
      background: #f0f0f0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transform: scale(1.1);
    }

    #searchBox { 
      position: absolute; 
      top: 100px; 
      right: 0px; 
      z-index: 1000; 
      background: white; 
      padding: 15px; 
      border-radius: 8px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: none;
      border: 2px solid #007bff;
    }

    #searchBox.show {
      display: block;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    #searchBox input { 
      width: 240px; 
      padding: 10px 12px; 
      border: 1px solid #ddd; 
      border-radius: 6px; 
      font-size: 15px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #searchBox input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 4px rgba(0,123,255,0.3);
    }

    #searchBox button { 
      padding: 10px 16px; 
      background: #007bff; 
      color: white; 
      border: none; 
      border-radius: 6px; 
      cursor: pointer;
      margin-left: 8px;
      font-size: 15px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    #searchBox button:hover {
      background: #0056b3;
      transform: translateY(-2px);
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }

    #clearRouteBtn {
      background: #dc3545 !important;
    }

    #clearRouteBtn:hover {
      background: #c82333 !important;
    }

    #hydrantButton {
      position: absolute;
      top: 70px;
      right: 20px;
      z-index: 1001;
      width: 40px;
      height: 40px;
      background: #ff6b6b;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    #hydrantButton:hover {
      background: #ff5252;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transform: scale(1.1);
    }

    #hydrantButton.active {
      background: #28a745;
    }

    #hydrantButton.active:hover {
      background: #20c997;
    }

    #nearestList {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      z-index: 1000;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      max-height: 200px;
      overflow-y: auto;
      border: 2px solid #007bff;
    }

    .nearest-header {
      font-weight: bold;
      margin-bottom: 10px;
      color: #333;
      font-size: 14px;
    }

    .nearest-item {
      padding: 8px 10px;
      margin-bottom: 6px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #007bff;
      font-size: 13px;
      color: #333;
    }

    .nearest-name {
      font-weight: 500;
      margin-bottom: 2px;
    }

    .nearest-distance {
      color: #666;
      font-size: 12px;
    }

    .leaflet-zoom-animated .firefighter-marker div {
      transform: scale(1) !important;
    }
  </style>
</head>
<body>
  <button id="searchButton">🔍</button>
  <div id="searchBox">
    <input type="text" id="addressInput">
    <button id="searchBtn">Szukaj</button>
    <button id="clearRouteBtn">Wyczyść trasę</button>
  </div>
  <button id="hydrantButton" title="Hydranty">💧</button>
  <div id="nearestList">
    <div class="nearest-header">Najbliżsi strażacy:</div>
    <div id="nearestItems"></div>
  </div>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([${initialLat}, ${initialLng}], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const markers = {};
    let hasZoomedToUser = false;
    let currentUserLat = ${initialLat};
    let currentUserLng = ${initialLng};
    let routingControl = null;
    let searchMarker = null;
    let hydrantMarkers = [];
    let hydrantsVisible = false;
    let hasActiveAlarm = false;
    let remotezyLat = 49.742863;
    let remotezyLng = 20.627574;


    // Calculate distance between two coordinates (Haversine formula)
    function getDistance(lat1, lng1, lat2, lng2) {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    }

    // Update nearest firefighters list (to remotezy, only if alarm active)
    function updateNearestList(allFirefighters) {
      const listContainer = document.getElementById('nearestList');
      if (!listContainer) return;
      
      // Hide if no active alarm
      if (!hasActiveAlarm) {
        listContainer.style.display = 'none';
        return;
      }

      // Calculate distances to remotezy for all firefighters
      const firefightersWithDistance = allFirefighters.map(loc => ({
        ...loc,
        distance: getDistance(loc.lat, loc.lng, remotezyLat, remotezyLng)
      }));

      // Sort by distance and get top 4
      const nearest = firefightersWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 4);

      // Render list
      const itemsContainer = document.getElementById('nearestItems');
      if (!itemsContainer) return;
      
      itemsContainer.innerHTML = nearest.map(f =>
        '<div class="nearest-item">' +
          '<div class="nearest-name">' + (f.firefighterName || '?') + ' ' + (f.firefighterSurname || '') + '</div>' +
          '<div class="nearest-distance">🚒 ' + f.distance.toFixed(2) + ' km do remotezy</div>' +
        '</div>'
      ).join('');
      
      listContainer.style.display = 'block';
    }

    // Function to fetch hydrants from Overpass API
    async function fetchHydrants() {
      try {
        let south = 49.7016;
        let west = 20.5551;
        let north = 49.7816;
        let east = 20.6951;
        
        // Use different format for better results
        const query = '[out:json];(node["emergency"="fire_hydrant"](' + south + ',' + west + ',' + north + ',' + east + '););out geom;';
        const url = 'https://overpass-api.de/api/interpreter';
        
        const response = await fetch(url, {
          method: 'POST',
          body: query,
          headers: { 'Content-Type': 'application/osm3s' }
        });
        
        if (!response.ok) {
          return [];
        }
        
        const data = await response.json();
        
        const hydrants = data.elements ? data.elements.filter(el => el.type === 'node') : [];
        
        // Limit to max 500 hydrants for performance
        const limited = hydrants.slice(0, 500);
        
        return limited;
      } catch (error) {
        return [];
      }
    }

    // Function to show/hide hydrants
    async function toggleHydrants() {
      const btn = document.getElementById('hydrantButton');
      
      if (hydrantsVisible) {
        // Hide hydrants
        hydrantMarkers.forEach(marker => map.removeLayer(marker));
        hydrantMarkers = [];
        hydrantsVisible = false;
        btn.classList.remove('active');
      } else {
        // Show hydrants
        btn.style.opacity = '0.5';
        
        const hydrants = await fetchHydrants();
        
        // Clear previous hydrants
        hydrantMarkers.forEach(marker => map.removeLayer(marker));
        hydrantMarkers = [];
        
        if (hydrants.length === 0) {
          hydrantsVisible = true;
          btn.classList.add('active');
          btn.style.opacity = '1';
          return;
        }
        
        let rendered = 0;
        hydrants.forEach(hydrant => {
          const lat = hydrant.lat;
          const lon = hydrant.lon;
          
          if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
            const marker = L.circleMarker([lat, lon], {
              radius: 8,
              fillColor: '#ff6b6b',
              color: '#cc0000',
              weight: 2,
              opacity: 0.9,
              fillOpacity: 0.7
            });
            
            marker.bindPopup('Hydrant<br>Lat: ' + lat.toFixed(4) + '<br>Lng: ' + lon.toFixed(4));
            marker.addTo(map);
            hydrantMarkers.push(marker);
            rendered++;
          }
        });
        
        hydrantsVisible = true;
        btn.classList.add('active');
        btn.style.opacity = '1';
      }
    }

    // Function to search for address
    async function searchAddress(query) {
      try {
        const response = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(query)}\`);
        const results = await response.json();
        
        if (results.length === 0) {
          alert('Nie znaleziono adresu');
          return;
        }
        
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        
        // Remove old search marker
        if (searchMarker) map.removeLayer(searchMarker);
        
        // Add search location marker
        const icon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        searchMarker = L.marker([lat, lng], { icon: icon }).addTo(map);
        searchMarker.bindPopup(first.display_name);
        map.setView([lat, lng], 15);
        
        // Draw route from current user to search location
        drawRoute(currentUserLat, currentUserLng, lat, lng);
      } catch (error) {
        alert('Błąd podczas wyszukiwania');
      }
    }

    // Function to draw route using OSRM
    async function drawRoute(fromLat, fromLng, toLat, toLng) {
      // Remove old route line
      if (routingControl) {
        map.removeLayer(routingControl);
      }
      
      try {
        // Call OSRM API to get route coordinates
        const osrmUrl = \`https://router.project-osrm.org/route/v1/driving/\${fromLng},\${fromLat};\${toLng},\${toLat}?overview=full&geometries=geojson\`;
        const response = await fetch(osrmUrl);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const routeCoordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          
          // Draw route polyline
          const routeLine = L.polyline(
            routeCoordinates,
            { color: 'blue', weight: 3, opacity: 0.7, dashArray: '5, 5' }
          ).addTo(map);
          
          routingControl = routeLine;
        }
      } catch (error) {
        console.error('OSRM route error:', error);
        // Fallback to straight line if OSRM fails
        const routeLine = L.polyline(
          [[fromLat, fromLng], [toLat, toLng]],
          { color: 'blue', weight: 3, opacity: 0.7, dashArray: '5, 5' }
        ).addTo(map);
        routingControl = routeLine;
      }
    }

    // Clear route function
    function clearRoute() {
      if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
      }
      if (searchMarker) {
        map.removeLayer(searchMarker);
        searchMarker = null;
      }
    }

    // Event listeners
    document.getElementById('searchBtn').addEventListener('click', function() {
      const address = document.getElementById('addressInput').value;
      if (address) searchAddress(address);
    });

    document.getElementById('addressInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const address = document.getElementById('addressInput').value;
        if (address) searchAddress(address);
      }
    });

    document.getElementById('clearRouteBtn').addEventListener('click', clearRoute);

    // Hydrant button
    document.getElementById('hydrantButton').addEventListener('click', toggleHydrants);

    // Toggle search box
    document.getElementById('searchButton').addEventListener('click', function() {
      const box = document.getElementById('searchBox');
      box.classList.toggle('show');
      if (box.classList.contains('show')) {
        document.getElementById('addressInput').focus();
      }
    });

    function updateFirefighterMarker(id, lat, lng, firefighterName, firefighterSurname, isCurrentUser) {
      const key = 'firefighter_' + id;
      if (markers[key]) {
        map.removeLayer(markers[key]);
      }
      
      if (isCurrentUser) {
        currentUserLat = lat;
        currentUserLng = lng;
      }
      
      const nameFirst = firefighterName ? firefighterName.charAt(0).toUpperCase() : '?';
      const surnameFirst = firefighterSurname ? firefighterSurname.charAt(0).toUpperCase() : '?';
      const shortName = nameFirst + surnameFirst;
      
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
      const bgColor = colors[id % colors.length];
      
      const divIcon = L.divIcon({
        html: '<div style="background: ' + bgColor + '; color: white; padding: 3px 6px; border-radius: 12px; font-weight: bold; font-size: 10px; line-height: 1; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 1px solid white; transform: scale(1); transform-origin: center;">' + shortName + '</div>',
        iconSize: [36, 18],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
        className: 'firefighter-marker'
      });
      
      const popupContent = '<strong>' + firefighterName + '</strong><br>ID: ' + id;
      
      const marker = L.marker([lat, lng], { icon: divIcon });
      marker.bindPopup(popupContent, { autoClose: false, closeButton: true });
      marker.addTo(map);
      
      marker.on('click', function() {
        this.togglePopup();
      });
      
      markers[key] = marker;
      
      if (isCurrentUser && !hasZoomedToUser) {
        hasZoomedToUser = true;
        map.setView([lat, lng], 16);
      }
    }

    document.addEventListener('message', function(event) {
      handleMessage(event.data);
    });
    window.addEventListener('message', function(event) {
      handleMessage(event.data);
    });

    function handleMessage(data) {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'updateFirefighters') {
          // Update active alarm status and remotezy coordinates
          hasActiveAlarm = msg.hasActiveAlarm || false;
          if (msg.remotezyLat) remotezyLat = msg.remotezyLat;
          if (msg.remotezyLng) remotezyLng = msg.remotezyLng;
          
          // Update all firefighter locations
          msg.locations.forEach(function(loc) {
            var isCurrentUser = msg.currentFirefighterId && loc.firefighter_id === msg.currentFirefighterId;
            updateFirefighterMarker(loc.firefighter_id, loc.lat, loc.lng, loc.firefighterName, loc.firefighterSurname, isCurrentUser);
          });
          // Update nearest list
          updateNearestList(msg.locations);
        }
      } catch(e) {}
    }
  </script>
</body>
</html>
`;
}

export default function Mapa() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const { firefighterId } = useLocalSearchParams() as { firefighterId?: string };
  const [initialLocation, setInitialLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const pendingLocationsRef = useRef<FirefighterLocation[] | null>(null);
  const [firefighters, setFirefighters] = useState<Firefighter[]>([]);
  const { activeAlarm } = useAlarmContext();
  const [confirmedFirefighterIds, setConfirmedFirefighterIds] = useState<Set<number>>(new Set());

  // Fetch confirmed firefighters when alarm is active
  useEffect(() => {
    let mounted = true;
    
    if (!activeAlarm) {
      setConfirmedFirefighterIds(new Set());
      return;
    }

    async function fetchConfirmed() {
      try {
        if (!activeAlarm) return;
        const res = await fetch(`http://qubis.pl:4000/api/alarm-response/${activeAlarm.id}/stats`);
        if (!res.ok) return;
        const data = await res.json();
        const responses = data.responses || [];
        const confirmedIds = new Set<number>(
          responses
            .filter((r: any) => r.response_type === 'TAK')
            .map((r: any) => Number(r.firefighter_id))
        );
        if (mounted) {
          setConfirmedFirefighterIds(confirmedIds);
        }
      } catch (error) {
        console.error('Error fetching confirmed firefighters:', error);
      }
    }

    fetchConfirmed();
    return () => { mounted = false; };
  }, [activeAlarm]);

  // Fetch firefighters list once
  useEffect(() => {
    let mounted = true;
    async function fetchFirefighters() {
      try {
        const res = await fetch('http://qubis.pl:4000/api/firefighters-extended');
        const data = await res.json();
        if (mounted) {
          setFirefighters(Array.isArray(data) ? data : []);
        }
      } catch (error) {
      }
    }
    fetchFirefighters();
    return () => { mounted = false; };
  }, []);

  // Fetch and update firefighter locations
  useEffect(() => {
    let mounted = true;

    async function fetchLocations() {
      if (!mounted) return;
      try {
        const res = await fetch(API_ENDPOINTS.location.all);
        const locations: FirefighterLocation[] = await res.json();
        
        if (!mounted) return;

        const currentId = firefighterId ? parseInt(firefighterId, 10) : null;
        
        // Filtruj lokalizacje:
        // - Jeśli jest aktywny alarm: pokaż TYLKO strażaków którzy potwierdzili (TAK)
        // - Jeśli nie ma alarmu: pokaż tylko zalogowanego
        let filteredLocations = locations;
        if (activeAlarm && confirmedFirefighterIds.size > 0) {
          filteredLocations = locations.filter(loc => confirmedFirefighterIds.has(loc.firefighter_id));
        } else if (!activeAlarm) {
          filteredLocations = locations.filter(loc => loc.firefighter_id === currentId);
        }
        
        // Ustaw początkową lokalizację na zalogowanego strażaka
        if (!initialLocation && currentId) {
          const userLocation = locations.find(loc => loc.firefighter_id === currentId);
          if (userLocation) {
            setInitialLocation({ lat: userLocation.lat, lng: userLocation.lng });
            // Zapisz lokalizacje do wysłania po załadowaniu WebView
            pendingLocationsRef.current = locations;
            return; // Poczekaj na przeładowanie WebView
          }
        }
        
        if (!webViewRef.current) return;
        
        // Połącz lokalizacje z nazwami strażaków
        const locationsWithNames = filteredLocations.map(loc => {
          const firefighter = firefighters.find(f => f.id === loc.firefighter_id);
          return {
            ...loc,
            firefighterName: firefighter?.name || `Strażak #${loc.firefighter_id}`,
            firefighterSurname: firefighter?.surname || ''
          };
        });
        
        const message = JSON.stringify({
          type: 'updateFirefighters',
          locations: locationsWithNames,
          currentFirefighterId: currentId,
          hasActiveAlarm: !!activeAlarm,
          remotezyLat: 49.742863,  // Coordinates of remotezy (fire station)
          remotezyLng: 20.627574,
        });
        
        webViewRef.current.postMessage(message);
      } catch (error) {
        // Ignore errors
      }
    }

    // Fetch immediately
    fetchLocations();

    pollIntervalRef.current = setInterval(fetchLocations, POLL_INTERVAL_MS) as unknown as number;

    return () => {
      mounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [firefighterId, activeAlarm]);

  // Wyślij dane do mapy gdy WebView jest gotowy
  useEffect(() => {
    if (isWebViewReady && pendingLocationsRef.current && webViewRef.current) {
      const currentId = firefighterId ? parseInt(firefighterId, 10) : null;
      
      // Filtruj lokalizacje: przy alarmie pokaż wszystkich, bez alarmu tylko siebie
      let filteredLocations = pendingLocationsRef.current;
      if (!activeAlarm) {
        filteredLocations = filteredLocations.filter(loc => loc.firefighter_id === currentId);
      }
      
      // Połącz lokalizacje z nazwami strażaków
      const locationsWithNames = filteredLocations.map(loc => {
        const firefighter = firefighters.find(f => f.id === loc.firefighter_id);
        return {
          ...loc,
          firefighterName: firefighter?.name || `Strażak #${loc.firefighter_id}`,
          firefighterSurname: firefighter?.surname || ''
        };
      });
      
      const message = JSON.stringify({
        type: 'updateFirefighters',
        locations: locationsWithNames,
        currentFirefighterId: currentId,
        hasActiveAlarm: !!activeAlarm,
        remotezyLat: 49.742863,
        remotezyLng: 20.627574,
      });
      
      webViewRef.current.postMessage(message);
      pendingLocationsRef.current = null;
    }
  }, [isWebViewReady, firefighterId, firefighters, activeAlarm]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, [router]);

  function onMessage(event: any) {
    // Message handler
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: generateLeafletHTML(initialLocation?.lat, initialLocation?.lng) }}
        key={initialLocation ? 'with-location' : 'default'}
        style={styles.map}
        onMessage={onMessage}
        onLoadEnd={() => setIsWebViewReady(true)}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

