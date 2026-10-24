import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CommunityLeaderboard from '../components/leaderboard/CommunityLeaderboard';
import logo from '../assets/logo.png';

/**
 * Public landing page explaining the platform purpose and user roles
 */
const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="container py-5">
      {/* Hero Section */}
      <div className="text-center py-5 bg-white rounded-3 shadow-sm p-4 mb-5 border">
        <div className="mb-3">
          <img
            src={logo}
            alt="Annapurna Logo"
            width="88"
            height="88"
            className="rounded-circle shadow-sm p-1 border"
            style={{ objectFit: 'contain' }}
          />
        </div>
        <h1 className="fw-bold text-success mb-2">Annapurna</h1>
        <p className="lead text-secondary fw-normal mb-3">
          Save Food. Share Hope.
        </p>
        <p className="mx-auto text-muted mb-4" style={{ maxWidth: '640px' }}>
          A hyperlocal food rescue network connecting surplus food from restaurants,
          wedding organizers, hotels, and individuals to verified NGOs and volunteers
          who distribute meals to those in need.
        </p>

        <div className="d-flex justify-content-center gap-3">
          {isAuthenticated ? (
            <Link to={`/${user.role}/dashboard`} className="btn btn-success btn-lg px-4">
              Go to Your Dashboard ({user.role})
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-success btn-lg px-4">
                Register to Help
              </Link>
              <Link to="/login" className="btn btn-outline-secondary btn-lg px-4">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Role Feature Cards */}
      <h2 className="text-center h4 fw-bold mb-4">Choose How You Want to Make an Impact</h2>
      <div className="row g-4 mb-5">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100 shadow-sm border rounded-3 bg-white">
            <div className="card-body">
              <div className="fs-2 mb-2">🏪</div>
              <h5 className="card-title fw-bold">Donors</h5>
              <p className="card-text text-muted small">
                Restaurants, event hosts, and individuals listing fresh surplus food before it goes to waste.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100 shadow-sm border rounded-3 bg-white">
            <div className="card-body">
              <div className="fs-2 mb-2">🤝</div>
              <h5 className="card-title fw-bold">NGOs</h5>
              <p className="card-text text-muted small">
                Verified relief organizations finding nearby food listings and distributing meals safely.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100 shadow-sm border rounded-3 bg-white">
            <div className="card-body">
              <div className="fs-2 mb-2">🚴</div>
              <h5 className="card-title fw-bold">Volunteers</h5>
              <p className="card-text text-muted small">
                Community heroes accepting hyperlocal pickup tasks and completing last-mile delivery.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100 shadow-sm border rounded-3 bg-white">
            <div className="card-body">
              <div className="fs-2 mb-2">🛡️</div>
              <h5 className="card-title fw-bold">Platform Admin</h5>
              <p className="card-text text-muted small">
                Verifying NGO credentials, maintaining platform safety, and tracking community impact.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Recognition & Leaderboard Section */}
      <CommunityLeaderboard />

      {/* Call to Action Footer Box */}
      <div className="rounded-3 p-4 p-md-5 text-center shadow-sm text-white" style={{ backgroundColor: '#1b4332' }}>
        <h3 className="fw-bold mb-2">Join the Movement to Stop Food Waste</h3>
        <p className="mx-auto mb-4 text-white-50" style={{ maxWidth: '550px' }}>
          Whether you have extra meals to share or time to deliver, every single effort feeds a neighbor in need.
        </p>
        {!isAuthenticated && (
          <Link to="/register" className="btn btn-light btn-lg px-4 fw-semibold text-success shadow-sm">
            Get Started Today — It's Free
          </Link>
        )}
      </div>
    </div>
  );
};

export default HomePage;
