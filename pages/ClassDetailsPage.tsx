import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole, Class, User, Assignment } from '../types';
import * as api from '../services/supabaseApi';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/helpers';
import { Plus, Users, ClipboardList, UserIcon } from '../components/icons/Icons';

const ClassDetailsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    if (classId) {
      const classData = await api.getClassById(classId);
      const assignmentData = await api.getAssignmentsForClass(classId);
      if (classData) {
        setClassInfo(classData.classInfo);
        setMembers(classData.members);
        setAssignments(assignmentData.sort((a,b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()));
      }
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleCreateAssignment = async (title: string, deadline: string) => {
    if (user && classId && deadline) {
      try {
        // Set time to end of day for the selected date
        const deadlineDate = new Date(deadline);
        deadlineDate.setUTCHours(23, 59, 59, 999);
        await api.createAssignment(title, deadlineDate, classId, user.id);
        showToast('Assignment created!', 'success');
        fetchData();
        setIsModalOpen(false);
      } catch (error: any) {
        showToast(error.message, 'error');
      }
    }
  };

  if (loading) {
    return <div className="text-center mt-8 text-lg animate-pulse">Loading class details...</div>;
  }

  if (!classInfo) {
    return <div className="text-center mt-8 text-lg">Class not found.</div>;
  }

  const isTeacher = user?.role === UserRole.TEACHER;
  const today = new Date();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-scale-in">
      <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 mb-8 animate-tilt">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <div>
                 <h1 className="text-4xl font-black text-white/90 tracking-tight">{classInfo.title}</h1>
                 <p className="text-slate-400 mt-1 text-lg">{classInfo.semester}</p>
                 <div className="mt-4">
                    <p className="text-sm font-mono bg-black/30 text-slate-300 py-2 px-4 rounded-full inline-block">Code: {classInfo.code}</p>
                 </div>
            </div>
            {isTeacher && (
                <Button onClick={() => setIsModalOpen(true)} className="mt-6 sm:mt-0 !px-5 !py-3 flex-shrink-0">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Assignment
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold mb-6 text-white/90 flex items-center gap-3"><ClipboardList className="w-8 h-8"/>Assignments</h2>
          <div className="space-y-5">
            {assignments.length > 0 ? assignments.map((a, i) => {
                const isPastDeadline = new Date(a.deadline) < today;
                const statusColor = isPastDeadline ? 'bg-slate-500' : 'bg-green-500';
                return (
              <Link key={a.id} to={`/assignment/${a.id}`} className="block group" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}>
                <div className="bg-slate-900/30 backdrop-blur-lg border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-white/90">{a.title}</h3>
                    <div className="flex items-center space-x-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusColor} transition-all duration-300 group-hover:animate-pulse`}></div>
                        <span className="text-xs font-semibold text-slate-300">
                            {isPastDeadline ? 'Closed' : 'Active'}
                        </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">Deadline: {formatDate(a.deadline)}</p>
                </div>
              </Link>
            )}) : (
                <div className="text-center py-16 bg-slate-900/20 border-2 border-dashed border-white/10 rounded-2xl">
                    <p className="text-slate-400">No assignments created yet.</p>
                </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-6 text-white/90 flex items-center gap-3"><Users className="w-8 h-8"/>Members ({members.length})</h2>
          <div className="bg-slate-900/30 backdrop-blur-lg border border-white/10 rounded-2xl p-4">
            <ul className="space-y-1">
              {members.map(m => (
                <li key={m.id} className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-700/50 flex items-center justify-center border border-white/10">
                        <UserIcon className="h-5 w-5 text-slate-400"/>
                    </div>
                    <div className="ml-3">
                        <span className="font-medium text-slate-200">{m.name}</span>
                        {m.role === UserRole.TEACHER && <span className="ml-2 text-xs bg-indigo-500/50 text-indigo-200 px-2 py-0.5 rounded-full font-semibold">Teacher</span>}
                    </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Assignment">
        <CreateAssignmentForm onSubmit={handleCreateAssignment} />
      </Modal>
    </div>
  );
};

const CreateAssignmentForm: React.FC<{ onSubmit: (title: string, deadline: string) => void }> = ({ onSubmit }) => {
    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(title, deadline);
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input id="title" label="Assignment Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <Input id="deadline" label="Deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required 
                min={new Date().toISOString().split("T")[0]}
            />
            <Button type="submit" className="w-full">Create</Button>
        </form>
    );
};

export default ClassDetailsPage;