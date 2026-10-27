import { useEffect, useState } from "react";
import "./BusMap.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const busIcon = L.divIcon({
  className: "bus-marker-wrapper",
  html: `<div class="bus-marker">🚌</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const initialBuses = [
  {
    id: "BUS-001",
    operator: "SBSTC",
    route: "Kolkata → Durgapur",
    lat: 22.5726,
    lng: 88.3639,
    speed: 42,
  },
  {
    id: "BUS-002",
    operator: "WBTC",
    route: "Howrah → Esplanade",
    lat: 22.5958,
    lng: 88.2636,
    speed: 28,
  },
  {
    id: "BUS-003",
    operator: "SBSTC",
    route: "Digha → Kolkata",
    lat: 21.627,
    lng: 87.508,
    speed: 55,
  },
];

function MapFocus({ bus }) {
  const map = useMap();

  useEffect(() => {
    if (bus) {
      map.flyTo([bus.lat, bus.lng], 10, {
        duration: 1,
      });
    }
  }, [bus, map]);

  return null;
}

export default function BusMap({
  selectedBus,
  onSelectBus,
}) {
  const [buses, setBuses] = useState(initialBuses);

  useEffect(() => {
    const timer = setInterval(() => {
      setBuses((current) =>
        current.map((bus) => ({
          ...bus,
          lat: bus.lat + (Math.random() - 0.5) * 0.001,
          lng: bus.lng + (Math.random() - 0.5) * 0.001,
        }))
      );
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const selected = buses.find(
    (bus) => bus.id === selectedBus
  );

  return (
    <MapContainer
      center={[22.8, 88.0]}
      zoom={8}
      scrollWheelZoom
      className="real-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {buses.map((bus) => (
        <Marker
          key={bus.id}
          position={[bus.lat, bus.lng]}
          icon={busIcon}
          eventHandlers={{
            click: () => onSelectBus(bus.id),
          }}
        >
          <Popup>
            <strong>{bus.operator}</strong>
            <br />
            {bus.route}
            <br />
            Speed: {bus.speed} km/h
            <br />
            <span>Simulated location</span>
          </Popup>
        </Marker>
      ))}

      <MapFocus bus={selected} />
    </MapContainer>
  );
}
