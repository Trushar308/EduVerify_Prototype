
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import * as api from '../services/mockApi';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  signUp: (name: string, email: string, role: UserRole) => Promise<void>;
  logout: () => void;
  generateDummyData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('eduverify_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string) => {
    setLoading(true);
    try {
      const userData = await api.login(email);
      setUser(userData);
      sessionStorage.setItem('eduverify_user', JSON.stringify(userData));
      showToast('Login successful!', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (name: string, email: string, role: UserRole) => {
    setLoading(true);
    try {
      const userData = await api.signUp(name, email, role);
      setUser(userData);
      sessionStorage.setItem('eduverify_user', JSON.stringify(userData));
      showToast('Registration successful!', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('eduverify_user');
    showToast('Logged out successfully.', 'info');
  };

  const generateDummyData = async () => {
    setLoading(true);
    try {
      await api.generateDummyData();
      showToast('Dummy data generated! Try logging in as teacher@eduverify.com or one of the student emails.', 'success', 10000);
    } catch (error: any) {
      showToast('Failed to generate dummy data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, logout, generateDummyData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
