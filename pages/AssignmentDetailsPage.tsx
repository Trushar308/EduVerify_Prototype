import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole, Assignment, Submission, User, AnalysisData } from '../types';
import * as api from '../services/mockApi';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/helpers';
import Button from '../components/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Scatter, ComposedChart, ZAxis, ReferenceArea } from 'recharts';
import { generateDummySubmissionContent } from '../services/geminiService';
import { UploadCloud, FileText, CheckBadge, PlayCircle, PauseCircle, BarChartBig, ScatterChart, Grid3x3 } from '../components/icons/Icons';

const AssignmentDetailsPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAssignment = useCallback(async () => {
    if (assignmentId) {
      setLoading(true);
      const data = await api.getAssignmentById(assignmentId);
      setAssignment(data);
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  if (loading) return <div className="text-center mt-8 text-lg animate-pulse">Loading assignment...</div>;
  if (!assignment) return <div className="text-center mt-8 text-lg">Assignment not found.</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 mb-6 animate-scale-in">
        <Link to={`/class/${assignment.classId}`} className="text-sm font-semibold text-indigo-400 hover:underline">
          &larr; Back to Class
        </Link>
        <h1 className="text-4xl font-black text-white/90 tracking-tight mt-2">{assignment.title}</h1>
        <p className="text-slate-400 mt-1 text-lg">Deadline: <span className="font-semibold text-slate-300">{formatDate(assignment.deadline)}</span></p>
      </div>
      {user?.role === UserRole.TEACHER ? (
        <TeacherView assignment={assignment} onAssignmentUpdate={fetchAssignment} />
      ) : (
        <StudentView assignment={assignment} />
      )}
    </div>
  );
};

interface TeacherViewProps {
  assignment: Assignment;
  onAssignmentUpdate: () => void;
}

const TeacherView: React.FC<TeacherViewProps> = ({ assignment, onAssignmentUpdate }) => {
  const [submissions, setSubmissions] = useState<(Submission & { student: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('summary');

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const data = await api.getSubmissionsForAssignment(assignment.id);
    setSubmissions(data.sort((a,b) => a.student.name.localeCompare(b.student.name)));
    setLoading(false);
  }, [assignment.id]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
        await api.runAssignmentAnalysis(assignment.id);
        showToast('Analysis complete!', 'success');
        fetchSubmissions();
    } catch (error: any) {
        showToast(error.message, 'error');
    }
    setAnalyzing(false);
  };
  
  const handleToggleSubmissions = async () => {
    try {
        await api.toggleAssignmentSubmissions(assignment.id);
        showToast('Submission status updated!', 'success');
        onAssignmentUpdate();
    } catch (error: any) {
        showToast(error.message, 'error');
    }
  };

  const hasSubmissions = submissions.length > 0;
  const isAnalyzed = hasSubmissions && submissions.every(s => s.aiScore !== null);
  const canAnalyze = hasSubmissions;
  const isPastDeadline = new Date(assignment.deadline) < new Date();
  
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-400';
    if (score >= 75) return 'text-red-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-green-400';
  };

  return (
    <div className="animate-scale-in">
        <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white/90">Submissions Overview</h2>
                    <p className="text-slate-400 mt-1">Review student work and run integrity analysis.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleToggleSubmissions} disabled={isPastDeadline} variant="secondary">
                        {assignment.submissionsOpen && !isPastDeadline ? (
                        <><PauseCircle className="w-5 h-5 mr-2" /> Stop</>
                        ) : (
                        <><PlayCircle className="w-5 h-5 mr-2" /> Re-open</>
                        )}
                    </Button>
                    <Button onClick={handleRunAnalysis} isLoading={analyzing} disabled={!canAnalyze}>
                        {isAnalyzed ? 'Re-run Analysis' : 'Run Analysis'}
                    </Button>
                </div>
            </div>
        </div>
        
        {loading && <p className="text-center py-8">Loading submissions...</p>}
        
        {!loading && !hasSubmissions && (
            <div className="text-center py-20 bg-slate-900/20 border-2 border-dashed border-white/10 rounded-2xl">
                <h2 className="text-xl font-semibold text-white">No submissions yet.</h2>
                <p className="text-slate-400 mt-2">Check back after the deadline or when students submit their work.</p>
            </div>
        )}

        {hasSubmissions && (
             <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-white/10">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Student</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Submitted On</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">AI Score</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Plagiarism</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                        {submissions.map(sub => (
                            <tr key={sub.id} className="hover:bg-white/5 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-white/90">{sub.student.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-base text-slate-400">{formatDate(sub.createdAt)}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-base font-bold ${getScoreColor(sub.aiScore)}`}>{sub.aiScore !== null ? `${sub.aiScore}%` : 'N/A'}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-base font-bold ${getScoreColor(sub.plagiarismScore)}`}>{sub.plagiarismScore !== null ? `${sub.plagiarismScore}%` : 'N/A'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {isAnalyzed && (
            <div className="mt-8">
                <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-t-2xl p-2 max-w-sm mx-auto">
                    <div className="flex justify-center items-center gap-2">
                         <TabButton icon={<BarChartBig className="w-5 h-5"/>} text="Summary" isActive={activeTab === 'summary'} onClick={() => setActiveTab('summary')} />
                         <TabButton icon={<ScatterChart className="w-5 h-5"/>} text="Distribution" isActive={activeTab === 'distribution'} onClick={() => setActiveTab('distribution')} />
                         <TabButton icon={<Grid3x3 className="w-5 h-5"/>} text="Matrix" isActive={activeTab === 'matrix'} onClick={() => setActiveTab('matrix')} />
                    </div>
                </div>
                <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 min-h-[500px]">
                    {activeTab === 'summary' && <SummaryChart submissions={submissions} />}
                    {activeTab === 'distribution' && <DistributionChart submissions={submissions} />}
                    {activeTab === 'matrix' && <PlagiarismMatrix submissions={submissions} />}
                </div>
            </div>
        )}
    </div>
  );
};

const StudentView: React.FC<{ assignment: Assignment }> = ({ assignment }) => {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { showToast } = useToast();

  const fetchSubmission = useCallback(async () => {
    if (user) {
      setLoading(true);
      const data = await api.getSubmissionForUser(assignment.id, user.id);
      setSubmission(data);
      setLoading(false);
    }
  }, [assignment.id, user]);
  
  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setSubmitting(true);
    try {
        const content = await generateDummySubmissionContent(assignment.title);
        await api.createSubmission(assignment.id, user.id, file.name, content);
        showToast('Submission successful!', 'success');
        fetchSubmission();
    } catch(error: any) {
        showToast(error.message, 'error');
    } finally {
        setSubmitting(false);
    }
  };

  const isPastDeadline = new Date(assignment.deadline) < new Date();
  const areSubmissionsOpen = assignment.submissionsOpen && !isPastDeadline;

  return (
    <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in">
      <h2 className="text-3xl font-bold text-white/90">Your Submission</h2>
      {loading && <p className="mt-4 animate-pulse">Loading submission status...</p>}
      {!loading && (
        <>
          {submission ? (
            <div className="mt-6 animate-scale-in">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                    <div className="flex items-center">
                        <CheckBadge className="h-12 w-12 text-green-400" />
                        <div className="ml-4">
                            <h3 className="text-xl font-bold text-white">Assignment Submitted!</h3>
                            <p className="text-sm text-green-300">Submitted on {formatDate(submission.createdAt)}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-6">
                    <h3 className="font-semibold text-slate-300 mb-2">Submitted File:</h3>
                     <div className="flex items-center bg-black/30 p-4 rounded-lg">
                        <FileText className="h-6 w-6 text-indigo-400"/>
                        <p className="ml-3 font-medium text-slate-300">{submission.fileUrl}</p>
                    </div>

                    {submission.aiScore !== null ? (
                         <div className="mt-6">
                            <h3 className="font-semibold text-slate-300 mb-3">Analysis Results:</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard label="AI Score" value={submission.aiScore} />
                                <StatCard label="Plagiarism Score" value={submission.plagiarismScore} />
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 text-center bg-black/20 p-8 rounded-lg">
                            <p className="font-medium text-slate-400">Analysis results will appear here once your teacher runs the report.</p>
                        </div>
                    )}
                </div>
            </div>
          ) : (
            <div className="mt-6">
              {!areSubmissionsOpen ? (
                 <div className="text-center bg-red-500/10 p-8 rounded-lg border border-red-500/20">
                    <p className="font-semibold text-red-300 text-lg">
                        {isPastDeadline ? 'The deadline has passed. Submissions are closed.' : 'The teacher has closed submissions for this assignment.'}
                    </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">Upload your file</label>
                        <div className="mt-2 group flex justify-center rounded-xl border-2 border-dashed border-slate-500/50 px-6 py-10 bg-black/20 transition-all duration-300 hover:border-indigo-400/80 hover:bg-indigo-500/10">
                            <div className="text-center">
                                {file ? (
                                    <>
                                        <FileText className="mx-auto h-12 w-12 text-indigo-400 animate-bounce-once" />
                                        <p className="mt-2 font-semibold text-slate-200">{file.name}</p>
                                        <p className="text-xs text-slate-400">{Math.round(file.size / 1024)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4 border border-white/10">
                                            <UploadCloud className="mx-auto h-8 w-8 text-slate-400 transition-colors group-hover:text-indigo-300 group-hover:animate-bounce-once" />
                                        </div>
                                        <div className="flex text-sm leading-6 text-slate-400">
                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-indigo-400 focus-within:outline-none hover:text-indigo-300">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.docx" />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs leading-5 text-slate-500">PDF, DOCX up to 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={!file || submitting} isLoading={submitting}>Submit Assignment</Button>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};


// --- Chart and UI Components ---
const getBarFillColor = (score: number | null) => {
    if (score === null) return '#94a3b8'; // slate-400
    if (score >= 75) return '#ef4444'; // red-500
    if (score >= 50) return '#f97316'; // orange-500
    return '#22c55e'; // green-500
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-2xl">
        <p className="font-bold text-white/90">{label}</p>
        {payload.map((pld: any, index: number) => (
            <p key={index} style={{ color: pld.fill }}>
                {`${pld.name}: ${pld.value}%`}
            </p>
        ))}
      </div>
    );
  }
  return null;
};

const SummaryChart: React.FC<{submissions: (Submission & { student: User })[]}> = ({submissions}) => {
    const chartData = useMemo(() => submissions.map(s => ({
        name: s.student.name.split(' ').slice(0, 2).join(' '),
        aiScore: s.aiScore,
        plagiarismScore: s.plagiarismScore,
    })), [submissions]);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="#94a3b8" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(129, 140, 248, 0.1)'}} />
                <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                <Bar dataKey="aiScore" name="AI Score" barSize={20}>
                    {chartData.map((entry, index) => (<Cell key={`cell-ai-${index}`} fill={getBarFillColor(entry.aiScore)} />))}
                </Bar>
                <Bar dataKey="plagiarismScore" name="Plagiarism" barSize={20}>
                    {chartData.map((entry, index) => (<Cell key={`cell-plag-${index}`} fill={getBarFillColor(entry.plagiarismScore)} />))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}

const PulsingDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isOutlier = payload.aiScore > 75 || payload.plagiarismScore > 75;
    return <circle cx={cx} cy={cy} r={isOutlier ? 8 : 5} fill={isOutlier ? '#f87171' : '#818cf8'} className={isOutlier ? 'pulsate' : ''} />;
};

const DistributionChart: React.FC<{submissions: (Submission & { student: User })[]}> = ({submissions}) => {
    const chartData = useMemo(() => submissions.map(s => ({
        name: s.student.name,
        aiScore: s.aiScore,
        plagiarismScore: s.plagiarismScore,
    })), [submissions]);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <ComposedChart margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="#94a3b8" />
                <XAxis dataKey="plagiarismScore" type="number" name="Plagiarism Score" unit="%" stroke="#94a3b8" fontSize={12} domain={[0, 100]} label={{ value: 'Plagiarism Score (%)', position: 'insideBottom', offset: -15, fill: '#94a3b8' }}/>
                <YAxis dataKey="aiScore" type="number" name="AI Score" unit="%" stroke="#94a3b8" fontSize={12} domain={[0, 100]} label={{ value: 'AI Score (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}/>
                <ZAxis dataKey="name" name="Student" />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(129, 140, 248, 0.5)' }} />
                <ReferenceArea x1={70} y1={70} x2={100} y2={100} stroke="none" fill="#ef4444" fillOpacity={0.1} label={{ value: "High Risk", position: 'inside', fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }}/>
                <Scatter data={chartData} fill="#818cf8" shape={<PulsingDot />} />
            </ComposedChart>
        </ResponsiveContainer>
    )
}

const PlagiarismMatrix: React.FC<{submissions: (Submission & { student: User })[]}> = ({submissions}) => {
    const { matrix, studentNames } = useMemo(() => {
        const firstSub = submissions[0];
        if (!firstSub || !firstSub.resultJson) return { matrix: null, studentNames: [] };

        const analysis: AnalysisData = JSON.parse(firstSub.resultJson);
        const studentMap = new Map(submissions.map(s => [s.userId, s.student.name]));
        
        const sortedUserIds = Object.keys(analysis.similarityMatrix).sort((a,b) => (studentMap.get(a) || '').localeCompare(studentMap.get(b) || ''));

        return {
            matrix: analysis.similarityMatrix,
            studentNames: sortedUserIds.map(id => ({ id, name: studentMap.get(id) || 'Unknown' })),
        };
    }, [submissions]);

    if (!matrix) return <p className="text-center text-slate-400">Not enough data for matrix.</p>;
    
    const getCellColor = (similarity: number) => {
        if (similarity > 80) return `hsl(0, 100%, 60%)`;
        if (similarity > 60) return `hsl(30, 100%, 55%)`;
        if (similarity > 40) return `hsl(60, 100%, 50%)`;
        return `hsla(217, 75%, 55%, ${similarity / 100})`;
    };
    
    return (
        <div className="overflow-x-auto p-2">
            <table className="border-collapse w-full">
                <thead>
                    <tr>
                        <th className="p-2 border-r border-white/10"></th>
                        {studentNames.map(s => <th key={s.id} className="p-2 text-xs -rotate-45 h-24 w-10 text-slate-300 font-normal whitespace-nowrap">{s.name}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {studentNames.map((rowStudent, rowIndex) => (
                        <tr key={rowStudent.id}>
                            <td className="p-2 text-xs text-slate-300 font-normal align-middle text-right border-r border-white/10 whitespace-nowrap">{rowStudent.name}</td>
                            {studentNames.map((colStudent, colIndex) => {
                                const similarity = rowIndex === colIndex ? 100 : matrix[rowStudent.id]?.[colStudent.id] ?? 0;
                                const isDiagonal = rowIndex === colIndex;
                                const color = getCellColor(similarity);
                                
                                return (
                                    <td key={colStudent.id} className="p-0 m-0">
                                        <div 
                                          className="w-full h-10 flex items-center justify-center group relative transition-all duration-200"
                                          style={{
                                              background: isDiagonal ? 'transparent' : color,
                                              boxShadow: isDiagonal || similarity < 20 ? 'none' : `0 0 12px ${color}`,
                                              filter: isDiagonal ? 'none' : `saturate(${similarity > 40 ? 1.5 : 1})`
                                          }}
                                        >
                                          {!isDiagonal && (
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap shadow-lg">
                                                {similarity}%
                                            </div>
                                          )}
                                        </div>
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const TabButton: React.FC<{icon: React.ReactNode, text: string, isActive: boolean, onClick: () => void}> = ({icon, text, isActive, onClick}) => {
    return (
        <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-indigo-500/80 text-white shadow-md' : 'text-slate-300 hover:bg-white/10'}`}>
            {icon}
            <span>{text}</span>
        </button>
    )
}

const StatCard: React.FC<{ label: string; value: number | null }> = ({ label, value }) => {
  const score = value ?? 0;
  const color = getBarFillColor(score);
  return (
    <div className="bg-black/30 border border-white/10 p-4 rounded-xl">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-3xl font-bold mt-1" style={{ color }}>{score}%</p>
        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
            <div className="h-1.5 rounded-full" style={{ width: `${score}%`, backgroundColor: color }}></div>
        </div>
    </div>
  )
}

export default AssignmentDetailsPage;