import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function App() {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={[26.9124, 75.7873]} // Jaipur coords
        zoom={10}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[26.9124, 75.7873]}>
          <Popup>🚉 Jaipur Junction</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

export default App
