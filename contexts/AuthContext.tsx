
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import * as api from '../services/supabaseApi';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<void>;
  signUp: (name: string, email: string, role: UserRole) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('eduverify_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('eduverify_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      const loggedInUser = await api.login(email);
      setUser(loggedInUser);
      localStorage.setItem('eduverify_user', JSON.stringify(loggedInUser));
      showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, role: UserRole): Promise<void> => {
    try {
      setLoading(true);
      const newUser = await api.signUp(name, email, role);
      setUser(newUser);
      localStorage.setItem('eduverify_user', JSON.stringify(newUser));
      showToast(`Welcome to EduVerify, ${newUser.name}!`, 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    setUser(null);
    localStorage.removeItem('eduverify_user');
    showToast('Logged out successfully', 'success');
  };

  const value: AuthContextType = {
    user,
    login,
    signUp,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
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
