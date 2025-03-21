import api from '../utils/axios';

const authService = {
  login: (email, password) => {
    return api.post('/users/login', { email, password });
  },

  register: userData => {
    return api.post('/users/register', userData);
  },

  logout: () => {
    return api.post('/users/logout');
  },

  connectWallet: (userId, walletAddress) => {
    return api.post(`/users/${userId}/connect-wallet`, { walletAddress });
  },

  getUserProfile: userId => {
    return api.get(`/users/${userId}`);
  },

  getAllRoles: () => {
    return api.get('/users/roles');
  },
};

export default authService;
