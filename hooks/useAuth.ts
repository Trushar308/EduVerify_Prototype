
import { useContext } from 'react';
import { AuthProvider, useAuth as useAuthHook } from '../contexts/AuthContext';

export const useAuth = useAuthHook;
