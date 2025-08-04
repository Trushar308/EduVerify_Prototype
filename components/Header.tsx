import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { SunIcon, MoonIcon, LogOutIcon, GraduationCap } from './icons/Icons';
import { APP_NAME } from '../constants';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-slate-900/20 backdrop-blur-lg sticky top-0 z-50 border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 text-2xl font-bold">
            <div className="bg-white/10 p-2.5 rounded-lg border border-white/20">
                <GraduationCap className="w-7 h-7 text-indigo-400" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">{APP_NAME}</span>
          </Link>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                 <div className="text-right hidden sm:block">
                  <p className="font-semibold text-white/90">{user.name}</p>
                  <p className="text-xs text-indigo-300 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Logout"
                >
                  <LogOutIcon className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;