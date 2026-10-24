import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Interactive map pin selector for donor food donation creation
 */
const LocationPickerMap = ({ latitude, longitude, onLocationChange }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const defaultLat = latitude || 19.076;
  const defaultLon = longitude || 72.8777;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      try {
        const initialLat = defaultLat;
        const initialLon = defaultLon;

        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLon],
          zoom: latitude ? 14 : 11
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map);

        const marker = L.marker([initialLat, initialLon], {
          icon: pinIcon,
          draggable: true
        }).addTo(map);

        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationChangeRef.current?.(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
        });

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onLocationChangeRef.current?.(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
        });

        markerRef.current = marker;
        mapInstanceRef.current = map;
      } catch (err) {
        console.warn('Map picker init notice:', err.message);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [defaultLat, defaultLon, latitude]);

  // Update marker position when props change
  useEffect(() => {
    if (markerRef.current && latitude && longitude) {
      markerRef.current.setLatLng([latitude, longitude]);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([latitude, longitude], 14);
      }
    }
  }, [latitude, longitude]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setStatusMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setStatusMessage('Detecting your GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));
        setIsDetecting(false);
        setStatusMessage(`Location detected: [${lat}, ${lon}]`);
        onLocationChange(lat, lon);
      },
      (err) => {
        setIsDetecting(false);
        setStatusMessage(`Could not detect location: ${err.message}. You can click the map to set the pin.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <label className="form-label small fw-semibold mb-0">
          📍 Map Pickup Pin (Click map or detect GPS)
        </label>
        <button
          type="button"
          className="btn btn-sm btn-outline-success py-0 px-2"
          onClick={handleDetectLocation}
          disabled={isDetecting}
        >
          {isDetecting ? 'Detecting...' : '📍 Detect My Location'}
        </button>
      </div>

      <div
        ref={mapContainerRef}
        className="rounded border"
        style={{ height: '170px', width: '100%', zIndex: 0 }}
      />

      <div className="d-flex justify-content-between align-items-center mt-1">
        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
          {statusMessage || 'Click anywhere on the map or drag the pin to set pickup point.'}
        </small>
        {latitude && longitude && (
          <span className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>
            {latitude}, {longitude}
          </span>
        )}
      </div>
    </div>
  );
};

export default LocationPickerMap;
