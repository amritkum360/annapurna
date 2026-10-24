import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { donationApi } from '../../services/api';

const donorPinIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [22, 36],
  iconAnchor: [11, 36],
  popupAnchor: [1, -30],
  shadowSize: [36, 36]
});

const collectorPinIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [22, 36],
  iconAnchor: [11, 36],
  popupAnchor: [1, -30],
  shadowSize: [36, 36]
});

/**
 * Embedded delivery map shown directly on the donor card (like Zepto/Swiggy delivery tracking)
 */
const EmbeddedDeliveryMap = ({ donation, onExpand }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  const [tracking, setTracking] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState('');

  // Initial fetch and auto-polling every 12 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchTracking = async () => {
      try {
        const res = await donationApi.getTracking(donation._id);
        if (isMounted && res?.data?.tracking) {
          setTracking(res.data.tracking);
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      } catch (err) {
        console.warn('Live map polling notice:', err.message);
      }
    };

    fetchTracking();

    const intervalId = setInterval(fetchTracking, 12000); // Polls every 12 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [donation._id]);

  // Leaflet map setup and marker updating
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      try {
        const initialLat = donation.location?.latitude || 19.076;
        const initialLon = donation.location?.longitude || 72.8777;

        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLon],
          zoom: 13,
          zoomControl: false,
          attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;
        mapInstanceRef.current = map;
      } catch (err) {
        console.warn('Embedded map init notice:', err.message);
      }
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const pLat = donation.location?.latitude || tracking?.location?.latitude;
    const pLon = donation.location?.longitude || tracking?.location?.longitude;
    const cLat = tracking?.collectorLocation?.latitude;
    const cLon = tracking?.collectorLocation?.longitude;

    const bounds = [];

    // 1. Pickup Pin (Green)
    if (typeof pLat === 'number' && typeof pLon === 'number') {
      bounds.push([pLat, pLon]);
      L.marker([pLat, pLon], { icon: donorPinIcon })
        .addTo(layerGroup)
        .bindPopup('<b>📍 Your Pickup Location</b>');
    }

    // 2. Collector Moving Pin (Orange)
    if (typeof cLat === 'number' && typeof cLon === 'number') {
      bounds.push([cLat, cLon]);
      const collectorName = tracking?.collector?.name || 'Collector';
      const isArrivedPin = Boolean(tracking?.collectorLocation?.isArrived);
      const popupContent = isArrivedPin
        ? `<b>🎉 ${collectorName} HAS ARRIVED!</b><br>At your pickup location`
        : `<b>🛵 ${collectorName} (Live)</b>`;

      const marker = L.marker([cLat, cLon], { icon: collectorPinIcon })
        .addTo(layerGroup)
        .bindPopup(popupContent);

      if (isArrivedPin) {
        marker.openPopup();
      }

      // Draw dashed route line
      if (bounds.length === 2) {
        L.polyline(bounds, {
          color: '#fd7e14',
          weight: 3,
          dashArray: '5, 8'
        }).addTo(layerGroup);
      }
    }

    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      } else {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
      setTimeout(() => map.invalidateSize(), 150);
    }
  }, [tracking, donation]);

  const collector = tracking?.collector || donation.claimedBy;
  const collectorLoc = tracking?.collectorLocation || donation.collectorLocation;
  const hasCollectorGps = collectorLoc && typeof collectorLoc.latitude === 'number';
  const isArrived = Boolean(collectorLoc?.isArrived);

  return (
    <div className="my-2 border rounded overflow-hidden shadow-sm bg-white">
      {/* Prominent Arrival Banner when Volunteer/NGO is near or arrived */}
      {isArrived && (
        <div className="bg-success text-white px-2 py-1 small fw-bold text-center d-flex align-items-center justify-content-center gap-1 shadow-sm">
          <span className="spinner-grow spinner-grow-sm text-light" style={{ width: '8px', height: '8px' }} />
          🎉 ARRIVED: {collector?.name || 'Collector'} has reached your pickup spot!
        </div>
      )}

      {/* Map Header Status */}
      <div className={`px-2 py-1 border-bottom d-flex justify-content-between align-items-center ${isArrived ? 'bg-success-subtle' : 'bg-light'}`}>
        <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
          <span
            className={`spinner-grow spinner-grow-sm ${
              isArrived ? 'text-success' : hasCollectorGps ? 'text-success' : 'text-warning'
            }`}
            style={{ width: '8px', height: '8px' }}
          />
          <strong className={isArrived ? 'text-success' : 'text-dark'}>
            {isArrived
              ? `🛵 Arrived: ${collector?.name || 'Collector'} is at your location!`
              : hasCollectorGps
              ? `Live: ${collector?.name || 'Collector'} is on the way`
              : `Waiting for ${collector?.name || 'Collector'}'s GPS...`}
          </strong>
        </div>
        {onExpand && (
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold text-primary"
            style={{ fontSize: '0.75rem' }}
            onClick={onExpand}
          >
            🔍 Fullscreen
          </button>
        )}
      </div>

      {/* Embedded Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{ height: '160px', width: '100%', zIndex: 0 }}
      />

      {/* Map Footer Bar */}
      <div className="px-2 py-1 bg-light border-top d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '0.72rem' }}>
        <span>
          {isArrived
            ? `📍 Collector is at your doorstep. Please hand over the food.`
            : hasCollectorGps
            ? `🟢 Auto-tracking location`
            : `📍 Showing pickup address`}
        </span>
        {lastSyncTime && <span>Synced: {lastSyncTime}</span>}
      </div>
    </div>
  );
};

export default EmbeddedDeliveryMap;
