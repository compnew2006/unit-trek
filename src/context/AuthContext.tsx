import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { authApi, setAuthToken, removeAuthToken } from '../services/apiClient';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and user in localStorage
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        logger.error('Error parsing stored user', error instanceof Error ? error : new Error(String(error)));
        removeAuthToken();
      }
    }
    
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authApi.login(email, password);
      setUser(data.user);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      toast.success('Logged in successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const data = await authApi.register(email, password, username);
      setUser(data.user);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      toast.success('Account created successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      authApi.logout();
      setUser(null);
      localStorage.removeItem('auth_user');
      toast.success('Logged out successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      toast.error(message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
