
import { useContext } from 'react';
import { ToastProvider, useToast as useToastHook } from '../contexts/ToastContext';

export const useToast = useToastHook;
