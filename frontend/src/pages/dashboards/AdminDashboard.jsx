import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../services/api';
import PlatformMetricsCards from '../../components/admin/PlatformMetricsCards';
import NgoVerificationTable from '../../components/admin/NgoVerificationTable';
import DonationStatusBreakdown from '../../components/admin/DonationStatusBreakdown';
import AlertMessage from '../../components/common/AlertMessage';

/**
 * Platform admin dashboard view for managing NGO verifications and platform analytics
 */
const AdminDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [ngoFilter, setNgoFilter] = useState('pending');
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingNgos, setLoadingNgos] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await adminApi.getAnalytics();
      if (res?.data?.analytics) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      setError(err.message || 'Failed to load platform analytics.');
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const fetchNgos = useCallback(async (filter) => {
    try {
      setLoadingNgos(true);
      const res = await adminApi.getNgos(filter);
      if (res?.data?.ngos) {
        setNgos(res.data.ngos);
      }
    } catch (err) {
      setError(err.message || 'Failed to load NGO accounts.');
    } finally {
      setLoadingNgos(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    adminApi
      .getAnalytics()
      .then((res) => {
        if (isMounted && res?.data?.analytics) {
          setAnalytics(res.data.analytics);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load platform analytics.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingAnalytics(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    adminApi
      .getNgos(ngoFilter)
      .then((res) => {
        if (isMounted && res?.data?.ngos) {
          setNgos(res.data.ngos);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load NGO accounts.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingNgos(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ngoFilter]);

  const handleVerify = async (id, status, notes) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');
      const res = await adminApi.verifyNgo(id, { status, notes });
      setSuccessMessage(res.message || `NGO status updated to ${status}.`);
      await Promise.all([fetchNgos(ngoFilter), fetchAnalytics()]);
    } catch (err) {
      setError(err.message || 'Failed to update NGO verification status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    setError('');
    setSuccessMessage('');
    await Promise.all([fetchAnalytics(), fetchNgos(ngoFilter)]);
  };

  return (
    <div className="container py-4">
      {/* Header Profile Section */}
      <div className="bg-white p-4 rounded-3 shadow-sm border mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h2 className="h4 fw-bold mb-0">Platform Admin, {user?.name}</h2>
              <span className="badge bg-dark text-uppercase">Admin</span>
            </div>
            <p className="text-muted small mb-0 mt-1">
              Admin Access: {user?.email}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={handleRefresh}
            disabled={loadingAnalytics || loadingNgos}
          >
            <span>🔄</span> Refresh Data
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <AlertMessage
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}
      {error && (
        <AlertMessage
          type="danger"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {/* Live Impact Analytics Cards */}
      {loadingAnalytics && !analytics ? (
        <div className="card border-0 shadow-sm p-4 text-center mb-4">
          <div className="spinner-border text-primary spinner-border-sm mx-auto mb-2" role="status" />
          <p className="text-muted small mb-0">Computing platform metrics...</p>
        </div>
      ) : (
        <PlatformMetricsCards analytics={analytics} />
      )}

      {/* NGO Verification Management Queue */}
      <NgoVerificationTable
        ngos={ngos}
        filter={ngoFilter}
        onFilterChange={setNgoFilter}
        onVerify={handleVerify}
        loading={loadingNgos}
        actionLoading={actionLoading}
      />

      {/* Donation Status Breakdown & Recent Activity */}
      {analytics && (
        <DonationStatusBreakdown
          donations={analytics.donations}
          recentActivity={analytics.recentActivity}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
