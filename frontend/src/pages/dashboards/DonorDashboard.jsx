import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { donationApi } from '../../services/api';
import DonationForm from '../../components/donor/DonationForm';
import DonationList from '../../components/donor/DonationList';
import AlertMessage from '../../components/common/AlertMessage';

/**
 * Donor dashboard view displaying donation management, creation form, and stats
 */
const DonorDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const loadDonations = async () => {
    try {
      setError('');
      const response = await donationApi.getMyDonations();
      if (response?.data?.donations) {
        setDonations(response.data.donations);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch your donations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    donationApi
      .getMyDonations()
      .then((response) => {
        if (isMounted && response?.data?.donations) {
          setDonations(response.data.donations);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch your donations.');
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
  }, []);

  const handleCreateSuccess = (newDonation) => {
    setDonations((prev) => [newDonation, ...prev]);
    setShowForm(false);
    setSuccessMessage(`"${newDonation.foodName}" has been listed successfully!`);
  };

  // Compute live metrics
  const activeCount = donations.filter((d) => d.status === 'available').length;
  const completedCount = donations.filter((d) => d.status === 'delivered').length;
  const totalMeals = donations.reduce((sum, d) => sum + (Number(d.quantityMeals) || 0), 0);

  return (
    <div className="container py-4">
      {/* Header Profile Section */}
      <div
        className="bg-white p-4 shadow-sm mb-4"
        style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
      >
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
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
                Donor
              </span>
            </div>
            <p className="text-muted small mb-0 mt-1">
              {user?.organization ? `Organization: ${user.organization}` : 'Individual Donor'}
              {user?.phone ? ` • Contact: ${user.phone}` : ''}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-success fw-semibold shadow-sm d-flex align-items-center gap-1"
            onClick={() => {
              setShowForm(true);
              setSuccessMessage('');
            }}
          >
            <span>+</span> Create Food Donation
          </button>
        </div>
      </div>

      <AlertMessage
        type="success"
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />
      <AlertMessage message={error} onClose={() => setError('')} />

      {/* Donation Creation Form */}
      {showForm && (
        <DonationForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Summary Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div
            className="card shadow-sm h-100 bg-white"
            style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
          >
            <div className="card-body">
              <span className="text-muted small text-uppercase fw-semibold">Active Listings</span>
              <h3 className="fw-bold mt-1 mb-0">{activeCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div
            className="card shadow-sm h-100 bg-white"
            style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
          >
            <div className="card-body">
              <span className="text-muted small text-uppercase fw-semibold">Completed Deliveries</span>
              <h3 className="fw-bold mt-1 mb-0">{completedCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div
            className="card shadow-sm h-100 bg-white"
            style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
          >
            <div className="card-body">
              <span className="text-muted small text-uppercase fw-semibold">Total Meals Rescued</span>
              <h3 className="fw-bold mt-1 mb-0">{totalMeals}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Donations List Section */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Your Food Listings</h5>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={loadDonations}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      <DonationList donations={donations} loading={loading} />
    </div>
  );
};

export default DonorDashboard;
