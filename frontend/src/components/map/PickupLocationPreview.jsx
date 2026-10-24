import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { donationApi } from '../../services/api';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Small map preview with full-size expandable modal and live location broadcaster for collectors
 */
const PickupLocationPreview = ({ pickup }) => {
  const previewRef = useRef(null);
  const fullMapRef = useRef(null);
  const previewInstanceRef = useRef(null);
  const fullMapInstanceRef = useRef(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastNotice, setBroadcastNotice] = useState('');
  const [hasArrived, setHasArrived] = useState(Boolean(pickup.collectorLocation?.isArrived));
  const [arriving, setArriving] = useState(false);

  const lat = pickup.location?.latitude;
  const lon = pickup.location?.longitude;
  const hasCoordinates = typeof lat === 'number' && typeof lon === 'number';

  // Small Preview Map
  useEffect(() => {
    if (!hasCoordinates || !previewRef.current) return;

    if (!previewInstanceRef.current) {
      try {
        const map = L.map(previewRef.current, {
          center: [lat, lon],
          zoom: 14,
          zoomControl: false,
          dragging: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OSM',
          maxZoom: 18
        }).addTo(map);

        L.marker([lat, lon], { icon: markerIcon }).addTo(map);
        previewInstanceRef.current = map;
      } catch (err) {
        console.warn('Preview map notice:', err.message);
      }
    }

    return () => {
      if (previewInstanceRef.current) {
        previewInstanceRef.current.remove();
        previewInstanceRef.current = null;
      }
    };
  }, [hasCoordinates, lat, lon]);

  // Full Expanded Modal Map
  useEffect(() => {
    if (!isExpanded || !hasCoordinates || !fullMapRef.current) return;

    const timer = setTimeout(() => {
      if (!fullMapInstanceRef.current && fullMapRef.current) {
        try {
          const fullMap = L.map(fullMapRef.current, {
            center: [lat, lon],
            zoom: 15
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
          }).addTo(fullMap);

          L.marker([lat, lon], { icon: markerIcon })
            .addTo(fullMap)
            .bindPopup(`<b>${pickup.foodName}</b><br>${pickup.pickupAddress?.street}, ${pickup.pickupAddress?.city}`)
            .openPopup();

          fullMapInstanceRef.current = fullMap;
          fullMap.invalidateSize();
        } catch (err) {
          console.warn('Full map modal notice:', err.message);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (fullMapInstanceRef.current) {
        fullMapInstanceRef.current.remove();
        fullMapInstanceRef.current = null;
      }
    };
  }, [isExpanded, hasCoordinates, lat, lon, pickup]);

  // Automatic continuous GPS broadcasting in background (like delivery driver apps)
  useEffect(() => {
    if (!['accepted', 'picked_up'].includes(pickup.status)) return;
    if (!navigator.geolocation) return;

    let isMounted = true;

    const syncLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (!isMounted) return;
          try {
            const cLat = Number(pos.coords.latitude.toFixed(6));
            const cLon = Number(pos.coords.longitude.toFixed(6));
            const res = await donationApi.updateCollectorLocation(pickup._id, {
              latitude: cLat,
              longitude: cLon
            });
            if (isMounted) {
              const arrived = Boolean(res?.data?.data?.collectorLocation?.isArrived);
              if (arrived) {
                setHasArrived(true);
                setBroadcastNotice('🎉 Arrived at pickup spot!');
              } else {
                setBroadcastNotice(`GPS active (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
              }
            }
          } catch (err) {
            console.warn('Auto location sync notice:', err.message);
          }
        },
        (err) => {
          console.warn('Geolocation read notice:', err.message);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    };

    syncLocation();
    const intervalId = setInterval(syncLocation, 15000); // Auto-syncs every 15 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [pickup._id, pickup.status]);

  // Manual GPS Sync Fallback if needed
  const handleBroadcastLocation = () => {
    if (!navigator.geolocation) {
      setBroadcastNotice('Geolocation is not supported by your browser.');
      return;
    }

    setBroadcasting(true);
    setBroadcastNotice('Refreshing GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const cLat = Number(pos.coords.latitude.toFixed(6));
          const cLon = Number(pos.coords.longitude.toFixed(6));
          const res = await donationApi.updateCollectorLocation(pickup._id, {
            latitude: cLat,
            longitude: cLon
          });
          const arrived = Boolean(res?.data?.data?.collectorLocation?.isArrived);
          if (arrived) {
            setHasArrived(true);
            setBroadcastNotice('🎉 Arrived at pickup spot!');
          } else {
            setBroadcastNotice(`✅ Location refreshed!`);
          }
        } catch (err) {
          setBroadcastNotice(`Broadcast failed: ${err.message}`);
        } finally {
          setBroadcasting(false);
        }
      },
      (err) => {
        setBroadcasting(false);
        setBroadcastNotice(`Location error: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Explicit arrival trigger (collector clicks when at the pickup doorstep)
  const handleManualArrived = async () => {
    setArriving(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const cLat = Number(pos.coords.latitude.toFixed(6));
              const cLon = Number(pos.coords.longitude.toFixed(6));
              await donationApi.updateCollectorLocation(pickup._id, {
                latitude: cLat,
                longitude: cLon,
                isArrived: true
              });
              setHasArrived(true);
              setBroadcastNotice('🎉 Marked as Arrived at Pickup Spot!');
            } catch (err) {
              setBroadcastNotice(`Arrival update failed: ${err.message}`);
            } finally {
              setArriving(false);
            }
          },
          async () => {
            // Geolocation fallback: use pickup coordinates
            try {
              await donationApi.updateCollectorLocation(pickup._id, {
                latitude: lat || 19.076,
                longitude: lon || 72.8777,
                isArrived: true
              });
              setHasArrived(true);
              setBroadcastNotice('🎉 Marked as Arrived at Pickup Spot!');
            } catch (err) {
              setBroadcastNotice(`Arrival update failed: ${err.message}`);
            } finally {
              setArriving(false);
            }
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      } else {
        await donationApi.updateCollectorLocation(pickup._id, {
          latitude: lat || 19.076,
          longitude: lon || 72.8777,
          isArrived: true
        });
        setHasArrived(true);
        setBroadcastNotice('🎉 Marked as Arrived at Pickup Spot!');
        setArriving(false);
      }
    } catch (err) {
      setBroadcastNotice(`Arrival update failed: ${err.message}`);
      setArriving(false);
    }
  };

  if (!hasCoordinates) {
    return (
      <div className="bg-white p-2 rounded border small text-muted text-center mb-2">
        📍 Pickup address: {pickup.pickupAddress?.street}, {pickup.pickupAddress?.city}
      </div>
    );
  }

  return (
    <div className="mb-3">
      {/* Small Map Preview Container */}
      <div className="position-relative rounded border overflow-hidden" style={{ height: '140px' }}>
        <div ref={previewRef} style={{ height: '100%', width: '100%' }} />

        {/* Expand / Make Big Button */}
        <button
          type="button"
          className="btn btn-sm btn-dark position-absolute top-0 end-0 m-2 shadow-sm py-0 px-2 opacity-90"
          style={{ zIndex: 500, fontSize: '0.75rem' }}
          onClick={() => setIsExpanded(true)}
        >
          🔍 Make Big
        </button>

        <span
          className={`badge position-absolute bottom-0 start-0 m-2 shadow-sm border ${
            hasArrived ? 'bg-success text-white' : 'bg-light text-dark'
          }`}
          style={{ zIndex: 500, fontSize: '0.7rem' }}
        >
          {hasArrived ? '🎉 ARRIVED AT PICKUP' : '📍 Pickup Pin'}
        </span>
      </div>

      {/* Automatic Live GPS Status Bar for Collector */}
      {['accepted', 'picked_up'].includes(pickup.status) && (
        <div className="mt-2 bg-light p-2 rounded border d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '8px', height: '8px' }} />
            <small className="fw-semibold text-dark" style={{ fontSize: '0.74rem' }}>
              Auto-sharing GPS with Donor
            </small>
          </div>
          <div className="d-flex align-items-center gap-1">
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
              {broadcastNotice || 'GPS Active'}
            </small>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-0 px-1 ms-1"
              style={{ fontSize: '0.68rem' }}
              onClick={handleBroadcastLocation}
              disabled={broadcasting}
              title="Force refresh current GPS"
            >
              {broadcasting ? '...' : '🔄'}
            </button>
          </div>
        </div>
      )}

      {/* Arrival Action & Notification */}
      {pickup.status === 'accepted' && (
        <div className="mt-2">
          {hasArrived ? (
            <div className="alert alert-success py-1 px-2 mb-0 d-flex align-items-center justify-content-between shadow-sm">
              <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.76rem' }}>
                <span>🎉</span>
                <strong className="text-success">You have Arrived at Pickup Location!</strong>
              </div>
              <span className="badge bg-success">ARRIVED</span>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-outline-success w-100 fw-semibold d-flex align-items-center justify-content-center gap-1 shadow-sm"
              style={{ fontSize: '0.76rem' }}
              onClick={handleManualArrived}
              disabled={arriving}
            >
              <span>📍</span> {arriving ? 'Confirming Arrival...' : 'I Have Arrived at Pickup'}
            </button>
          )}
        </div>
      )}

      {/* Full-size Map Modal */}
      {isExpanded && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header py-2 bg-light">
                <h6 className="modal-title fw-bold mb-0">
                  🗺️ Pickup Location Map — {pickup.foodName}
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsExpanded(false)}
                />
              </div>
              <div className="modal-body p-0">
                <div
                  ref={fullMapRef}
                  style={{ height: '380px', width: '100%' }}
                />
              </div>
              <div className="modal-footer py-2 d-flex justify-content-between align-items-center">
                <div className="small text-muted">
                  📍 {pickup.pickupAddress?.street}, {pickup.pickupAddress?.city}
                </div>
                <div className="d-flex gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    Open in Google Maps
                  </a>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setIsExpanded(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickupLocationPreview;
