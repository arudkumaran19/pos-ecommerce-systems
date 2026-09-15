import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest, setCsrfToken } from '../lib/api-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileName: (fullName: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const userData = await apiRequest<User & { csrf_token?: string }>('/api/v1/profile/me');
      setUser(userData);
      if (userData.csrf_token) {
        setCsrfToken(userData.csrf_token);
      }
    } catch {
      setUser(null);
      setCsrfToken(null);
    }
  };


  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await refreshProfile();
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ message: string; csrf_token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setCsrfToken(res.csrf_token);
    await refreshProfile();
  };

  const register = async (email: string, fullName: string, password: string) => {
    const res = await apiRequest<{ message: string; csrf_token: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: { email, full_name: fullName, password },
    });
    setCsrfToken(res.csrf_token);
    await refreshProfile();
  };

  const logout = async () => {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setCsrfToken(null);
    }
  };

  const updateProfileName = async (fullName: string) => {
    const updated = await apiRequest<User>('/api/v1/profile/me', {
      method: 'PATCH',
      body: { full_name: fullName },
    });
    setUser(updated);
  };

  const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const updated = await apiRequest<User>('/api/v1/profile/avatar', {
      method: 'POST',
      body: formData,
    });
    setUser(updated);
  };

  const removeAvatar = async () => {
    const updated = await apiRequest<User>('/api/v1/profile/avatar', {
      method: 'DELETE',
    });
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        updateProfileName,
        uploadAvatar,
        removeAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
