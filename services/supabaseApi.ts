import { createClient } from '@supabase/supabase-js';
import { User, UserRole, Class, ClassMember, Assignment, Submission } from '../types';
import { generateDummySubmissionContent, generateAIAssistedSubmissionContent } from './geminiService';
import { runAnalysis } from '../utils/analysis';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://srhnptdxqvwkodxwpjlx.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaG5wdGR4cXZ3a29keHdwamx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTIxMzYsImV4cCI6MjA2OTg4ODEzNn0.0_EEUfkwMAOV-W_5nF4nzVn8_p21EZTnlbEY2RPEbU4';

export const supabase = createClient(supabaseUrl, supabaseKey);

const returnData = <T,>(data: T): Promise<T> => Promise.resolve(data);

const generateClassCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// --- Auth ---
export const signUp = async (name: string, email: string, role: UserRole): Promise<User> => {
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  // Generate a UUID for the user
  const userId = crypto.randomUUID();

  const { data, error } = await supabase
    .from('users')
    .insert([{ id: userId, name, email, role }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return returnData({
    ...data,
    createdAt: new Date(data.created_at)
  });
};

export const login = async (email: string): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    throw new Error("User not found.");
  }

  return returnData({
    ...data,
    createdAt: new Date(data.created_at)
  });
};

