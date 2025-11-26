import React, { useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import colors from "./theme";

const API_URL = 'http://qubis.pl:4000/api/location/all';
const POLL_INTERVAL_MS = 5000; // 5 seconds

interface FirefighterLocation {
  firefighter_id: number;
  lat: number;
  lng: number;
  label: string | null;
  updated_at: string;
}

const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([52.2297, 21.0122], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const markers = {};

    // Function to add/update a firefighter marker
    function updateFirefighterMarker(id, lat, lng, label) {
      const key = 'firefighter_' + id;
      if (markers[key]) {
        map.removeLayer(markers[key]);
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
      const popupText = label || ('Strażak #' + id);
      marker.bindPopup(popupText);
      markers[key] = marker;
    }

    map.on('click', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'click',
        lat: e.latlng.lat,
        lng: e.latlng.lng
      }));
    });

    document.addEventListener('message', function(event) {
      handleMessage(event.data);
    });
    window.addEventListener('message', function(event) {
      handleMessage(event.data);
    });

    function handleMessage(data) {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'addMarker') {
          const key = msg.lat + ',' + msg.lng;
          if (markers[key]) {
            map.removeLayer(markers[key]);
          }
          const marker = L.marker([msg.lat, msg.lng]).addTo(map);
          if (msg.label) {
            marker.bindPopup(msg.label).openPopup();
          }
          markers[key] = marker;
        } else if (msg.type === 'updateFirefighters') {
          // Update all firefighter locations
          msg.locations.forEach(function(loc) {
            updateFirefighterMarker(loc.firefighter_id, loc.lat, loc.lng, loc.label);
          });
        }
      } catch(e) {}
    }
  </script>
</body>
</html>
`;

export default function Mapa() {
  const webViewRef = useRef<WebView>(null);
  const [editing, setEditing] = useState<{ lat: number; lng: number } | null>(null);
  const [tempLabel, setTempLabel] = useState("");
  const pollIntervalRef = useRef<number | null>(null);

  // Fetch and update firefighter locations
  useEffect(() => {
    let mounted = true;

    async function fetchLocations() {
      if (!mounted) return;
      try {
        const res = await fetch(API_URL);
        const locations: FirefighterLocation[] = await res.json();
        
        if (!mounted || !webViewRef.current) return;

        const message = JSON.stringify({
          type: 'updateFirefighters',
          locations: locations,
        });
        webViewRef.current.postMessage(message);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    }

    // Fetch immediately
    fetchLocations();

    // Then poll every POLL_INTERVAL_MS
    pollIntervalRef.current = setInterval(fetchLocations, POLL_INTERVAL_MS) as unknown as number;

    return () => {
      mounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  function onMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'click') {
        setEditing({ lat: msg.lat, lng: msg.lng });
        setTempLabel("");
      }
    } catch (err) {
      console.warn('Map message error', err);
    }
  }

  function saveMarker() {
    if (!editing) return;
    const message = JSON.stringify({
      type: 'addMarker',
      lat: editing.lat,
      lng: editing.lng,
      label: tempLabel
    });
    webViewRef.current?.postMessage(message);
    setEditing(null);
    setTempLabel("");
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHTML }}
        style={styles.map}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
      />

      <View style={styles.hintRow}>
        <Text style={styles.hintText}>Kliknij na mapie, aby dodać znacznik</Text>
      </View>

      <Modal visible={editing !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Dodaj znacznik</Text>
            <Text style={styles.modalLabel}>Współrzędne:</Text>
            <Text style={styles.modalCoord}>
              {editing ? `${editing.lat.toFixed(6)}, ${editing.lng.toFixed(6)}` : ""}
            </Text>
            <Text style={styles.modalLabel}>Etykieta:</Text>
            <TextInput
              value={tempLabel}
              onChangeText={setTempLabel}
              placeholder="np. Miejsce zdarzenia"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setEditing(null)}>
                <Text>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={saveMarker}>
                <Text style={{ color: colors.surface }}>Zapisz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
