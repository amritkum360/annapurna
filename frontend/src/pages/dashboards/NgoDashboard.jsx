import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { donationApi } from '../../services/api';
import FeedFilters from '../../components/feed/FeedFilters';
import DonationFeedCard from '../../components/feed/DonationFeedCard';
import DonationMap from '../../components/map/DonationMap';
import PickupCard from '../../components/pickups/PickupCard';
import AlertMessage from '../../components/common/AlertMessage';

/**
 * NGO dashboard view with discovery feed and accepted pickups
 */
const NgoDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'pickups'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [feed, setFeed] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [filters, setFilters] = useState({
    city: '',
    dietaryType: 'all',
    sortBy: 'urgency',
    lat: '',
    lon: '',
    maxDistance: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const isVerified = !!user?.isVerified;

  const refreshData = async () => {
    try {
      setError('');
      const [feedRes, pickupsRes] = await Promise.all([
        donationApi.getFeed(filters),
        donationApi.getMyPickups()
      ]);
      setFeed(feedRes?.data?.donations || []);
      setPickups(pickupsRes?.data?.donations || []);
    } catch (err) {
      setError(err.message || 'Failed to load donation feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([donationApi.getFeed(filters), donationApi.getMyPickups()])
      .then(([feedRes, pickupsRes]) => {
        if (isMounted) {
          setFeed(feedRes?.data?.donations || []);
          setPickups(pickupsRes?.data?.donations || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load donation feed.');
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
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      city: '',
      dietaryType: 'all',
      sortBy: 'urgency',
      lat: '',
      lon: '',
      maxDistance: ''
    });
  };

  const handleClaim = async (donation) => {
    if (!isVerified) {
      setError('Your NGO account is pending verification. Only verified NGOs can claim donations.');
      return;
    }

    try {
      setClaimingId(donation._id);
      setError('');
      const response = await donationApi.claim(donation._id);
      const claimedItem = response?.data?.donation;

      // Update local state: remove from feed, add to pickups
      setFeed((prev) => prev.filter((d) => d._id !== donation._id));
      setPickups((prev) => [claimedItem || donation, ...prev]);
      setSuccessMessage(`Successfully claimed "${donation.foodName}"!`);
      setActiveTab('pickups');
    } catch (err) {
      setError(err.message || 'Failed to claim donation.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleMarkPickedUp = async (pickup) => {
    try {
      setProcessingId(pickup._id);
      setError('');
      const response = await donationApi.markPickedUp(pickup._id);
      const updated = response?.data?.donation;

      setPickups((prev) =>
        prev.map((item) => (item._id === pickup._id ? updated || { ...item, status: 'picked_up' } : item))
      );
      setSuccessMessage(`"${pickup.foodName}" marked as picked up! In transit.`);
    } catch (err) {
      setError(err.message || 'Failed to update pickup status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDelivery = async (pickup, code, deliveryNotes) => {
    try {
      setProcessingId(pickup._id);
      setError('');
      const response = await donationApi.confirmDelivery(pickup._id, {
        confirmationCode: code,
        deliveryNotes
      });
      const updated = response?.data?.donation;

      setPickups((prev) =>
        prev.map((item) => (item._id === pickup._id ? updated || { ...item, status: 'delivered' } : item))
      );
      setSuccessMessage(`Delivery verified for "${pickup.foodName}"! Thank you for sharing hope.`);
    } catch (err) {
      setError(err.message || 'Failed to confirm delivery. Please check the code.');
    } finally {
      setProcessingId(null);
    }
  };

  const activeClaimsCount = pickups.filter((p) => p.status === 'accepted' || p.status === 'picked_up').length;
  const totalMealsDelivered = pickups
    .filter((p) => p.status === 'delivered')
    .reduce((sum, p) => sum + (Number(p.quantityMeals) || 0), 0);

  return (
    <div className="container py-4">
      {/* Header Profile Section */}
      <div
        className="bg-white p-4 shadow-sm mb-4"
        style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
      >
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h2 className="h4 fw-bold mb-0">Welcome, {user?.name}</h2>
              <span
                className="badge text-uppercase"
                style={{
                  backgroundColor: '#e9f3ed',
                  color: '#1b4332',
                  border: '1px solid #c2dec9',
                  fontWeight: 600,
                  letterSpacing: '0.5px'
                }}
              >
                NGO
              </span>
              {isVerified ? (
                <span
                  className="badge"
                  style={{
                    backgroundColor: '#e9f3ed',
                    color: '#1b4332',
                    border: '1px solid #a3cfbb',
                    fontWeight: 600
                  }}
                >
                  ✓ Verified NGO
                </span>
              ) : (
                <span className="badge bg-secondary-subtle text-secondary border">
                  Verification Pending
                </span>
              )}
            </div>
            <p className="text-muted small mb-0 mt-1">
              Organization: {user?.organization || 'Registered NGO'}
              {user?.phone ? ` • Contact: ${user.phone}` : ''}
            </p>
          </div>
        </div>
      </div>

      {!isVerified && (
        <div className="alert alert-warning shadow-sm mb-4" role="alert">
          <h6 className="alert-heading fw-bold mb-1">⚠️ Account Verification Pending</h6>
          <p className="small mb-0">
            You can browse all available food listings below, but you will only be able to claim
            donations once platform administrators have verified your NGO credentials.
          </p>
        </div>
      )}

      <AlertMessage
        type="success"
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />
      <AlertMessage message={error} onClose={() => setError('')} />

      {/* Summary Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div
            className="card shadow-sm h-100 bg-white"
            style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
          >
            <div className="card-body">
              <span className="text-muted small text-uppercase fw-semibold">Available Nearby</span>
              <h3 className="fw-bold mt-1 mb-0">{feed.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div
            className="card shadow-sm h-100 bg-white"
            style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
          >
            <div className="card-body">
              <span className="text-muted small text-uppercase fw-semibold">Active Claims</span>
              <h3 className="fw-bold mt-1 mb-0">{activeClaimsCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div
            className="card shadow-sm h-100 bg-white"
            style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
          >
            <div className="card-body">
              <span className="text-muted small text-uppercase fw-semibold">Meals Rescued</span>
              <h3 className="fw-bold mt-1 mb-0">{totalMealsDelivered}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <ul className="nav nav-pills gap-2 mb-0">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link px-4 fw-semibold ${activeTab === 'feed' ? 'active bg-success' : 'bg-white text-dark border'}`}
              onClick={() => setActiveTab('feed')}
            >
              🍲 Browse Food Feed ({feed.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link px-4 fw-semibold ${activeTab === 'pickups' ? 'active bg-success' : 'bg-white text-dark border'}`}
              onClick={() => setActiveTab('pickups')}
            >
              📦 My Pickups ({pickups.length})
            </button>
          </li>
        </ul>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={refreshData}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading donations...</span>
          </div>
        </div>
      ) : activeTab === 'feed' ? (
        <div>
          <FeedFilters
            filters={filters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />

          {viewMode === 'map' ? (
            <DonationMap
              donations={feed}
              onClaim={handleClaim}
              canClaim={isVerified}
              claimDisabledReason="NGO verification pending by admin"
            />
          ) : feed.length === 0 ? (
            <div className="card border-0 shadow-sm bg-white p-5 text-center">
              <span className="display-4 mb-2 d-block">✨</span>
              <h5 className="fw-bold text-dark">No Available Donations Found</h5>
              <p className="text-muted small mx-auto mb-0" style={{ maxWidth: '420px' }}>
                There are currently no active surplus food listings matching your filter criteria.
                Check back shortly or reset your filters.
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {feed.map((item) => (
                <div key={item._id} className="col-12 col-md-6 col-lg-4">
                  <DonationFeedCard
                    donation={item}
                    onClaim={handleClaim}
                    isClaiming={claimingId === item._id}
                    canClaim={isVerified}
                    claimDisabledReason="NGO verification pending by admin"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {pickups.length === 0 ? (
            <div className="card border-0 shadow-sm bg-white p-5 text-center">
              <span className="display-4 mb-2 d-block">📦</span>
              <h5 className="fw-bold text-dark">No Pickups Claimed Yet</h5>
              <p className="text-muted small mx-auto mb-0" style={{ maxWidth: '420px' }}>
                Switch to the "Browse Food Feed" tab to find available surplus food and claim it for distribution.
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {pickups.map((item) => (
                <div key={item._id} className="col-12 col-md-6 col-lg-4">
                  <PickupCard
                    pickup={item}
                    onMarkPickedUp={handleMarkPickedUp}
                    onConfirmDelivery={handleConfirmDelivery}
                    isProcessing={processingId === item._id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NgoDashboard;
