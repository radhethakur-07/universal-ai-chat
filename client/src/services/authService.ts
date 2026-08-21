import api from '../lib/api';
import { User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await api.post('/api/auth/register', { name, email, password });
    return res.data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await api.get('/api/auth/me');
    return res.data;
  },
};
