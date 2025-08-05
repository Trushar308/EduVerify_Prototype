import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole, Class } from '../types';
import * as api from '../services/supabaseApi';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useToast } from '../hooks/useToast';
import { Plus, GraduationCap } from '../components/icons/Icons';

const ClassCard: React.FC<{ classInfo: Class, index: number }> = ({ classInfo, index }) => {
    const cardRef = useRef<HTMLAnchorElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const { clientX, clientY, currentTarget } = e;
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const x = (clientX - left) / width;
        const y = (clientY - top) / height;
        const rotateX = (y - 0.5) * -15;
        const rotateY = (x - 0.5) * 15;
        if(cardRef.current) {
            cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        }
    };
  
    const handleMouseLeave = () => {
        if(cardRef.current) {
            cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        }
    };

    const gradients = [
        'from-cyan-500/30 to-blue-500/30',
        'from-purple-500/30 to-indigo-500/30',
        'from-green-400/30 to-teal-500/30',
        'from-orange-400/30 to-red-500/30',
        'from-pink-500/30 to-rose-500/30',
    ];
    const gradient = gradients[index % gradients.length];
    
    return (
        <Link 
            to={`/class/${classInfo.id}`} 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="block group animate-scale-in" 
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards', transformStyle: 'preserve-3d', transition: 'transform 0.1s ease-out' }}
        >
            <div className="relative bg-slate-900/30 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl h-full p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-white/20">
                <div className={`absolute -top-10 -right-10 h-32 w-32 bg-gradient-to-br ${gradient} rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white/90">{classInfo.title}</h3>
                    <p className="text-slate-400 mt-1">{classInfo.semester}</p>
                </div>
                <div className="relative mt-8 z-10">
                    <span className="text-sm font-mono bg-black/30 text-slate-300 py-2 px-4 rounded-full transition-colors">
                        Code: {classInfo.code}
                    </span>
                </div>
            </div>
        </Link>
    );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  const fetchClasses = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const userClasses = await api.getClassesForUser(user.id, user.role);
        setClasses(userClasses);
      } catch (error: any) {
        console.error('Error fetching classes:', error);
        showToast('Failed to load classes. Please try again.', 'error');
        setClasses([]);
      } finally {
        setLoading(false);
      }
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreateClass = async (title: string, semester: string) => {
    if (user && user.role === UserRole.TEACHER) {
      try {
        await api.createClass(title, semester, user.id);
        showToast('Class created successfully!', 'success');
        fetchClasses();
        setIsModalOpen(false);
      } catch (error: any) {
        showToast(error.message, 'error');
      }
    }
  };

  const handleJoinClass = async (code: string) => {
    if (user && user.role === UserRole.STUDENT) {
      try {
        await api.joinClass(code, user.id);
        showToast('Successfully joined class!', 'success');
        fetchClasses();
        setIsModalOpen(false);
      } catch (error: any) {
        showToast(error.message, 'error');
      }
    }
  };

  if (loading) {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-900/30 backdrop-blur-lg border border-white/10 rounded-2xl h-52 p-6 animate-pulse">
                    <div className="h-7 w-3/4 bg-slate-700/50 rounded-lg"></div>
                    <div className="h-5 w-1/2 bg-slate-700/50 rounded-lg mt-4"></div>
                    <div className="h-10 w-1/3 bg-slate-700/50 rounded-full mt-10"></div>
                </div>
            ))}
        </div>
    );
  }

  const roleActionText = user?.role === UserRole.TEACHER ? 'Create New Class' : 'Join a Class';

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-scale-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
        <div>
            <h1 className="text-5xl font-black text-white/90 tracking-tight">Welcome, {user?.name.split(' ')[0]}!</h1>
            <p className="text-slate-400 mt-2 text-lg">Here are your active classes for this semester.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="!px-5 !py-3 mt-4 sm:mt-0 flex-shrink-0">
            <Plus className="w-5 h-5 mr-2" />
            <span>{roleActionText}</span>
        </Button>
      </div>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((c, i) => <ClassCard key={c.id} classInfo={c} index={i} />)}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/20 border-2 border-dashed border-white/10 rounded-2xl animate-scale-in">
            <div className="inline-block bg-indigo-500/20 p-5 rounded-full border border-indigo-500/30">
                <GraduationCap className="w-16 h-16 text-indigo-400" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-white">No classes yet</h2>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">
                {user?.role === UserRole.TEACHER ? 'Create your first class to get started with assignments and student management.' : 'Use the "Join a Class" button and enter the code provided by your teacher to get started.'}
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="mt-8">
                <Plus className="w-5 h-5 mr-2" />
                <span>{roleActionText}</span>
            </Button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={roleActionText}>
        {user?.role === UserRole.TEACHER ? (
          <CreateClassForm onSubmit={handleCreateClass} />
        ) : (
          <JoinClassForm onSubmit={handleJoinClass} />
        )}
      </Modal>
    </div>
  );
};

const CreateClassForm: React.FC<{ onSubmit: (title: string, semester: string) => void }> = ({ onSubmit }) => {
    const [title, setTitle] = useState('');
    const [semester, setSemester] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(title, semester);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input id="title" label="Class Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <Input id="semester" label="Semester (e.g., Fall 2024)" value={semester} onChange={e => setSemester(e.target.value)} required />
            <Button type="submit" className="w-full">Create Class</Button>
        </form>
    );
};

const JoinClassForm: React.FC<{ onSubmit: (code: string) => void }> = ({ onSubmit }) => {
    const [code, setCode] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(code.toUpperCase());
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input id="code" label="Class Code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required placeholder="ABC123" />
            <Button type="submit" className="w-full">Join Class</Button>
        </form>
    );
}

export default DashboardPage;