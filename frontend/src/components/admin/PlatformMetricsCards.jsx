/**
 * PlatformMetricsCards - Renders high-level platform impact and community KPIs
 */
const PlatformMetricsCards = ({ analytics }) => {
  if (!analytics) return null;

  const { users, donations, impact } = analytics;

  return (
    <div className="row g-3 mb-4">
      {/* Total Meals Rescued */}
      <div className="col-12 col-sm-6 col-lg-3">
        <div
          className="card shadow-sm h-100 bg-white"
          style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
        >
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small text-uppercase fw-semibold">
                Meals Rescued
              </span>
              <span className="fs-5">🍲</span>
            </div>
            <h2 className="fw-bold text-success mb-1">
              {impact?.totalMealsRescued?.toLocaleString() || 0}
            </h2>
            <p className="text-muted small mb-0">
              From {impact?.deliveredCount || 0} delivered donations
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Completion Rate */}
      <div className="col-12 col-sm-6 col-lg-3">
        <div
          className="card shadow-sm h-100 bg-white"
          style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
        >
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small text-uppercase fw-semibold">
                Completion Rate
              </span>
              <span className="fs-5">📈</span>
            </div>
            <h2 className="fw-bold text-success mb-1">
              {impact?.deliveryCompletionRate || 0}%
            </h2>
            <p className="text-muted small mb-0">
              {impact?.deliveredCount || 0} of {impact?.claimedTotal || 0} claimed deliveries
            </p>
          </div>
        </div>
      </div>

      {/* Active Food Donations */}
      <div className="col-12 col-sm-6 col-lg-3">
        <div
          className="card shadow-sm h-100 bg-white"
          style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
        >
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small text-uppercase fw-semibold">
                Total Listings
              </span>
              <span className="fs-5">📦</span>
            </div>
            <h2 className="fw-bold text-dark mb-1">
              {donations?.total || 0}
            </h2>
            <p className="text-muted small mb-0">
              <span className="text-success fw-semibold">{donations?.available || 0}</span> available now
            </p>
          </div>
        </div>
      </div>

      {/* Platform Community */}
      <div className="col-12 col-sm-6 col-lg-3">
        <div
          className="card shadow-sm h-100 bg-white"
          style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
        >
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small text-uppercase fw-semibold">
                Total Users
              </span>
              <span className="fs-5">👥</span>
            </div>
            <h2 className="fw-bold text-dark mb-1">
              {users?.total || 0}
            </h2>
            <p className="text-muted small mb-0">
              {users?.donors || 0} donors • {users?.volunteers || 0} vols • {users?.ngos?.verified || 0} NGOs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformMetricsCards;
