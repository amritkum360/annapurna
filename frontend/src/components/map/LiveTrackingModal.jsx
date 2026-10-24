import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { donationApi } from '../../services/api';
import AlertMessage from '../common/AlertMessage';

// Green icon for pickup/donor location
const donorPinIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Blue/orange icon for collector live location
const collectorPinIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Live tracking modal showing donor pickup point and moving collector live location
 */
const LiveTrackingModal = ({ donation, onClose }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef(null);

  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshTracking = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await donationApi.getTracking(donation._id);
      if (res?.data?.tracking) {
        setTrackingData(res.data.tracking);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    donationApi
      .getTracking(donation._id)
      .then((res) => {
        if (isMounted && res?.data?.tracking) {
          setTrackingData(res.data.tracking);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch tracking details.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [donation._id]);

  // Render Leaflet map with both markers and bounds
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [19.076, 72.8777],
        zoom: 13
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      layersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layersRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const pLat = donation.location?.latitude || trackingData?.location?.latitude;
    const pLon = donation.location?.longitude || trackingData?.location?.longitude;

    const cLat = trackingData?.collectorLocation?.latitude;
    const cLon = trackingData?.collectorLocation?.longitude;

    const bounds = [];

    // 1. Add Pickup Location Marker
    if (typeof pLat === 'number' && typeof pLon === 'number') {
      bounds.push([pLat, pLon]);
      L.marker([pLat, pLon], { icon: donorPinIcon })
        .addTo(layerGroup)
        .bindPopup(`<b>📍 Pickup Location</b><br>${donation.foodName}`);
    }

    // 2. Add Collector Live Location Marker
    if (typeof cLat === 'number' && typeof cLon === 'number') {
      bounds.push([cLat, cLon]);
      const collectorName = trackingData?.collector?.name || 'Collector';
      const isArrivedPin = Boolean(trackingData?.collectorLocation?.isArrived);
      const popupContent = isArrivedPin
        ? `<b>🎉 ${collectorName} HAS ARRIVED!</b><br>At your pickup location`
        : `<b>🚚 ${collectorName}'s Live Location</b><br>In transit to pickup / delivery`;

      L.marker([cLat, cLon], { icon: collectorPinIcon })
        .addTo(layerGroup)
        .bindPopup(popupContent)
        .openPopup();

      // Draw dashed route line between collector and pickup
      if (bounds.length === 2) {
        L.polyline(bounds, {
          color: '#fd7e14',
          weight: 4,
          dashArray: '6, 8'
        }).addTo(layerGroup);
      }
    }

    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      } else {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      setTimeout(() => map.invalidateSize(), 200);
    }
  }, [trackingData, donation]);

  const collector = trackingData?.collector || donation.claimedBy;
  const collectorLoc = trackingData?.collectorLocation;
  const hasCollectorLoc = collectorLoc && typeof collectorLoc.latitude === 'number';
  const isArrived = Boolean(collectorLoc?.isArrived);
  const collectorPhone = (collector?.phone && collector.phone.trim())
    ? collector.phone.trim()
    : '+91 98200 55667';

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header py-3 bg-light">
            <div>
              <h5 className="modal-title fw-bold mb-0">
                🛰️ Live Location Tracking — {donation.foodName}
              </h5>
              <small className="text-muted">
                Status: <span className="badge bg-primary text-uppercase">{donation.status.replace('_', ' ')}</span>
              </small>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body p-0">
            <AlertMessage message={error} onClose={() => setError('')} />

            {/* Arrival Banner if Arrived */}
            {isArrived && (
              <div className="alert alert-success m-3 mb-0 py-2 text-center fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '8px', height: '8px' }} />
                🎉 ARRIVED: {collector?.name || 'Collector'} has reached your pickup spot!
              </div>
            )}

            {/* Live Map Display */}
            <div
              ref={mapContainerRef}
              style={{ height: '380px', width: '100%', zIndex: 0 }}
            />

            {/* Status Information Box */}
            <div className="p-3 bg-white border-top">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-7">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-4">{isArrived ? '🎉' : hasCollectorLoc ? '🚚' : '⏳'}</span>
                    <div>
                      <div className="fw-bold text-dark">
                        {collector ? `${collector.name} (${collector.role})` : 'Assigned Collector'}
                      </div>
                      <div className="text-muted small d-flex align-items-center flex-wrap gap-2 mt-1">
                        {collector?.organization && <span>{collector.organization}</span>}
                        <a
                          href={`tel:${collectorPhone}`}
                          className="btn btn-sm btn-success py-1 px-2 fw-semibold text-decoration-none shadow-sm text-white"
                          style={{ fontSize: '0.78rem' }}
                        >
                          📞 Call Collector ({collectorPhone})
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-5 text-md-end">
                  {isArrived ? (
                    <div>
                      <span className="badge bg-success mb-1 fs-6">🎉 ARRIVED AT LOCATION</span>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Reached at {collectorLoc.arrivedAt ? new Date(collectorLoc.arrivedAt).toLocaleTimeString() : 'Just now'}
                      </div>
                    </div>
                  ) : hasCollectorLoc ? (
                    <div>
                      <span className="badge bg-success mb-1">● Live Location Active</span>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Updated: {new Date(collectorLoc.updatedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="badge bg-warning text-dark mb-1">Waiting for GPS</span>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Collector has not broadcasted location yet.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer py-2 bg-light d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={refreshTracking}
              disabled={loading}
            >
              🔄 Refresh Location
            </button>
            <button type="button" className="btn btn-sm btn-secondary px-4" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingModal;
