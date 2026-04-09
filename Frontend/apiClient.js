import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: async (email, password, name) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },
};

// Document APIs
export const documentAPI = {
  upload: async (file, domainId, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('domainId', domainId);
    formData.append('title', file.name);

    const response = await apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(percentCompleted);
      },
    });
    return response.data;
  },

  getDocuments: async (domainId) => {
    const response = await apiClient.get(`/documents/domain/${domainId}`);
    return response.data;
  },

  deleteDocument: async (documentId) => {
    const response = await apiClient.delete(`/documents/${documentId}`);
    return response.data;
  },

  uploadFromURL: async (url, domainId, source) => {
    const response = await apiClient.post('/documents/upload-url', {
      url,
      domainId,
      source, // 'google-drive', 'github', etc.
    });
    return response.data;
  },
};

// Chat APIs
export const chatAPI = {
  query: async (query, domainId) => {
    const response = await apiClient.post('/chat/query', {
      query,
      domainId,
    });
    return response.data;
  },

  getHistory: async (domainId) => {
    const response = await apiClient.get(`/chat/history/${domainId}`);
    return response.data;
  },
};

// Domain APIs
export const domainAPI = {
  getDomains: async () => {
    const response = await apiClient.get('/domains');
    return response.data;
  },

  createDomain: async (name, description) => {
    const response = await apiClient.post('/domains', {
      name,
      description,
    });
    return response.data;
  },

  deleteDomain: async (domainId) => {
    const response = await apiClient.delete(`/domains/${domainId}`);
    return response.data;
  },
};

export default apiClient;
