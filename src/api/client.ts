import axios from 'axios';

// Update API_URL to use the correct protocol (http instead of https)
const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
};

export const leaves = {
  getAll: async () => {
    const response = await api.get('/api/leaves');
    return response.data;
  },
  getMyLeaves: async () => {
    const response = await api.get('/api/leaves/my-leaves');
    return response.data;
  },
  create: async (data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => {
    const response = await api.post('/api/leaves', data);
    return response.data;
  },
  updateStatus: async (id: string, data: { status: string; comment?: string }) => {
    const response = await api.patch(`/api/leaves/${id}`, data);
    return response.data;
  },
};

export const events = {
  getAll: async () => {
    const response = await api.get('/api/events');
    return response.data;
  },
  create: async (data: {
    title: string;
    eventType: string;
    startTime: string;
    endTime: string;
    description?: string;
    visibility: string;
    rsvpRequired: boolean;
  }) => {
    const response = await api.post('/api/events', data);
    return response.data;
  },
  getRsvps: async (eventId: string) => {
    const response = await api.get(`/api/events/${eventId}/rsvps`);
    return response.data;
  },
  submitRsvp: async (eventId: string, response: string) => {
    const res = await api.post(`/api/events/${eventId}/rsvp`, { response });
    return res.data;
  },
};

export const notifications = {
  getAll: async () => {
    const response = await api.get('/api/notifications');
    return response.data;
  },
  create: async (data: {
    userId: string;
    type: string;
    title: string;
    message: string;
  }) => {
    const response = await api.post('/api/notifications', data);
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await api.patch(`/api/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.post('/api/notifications/mark-all-read');
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/notifications/${id}`);
    return response.data;
  },
};

export default api;