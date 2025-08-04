
import { useContext } from 'react';
import { ThemeProvider, useTheme as useThemeHook } from '../contexts/ThemeContext';

export const useTheme = useThemeHook;
