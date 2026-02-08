import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI, type User } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      
      if (savedUser && token) {
        try {
          setUser(JSON.parse(savedUser));
          // Refresh user data from API (will auto-refresh token if needed)
          const freshUser = await userAPI.getProfile();
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (error) {
          console.error('Failed to load user:', error);
          // Only clear if there's no refresh token (user needs to login again)
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Auto-refresh user data periodically to keep stats fresh
  useEffect(() => {
    if (!user) return;

    // Refresh user every 5 minutes to keep XP/level in sync
    const interval = setInterval(async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Periodic user refresh failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login(username, password);
      
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, full_name?: string) => {
    try {
      const response = await authAPI.register(username, email, password, full_name);
      
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/auth');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      const freshUser = await userAPI.getProfile();
      console.log('User refreshed - XP:', freshUser.xp, 'Level:', freshUser.lvl);
      updateUser(freshUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
