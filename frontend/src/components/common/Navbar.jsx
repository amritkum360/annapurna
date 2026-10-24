import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.png';

/**
 * Main application navigation bar with authentication state awareness
 */
const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'ngo':
        return '/ngo/dashboard';
      case 'volunteer':
        return '/volunteer/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/donor/dashboard';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow-sm sticky-top" style={{ backgroundColor: '#1b4332', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img
            src={logo}
            alt="Annapurna Logo"
            width="34"
            height="34"
            className="rounded-circle bg-white p-1"
            style={{ objectFit: 'contain' }}
          />
          <div>
            <div className="brand-title lh-1">Annapurna</div>
            <small className="text-light opacity-75" style={{ fontSize: '0.72rem' }}>
              Save Food. Share Hope.
            </small>
          </div>
        </Link>

        <div className="ms-auto d-flex align-items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Link
                to={getDashboardPath(user.role)}
                className="btn btn-sm btn-outline-light"
              >
                My Dashboard
              </Link>
              <div className="d-none d-md-flex flex-column text-end text-light">
                <span className="fw-semibold small">{user.name}</span>
                <span
                  className="badge text-uppercase"
                  style={{
                    fontSize: '0.65rem',
                    backgroundColor: '#e9f3ed',
                    color: '#1b4332',
                    border: '1px solid #c2dec9',
                    fontWeight: 600,
                    letterSpacing: '0.5px'
                  }}
                >
                  {user.role}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-light opacity-75"
                style={{ borderColor: 'rgba(255, 255, 255, 0.4)' }}
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-sm btn-outline-light">
                Log In
              </Link>
              <Link to="/register" className="btn btn-sm btn-warning text-dark fw-bold">
                Join Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