// --- Classes ---
export const createClass = async (title: string, semester: string, userId: string): Promise<Class> => {
  const code = generateClassCode();

  const { data, error } = await supabase
    .from('classes')
    .insert([{ title, semester, code, created_by: userId }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // The creator automatically joins the class
  await supabase
    .from('class_members')
    .insert([{ class_id: data.id, user_id: userId }]);

  return returnData({
    id: data.id,
    title: data.title,
    semester: data.semester,
    code: data.code,
    createdBy: data.created_by
  });
};

export const joinClass = async (code: string, userId: string): Promise<Class> => {
  // Find the class
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('code', code)
    .single();

  if (classError || !classData) {
    throw new Error("Class not found.");
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('class_members')
    .select('*')
    .eq('class_id', classData.id)
    .eq('user_id', userId)
    .single();

  if (existingMember) {
    throw new Error("You are already in this class.");
  }

  // Add member
  const { error: memberError } = await supabase
    .from('class_members')
    .insert([{ class_id: classData.id, user_id: userId }]);

  if (memberError) throw new Error(memberError.message);

  return returnData({
    id: classData.id,
    title: classData.title,
    semester: classData.semester,
    code: classData.code,
    createdBy: classData.created_by
  });
};

export const getClassesForUser = async (userId: string, role: UserRole): Promise<Class[]> => {
  let query;

  if (role === UserRole.TEACHER) {
    query = supabase
      .from('classes')
      .select('*')
      .eq('created_by', userId);
  } else {
    query = supabase
      .from('classes')
      .select(`
        *,
        class_members!inner(user_id)
      `)
      .eq('class_members.user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const classes = data.map(item => ({
    id: item.id,
    title: item.title,
    semester: item.semester,
    code: item.code,
    createdBy: item.created_by
  }));

  return returnData(classes);
};

export const getClassById = async (classId: string): Promise<{ classInfo: Class, members: User[] } | null> => {
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();

  if (classError || !classData) return returnData(null);

  const { data: membersData, error: membersError } = await supabase
    .from('class_members')
    .select(`
      users (
        id,
        name,
        email,
        role,
        created_at
      )
    `)
    .eq('class_id', classId);

  if (membersError) throw new Error(membersError.message);

  const classInfo = {
    id: classData.id,
    title: classData.title,
    semester: classData.semester,
    code: classData.code,
    createdBy: classData.created_by
  };

  const members = membersData.map(item => ({
    id: item.users.id,
    name: item.users.name,
    email: item.users.email,
    role: item.users.role,
    createdAt: new Date(item.users.created_at)
  }));

  return returnData({ classInfo, members });
};

// --- Assignments ---
export const createAssignment = async (title: string, deadline: Date, classId: string, userId: string): Promise<Assignment> => {
  const { data, error } = await supabase
    .from('assignments')
    .insert([{ 
      title, 
      deadline: deadline.toISOString(), 
      class_id: classId, 
      created_by: userId,
      submissions_open: true 
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return returnData({
    id: data.id,
    title: data.title,
    deadline: new Date(data.deadline),
    classId: data.class_id,
    createdBy: data.created_by,
    submissionsOpen: data.submissions_open
  });
};

export const getAssignmentsForClass = async (classId: string): Promise<Assignment[]> => {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const assignments = data.map(item => ({
    id: item.id,
    title: item.title,
    deadline: new Date(item.deadline),
    classId: item.class_id,
    createdBy: item.created_by,
    submissionsOpen: item.submissions_open
  }));

  return returnData(assignments);
};

export const getAssignmentById = async (assignmentId: string): Promise<Assignment | null> => {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();

  if (error || !data) return returnData(null);

  return returnData({
    id: data.id,
    title: data.title,
    deadline: new Date(data.deadline),
    classId: data.class_id,
    createdBy: data.created_by,
    submissionsOpen: data.submissions_open
  });
};

export const toggleAssignmentSubmissions = async (assignmentId: string): Promise<Assignment> => {
  // First get current state
  const { data: currentData, error: fetchError } = await supabase
    .from('assignments')
    .select('submissions_open')
    .eq('id', assignmentId)
    .single();

  if (fetchError) throw new Error("Assignment not found.");

  // Toggle the state
  const { data, error } = await supabase
    .from('assignments')
    .update({ submissions_open: !currentData.submissions_open })
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return returnData({
    id: data.id,
    title: data.title,
    deadline: new Date(data.deadline),
    classId: data.class_id,
    createdBy: data.created_by,
    submissionsOpen: data.submissions_open
  });
};

// --- Submissions ---
export const createSubmission = async (assignmentId: string, userId: string, fileName: string, content: string): Promise<Submission> => {
  // Check assignment and deadline
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('assignments')
    .select('submissions_open, deadline')
    .eq('id', assignmentId)
    .single();

  if (assignmentError || !assignmentData) {
    throw new Error("Assignment not found.");
  }

  if (!assignmentData.submissions_open || new Date(assignmentData.deadline) < new Date()) {
    throw new Error("Submissions are not being accepted for this assignment at this time.");
  }

  // Check if already submitted
  const { data: existingSubmission } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('user_id', userId)
    .single();

  if (existingSubmission) {
    throw new Error("You have already submitted for this assignment.");
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert([{
      assignment_id: assignmentId,
      user_id: userId,
      file_url: fileName,
      content: content,
      ai_score: null,
      plagiarism_score: null,
      result_json: null
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return returnData({
    id: data.id,
    assignmentId: data.assignment_id,
    userId: data.user_id,
    fileUrl: data.file_url,
    aiScore: data.ai_score,
    plagiarismScore: data.plagiarism_score,
    resultJson: data.result_json,
    createdAt: new Date(data.created_at),
    content: data.content
  });
};

export const getSubmissionsForAssignment = async (assignmentId: string): Promise<(Submission & { student: User })[]> => {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      users (
        id,
        name,
        email,
        role,
        created_at
      )
    `)
    .eq('assignment_id', assignmentId);

  if (error) throw new Error(error.message);

  const submissions = data.map(item => ({
    id: item.id,
    assignmentId: item.assignment_id,
    userId: item.user_id,
    fileUrl: item.file_url,
    aiScore: item.ai_score,
    plagiarismScore: item.plagiarism_score,
    resultJson: item.result_json,
    createdAt: new Date(item.created_at),
    content: item.content,
    student: {
      id: item.users.id,
      name: item.users.name,
      email: item.users.email,
      role: item.users.role,
      createdAt: new Date(item.users.created_at)
    }
  }));

  return returnData(submissions);
};

export const getSubmissionForUser = async (assignmentId: string, userId: string): Promise<Submission | null> => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return returnData(null);

  return returnData({
    id: data.id,
    assignmentId: data.assignment_id,
    userId: data.user_id,
    fileUrl: data.file_url,
    aiScore: data.ai_score,
    plagiarismScore: data.plagiarism_score,
    resultJson: data.result_json,
    createdAt: new Date(data.created_at),
    content: data.content
  });
};

// --- Analysis ---
export const runAssignmentAnalysis = async (assignmentId: string): Promise<Submission[]> => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  const submissions = data.map(item => ({
    id: item.id,
    assignmentId: item.assignment_id,
    userId: item.user_id,
    fileUrl: item.file_url,
    aiScore: item.ai_score,
    plagiarismScore: item.plagiarism_score,
    resultJson: item.result_json,
    createdAt: new Date(item.created_at),
    content: item.content
  }));

  const updatedSubmissions = runAnalysis(submissions);

  // Update submissions in database
  for (const submission of updatedSubmissions) {
    await supabase
      .from('submissions')
      .update({
        ai_score: submission.aiScore,
        plagiarism_score: submission.plagiarismScore,
        result_json: submission.resultJson
      })
      .eq('id', submission.id);
  }

  return returnData(updatedSubmissions);
};

// --- DUMMY DATA ---
export const generateDummyData = async (): Promise<void> => {
  console.log("Generating dummy data...");

  try {
    // Clear existing data (be careful in production!)
    await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('class_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Create a teacher
    const teacher = await signUp('Dr. Alan Turing', 'teacher@eduverify.com', UserRole.TEACHER);

    // Create students
    const studentNames = ['Ada Lovelace', 'Grace Hopper', 'Charles Babbage', 'John von Neumann', 'Margaret Hamilton', 'Tim Berners-Lee', 'Vint Cerf', 'Bob Kahn', 'Radia Perlman', 'Donald Knuth'];
    const students: User[] = [];
    for (const name of studentNames) {
      const email = `${name.toLowerCase().replace(' ', '.')}@eduverify.com`;
      students.push(await signUp(name, email, UserRole.STUDENT));
    }

    // Create a class
    const cs101 = await createClass('Introduction to Computer Science', 'Fall 2024', teacher.id);

    // Add students to class
    for (const student of students) {
      await joinClass(cs101.code, student.id);
    }

    // Create assignments
    const assignment1 = await createAssignment('The Impact of AI on Society', new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), cs101.id, teacher.id);
    const assignment2 = await createAssignment('History of the Internet', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), cs101.id, teacher.id);

    // Close the past-deadline assignment
    await toggleAssignmentSubmissions(assignment2.id);

    // Create submissions for assignment 2
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      let content = '';

      if (i < 2) {
        content = await generateAIAssistedSubmissionContent(assignment2.title);
      } else {
        content = await generateDummySubmissionContent(assignment2.title);
      }

      // Make two students plagiarize each other
      if (i === 4) {
        const { data: previousSubmission } = await supabase
          .from('submissions')
          .select('content')
          .eq('assignment_id', assignment2.id)
          .eq('user_id', students[3].id)
          .single();

        if (previousSubmission) {
          content = previousSubmission.content + " A little extra text to avoid perfect match.";
        }
      }

      // Insert submission directly to bypass deadline checks
      await supabase
        .from('submissions')
        .insert([{
          assignment_id: assignment2.id,
          user_id: student.id,
          file_url: `${student.name.replace(' ', '_')}_submission.pdf`,
          content: content,
          created_at: new Date(new Date(assignment2.deadline).getTime() - 24 * 60 * 60 * 1000).toISOString()
        }]);
    }

    console.log("Dummy data generation complete.");
  } catch (error) {
    console.error("Error generating dummy data:", error);
    throw error;
  }

  return returnData(undefined);
};