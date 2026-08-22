import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export function useAuth() {
  const { user, token, isAuthenticated, _hasHydrated, setAuth, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setAuth(res.user, res.token);
    return res;
  }, [setAuth]);

  const logout = useCallback(() => {
    storeLogout();
    navigate('/login', { replace: true });
    toast.success('Logged out');
  }, [storeLogout, navigate]);

  return { user, token, isAuthenticated, hasHydrated: _hasHydrated, login, logout };
}
