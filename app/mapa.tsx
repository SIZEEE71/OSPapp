import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { API_ENDPOINTS } from "./config/api";
import colors from "./theme";

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


    // Function to fetch hydrants from Overpass API
    async function fetchHydrants() {
      try {
        // Fixed bounds for Łososina Dolna gmina (voivodeship: Małopolskie)
        // Center: 49.741641, 20.625104
        let south = 49.7016;
        let west = 20.5551;
        let north = 49.7816;
        let east = 20.6951;
        
        // Use different format for better results
        const query = '[out:json];(node["emergency"="fire_hydrant"](' + south + ',' + west + ',' + north + ',' + east + '););out geom;';
        const url = 'https://overpass-api.de/api/interpreter';
        
        addDebug('Sending query to Overpass...');
        
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

    function updateFirefighterMarker(id, lat, lng, firefighterName, isCurrentUser) {
      const key = 'firefighter_' + id;
      if (markers[key]) {
        map.removeLayer(markers[key]);
      }
      
      // Store current user location for route calculation
      if (isCurrentUser) {
        currentUserLat = lat;
        currentUserLng = lng;
      }
      
      // Different colored marker for each firefighter
      const colors = ['red', 'blue', 'green', 'orange', 'purple', 'darkred', 'darkblue', 'darkgreen'];
      const color = colors[id % colors.length];
      
      const icon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' + color + '.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      
      const marker = L.marker([lat, lng], { icon: icon }).addTo(map);
      marker.bindPopup(firefighterName);
      markers[key] = marker;
      
      // Auto-zoom to current user on first load
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
          // Update all firefighter locations
          msg.locations.forEach(function(loc) {
            var isCurrentUser = msg.currentFirefighterId && loc.firefighter_id === msg.currentFirefighterId;
            updateFirefighterMarker(loc.firefighter_id, loc.lat, loc.lng, loc.firefighterName, isCurrentUser);
          });
        }
      } catch(e) {}
    }
  </script>
</body>
</html>
`;
}

export default function Mapa() {
  const webViewRef = useRef<WebView>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const { firefighterId } = useLocalSearchParams() as { firefighterId?: string };
  const [initialLocation, setInitialLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const pendingLocationsRef = useRef<FirefighterLocation[] | null>(null);
  const [firefighters, setFirefighters] = useState<Firefighter[]>([]);

  // Fetch firefighters list once
  useEffect(() => {
    let mounted = true;
    async function fetchFirefighters() {
      try {
        const res = await fetch(API_ENDPOINTS.firefighters.list);
        const data = await res.json();
        if (mounted) {
          setFirefighters(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        // Ignore errors
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
        const locationsWithNames = locations.map(loc => {
          const firefighter = firefighters.find(f => f.id === loc.firefighter_id);
          return {
            ...loc,
            firefighterName: firefighter?.name || `Strażak #${loc.firefighter_id}`
          };
        });
        
        const message = JSON.stringify({
          type: 'updateFirefighters',
          locations: locationsWithNames,
          currentFirefighterId: currentId,
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
  }, [firefighterId]);

  // Wyślij dane do mapy gdy WebView jest gotowy
  useEffect(() => {
    if (isWebViewReady && pendingLocationsRef.current && webViewRef.current) {
      const currentId = firefighterId ? parseInt(firefighterId, 10) : null;
      
      // Połącz lokalizacje z nazwami strażaków
      const locationsWithNames = pendingLocationsRef.current.map(loc => {
        const firefighter = firefighters.find(f => f.id === loc.firefighter_id);
        return {
          ...loc,
          firefighterName: firefighter?.name || `Strażak #${loc.firefighter_id}`
        };
      });
      
      const message = JSON.stringify({
        type: 'updateFirefighters',
        locations: locationsWithNames,
        currentFirefighterId: currentId,
      });
      
      webViewRef.current.postMessage(message);
      pendingLocationsRef.current = null; // Wyczyść pending
    }
  }, [isWebViewReady, firefighterId, firefighters]);

  function onMessage(event: any) {
    // Message handler - currently unused since click markers are disabled
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  hintRow: { position: "absolute", top: 50, left: 12, right: 12, alignItems: "center", zIndex: 1000 },
  hintText: { backgroundColor: colors.surface, padding: 8, borderRadius: 8, color: colors.text, opacity: 0.9 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "92%", backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.surfaceDivider },
  modalTitle: { fontWeight: "700", fontSize: 18, marginBottom: 8, color: colors.text },
  modalLabel: { color: colors.textMuted, marginTop: 8 },
  modalCoord: { marginTop: 4, color: colors.text },
  input: { marginTop: 8, borderWidth: 1, borderColor: colors.surfaceDivider, borderRadius: 8, padding: 8, backgroundColor: colors.background },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  btn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginLeft: 8 },
  btnPrimary: { backgroundColor: colors.headerBackground },
  btnSecondary: { backgroundColor: colors.surfaceBorder },
});
