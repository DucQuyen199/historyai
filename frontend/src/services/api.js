import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

console.log('API configuration:');
console.log(`- Base URL: ${API_URL}`);
console.log(`- Register endpoint: ${API_URL}/auth/register`);

// Tạo instance axios với cấu hình mặc định
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động gắn token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor xử lý lỗi chung
api.interceptors.response.use(
  response => response,
  error => {
    // Kiểm tra nếu lỗi là 401 (Unauthorized) và không phải request đăng nhập/đăng ký
    if (error.response?.status === 401 && 
        !error.config.url.includes('/login') && 
        !error.config.url.includes('/register')) {
      // Xóa thông tin phiên đã hết hạn
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Có thể chuyển hướng người dùng về trang đăng nhập ở đây
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = async (credentials) => {
  try {
    console.log('API login called with:', credentials);
    const response = await api.post('/auth/login', credentials, {
      timeout: 10000 // 10 giây
    });
    console.log('API login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API login error:', error.response?.data || error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    console.log('API register called with:', userData);
    const fullUrl = `${API_URL}/auth/register`;
    console.log('Full URL:', fullUrl);
    
    const response = await api.post('/auth/register', userData, {
      timeout: 15000 // 15 giây
    });
    
    console.log('API register response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API register error:', error);
    
    // Chi tiết lỗi
    if (error.response) {
      console.error('Server response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('No response received. Request details:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    
    throw error;
  }
};

// Forum APIs
export const getPosts = () => {
  return api.get('/forum/posts');
};

export const getPostDetail = async (postId) => {
  try {
    const response = await api.get(`/forum/posts/${postId}`);
    return response;
  } catch (error) {
    console.error('Error fetching post detail:', error);
    throw error;
  }
};

export const createPost = (formData) => {
  return api.post('/forum/create-post', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
};

export const toggleLike = async (postId) => {
  try {
    const response = await api.post('/forum/like', { post_id: postId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addComment = async (postId, content) => {
  const response = await api.post('/forum/comments', { post_id: postId, content });
  return response;
};

export const getPostComments = (postId) => {
  return api.get(`/forum/posts/${postId}/comments`);
};

// User APIs
export const getUserPosts = () => {
  return api.get('/forum/user/posts');
};

export const getUserComments = () => {
  return api.get('/forum/user/comments');
};

export const updateProfile = (formData) => {
  return api.put('/user/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const incrementViewCount = (postId) => {
  return api.post(`/forum/posts/${postId}/view`);
};

export const checkLikeStatus = async (postId) => {
  try {
    const response = await api.get(`/forum/posts/${postId}/like-status`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Thêm các API endpoints
export const updateUserSettings = (settings) => {
  return api.put('/user/settings', settings);
};

export const changePassword = (passwords) => {
  return api.put('/user/password', passwords);
}; 