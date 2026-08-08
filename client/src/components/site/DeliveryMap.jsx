import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet's default _getIconUrl() re-derives icon paths from its own bundled
// CSS and stacks that onto the URLs below, producing a doubled/broken path
// under Vite. Deleting it forces every Icon.Default to use iconUrl/
// iconRetinaUrl/shadowUrl exactly as merged in here.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

export const FARM_CENTER = [14.3585, 120.8155];

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapInstanceCapture({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    if (mapRef) mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

export function DeliveryMap({ position, onPick, mapRef, interactive = true }) {
  return (
    <MapContainer
      center={position || FARM_CENTER}
      zoom={position ? 15 : 13}
      className="leaflet-pin-map mb-2"
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {interactive && <ClickHandler onPick={onPick} />}
      <MapInstanceCapture mapRef={mapRef} />
      {position && (
        <Marker
          position={position}
          draggable={interactive}
          eventHandlers={
            interactive
              ? {
                  dragend: (e) => {
                    const pos = e.target.getLatLng();
                    onPick(pos.lat, pos.lng);
                  },
                }
              : undefined
          }
        />
      )}
    </MapContainer>
  );
}
