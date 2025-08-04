import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { APP_NAME } from '../constants';
import { GraduationCap } from '../components/icons/Icons';

const LoginPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const { login, signUp, generateDummyData, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLoginView) {
        await login(email);
      } else {
        await signUp(name, email, role);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-scale-in">
       <div className="w-full max-w-md mx-auto">
            <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center space-x-4">
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                            <GraduationCap className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white/90">{APP_NAME}</h1>
                    </div>
                    <p className="mt-4 text-slate-300">The Future of Academic Integrity</p>
                </div>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="flex items-center justify-center bg-slate-900/50 p-1 rounded-xl border border-white/10">
                        <button type="button" onClick={() => setIsLoginView(true)} className={`w-1/2 rounded-lg py-2.5 text-sm font-semibold transition-all ${isLoginView ? 'bg-indigo-500/80 text-white shadow-md' : 'text-slate-300'}`}>
                            Sign In
                        </button>
                        <button type="button" onClick={() => setIsLoginView(false)} className={`w-1/2 rounded-lg py-2.5 text-sm font-semibold transition-all ${!isLoginView ? 'bg-indigo-500/80 text-white shadow-md' : 'text-slate-300'}`}>
                            Sign Up
                        </button>
                    </div>

                    {!isLoginView && (
                        <Input
                        id="name"
                        label="Full Name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        />
                    )}
                    <Input
                        id="email"
                        label="Email address"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {!isLoginView && (
                        <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">I am a...</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setRole(UserRole.STUDENT)} className={`px-4 py-3 text-sm font-semibold rounded-lg transition-all border ${role === UserRole.STUDENT ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>Student</button>
                            <button type="button" onClick={() => setRole(UserRole.TEACHER)} className={`px-4 py-3 text-sm font-semibold rounded-lg transition-all border ${role === UserRole.TEACHER ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>Teacher</button>
                        </div>
                        </div>
                    )}
                    <Button type="submit" className="w-full !py-3.5" isLoading={loading}>
                        {isLoginView ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>
            </div>
            <div className="mt-6 text-center">
                <Button onClick={generateDummyData} variant="ghost" isLoading={loading}>
                    Generate Demo Data
                </Button>
            </div>
       </div>
    </div>
  );
};

export default LoginPage;