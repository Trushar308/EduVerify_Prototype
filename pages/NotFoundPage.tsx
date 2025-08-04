import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center p-4 animate-scale-in">
        <div className="text-center bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-12 shadow-2xl">
            <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-indigo-600 animate-glow">404</h1>
            <h2 className="text-3xl font-bold mt-4 text-white/90">Page Not Found</h2>
            <p className="text-slate-400 mt-2">Sorry, the cosmic waves didn't lead to a valid page.</p>
            <Button onClick={() => navigate('/')} className="mt-8">
                Return to Dashboard
            </Button>
        </div>
    </div>
  );
};

export default NotFoundPage;