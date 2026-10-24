const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Generic API request helper with JSON parsing and token attachment
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('annapurna_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
};

/**
 * Authentication API methods
 */
export const authApi = {
  login: async (credentials) => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  register: async (userData) => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  getMe: async () => {
    return apiFetch('/auth/me', {
      method: 'GET'
    });
  }
};

/**
 * Donation API methods
 */
export const donationApi = {
  create: async (donationData) => {
    return apiFetch('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData)
    });
  },

  getMyDonations: async () => {
    return apiFetch('/donations/my', {
      method: 'GET'
    });
  },

  getFeed: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    );
    const query = new URLSearchParams(cleanParams).toString();
    return apiFetch(`/donations/feed${query ? `?${query}` : ''}`, {
      method: 'GET'
    });
  },

  claim: async (id) => {
    return apiFetch(`/donations/${id}/claim`, {
      method: 'POST'
    });
  },

  getMyPickups: async () => {
    return apiFetch('/donations/my-pickups', {
      method: 'GET'
    });
  },

  markPickedUp: async (id) => {
    return apiFetch(`/donations/${id}/pickup`, {
      method: 'PATCH'
    });
  },

  confirmDelivery: async (id, payload) => {
    return apiFetch(`/donations/${id}/confirm-delivery`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getTracking: async (id) => {
    return apiFetch(`/donations/${id}/tracking`, {
      method: 'GET'
    });
  },

  updateCollectorLocation: async (id, coords) => {
    return apiFetch(`/donations/${id}/collector-location`, {
      method: 'PATCH',
      body: JSON.stringify(coords)
    });
  },

  getLeaderboard: async () => {
    return apiFetch('/donations/leaderboard', {
      method: 'GET'
    });
  }
};

/**
 * Admin API methods
 */
export const adminApi = {
  getNgos: async (status) => {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return apiFetch(`/admin/ngos${query}`, {
      method: 'GET'
    });
  },

  verifyNgo: async (id, payload) => {
    return apiFetch(`/admin/ngos/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  getAnalytics: async () => {
    return apiFetch('/admin/analytics/overview', {
      method: 'GET'
    });
  },

  getUserProfile: async (id) => {
    return apiFetch(`/admin/users/${id}`, {
      method: 'GET'
    });
  }
};
