import api from './api';

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
}; 