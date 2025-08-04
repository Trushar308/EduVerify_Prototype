
import { User, UserRole, Class, ClassMember, Assignment, Submission } from '../types';
import { generateDummySubmissionContent, generateAIAssistedSubmissionContent } from './geminiService';
import { runAnalysis } from '../utils/analysis';

// In-memory database
let users: User[] = [];
let classes: Class[] = [];
let classMembers: ClassMember[] = [];
let assignments: Assignment[] = [];
let submissions: Submission[] = [];

const simulateDelay = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), Math.random() * 500 + 200));

const generateId = () => Math.random().toString(36).substring(2, 10);
const generateClassCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// --- Auth ---
export const signUp = async (name: string, email: string, role: UserRole): Promise<User> => {
  if (users.some(u => u.email === email)) {
    throw new Error("User with this email already exists.");
  }
  const newUser: User = { id: generateId(), name, email, role, createdAt: new Date() };
  users.push(newUser);
  return simulateDelay(newUser);
};

export const login = async (email: string): Promise<User> => {
  const user = users.find(u => u.email === email);
  if (!user) {
    throw new Error("User not found.");
  }
  return simulateDelay(user);
};

// --- Classes ---
export const createClass = async (title: string, semester: string, userId: string): Promise<Class> => {
  const newClass: Class = {
    id: generateId(),
    title,
    semester,
    code: generateClassCode(),
    createdBy: userId
  };
  classes.push(newClass);
  // The creator automatically joins the class
  classMembers.push({ id: generateId(), classId: newClass.id, userId });
  return simulateDelay(newClass);
};

export const joinClass = async (code: string, userId: string): Promise<Class> => {
  const targetClass = classes.find(c => c.code === code);
  if (!targetClass) throw new Error("Class not found.");
  if (classMembers.some(cm => cm.classId === targetClass.id && cm.userId === userId)) {
    throw new Error("You are already in this class.");
  }
  classMembers.push({ id: generateId(), classId: targetClass.id, userId });
  return simulateDelay(targetClass);
};

export const getClassesForUser = async (userId: string, role: UserRole): Promise<Class[]> => {
  let userClasses: Class[];
  if (role === UserRole.TEACHER) {
    userClasses = classes.filter(c => c.createdBy === userId);
  } else {
    const memberOf = classMembers.filter(cm => cm.userId === userId).map(cm => cm.classId);
    userClasses = classes.filter(c => memberOf.includes(c.id));
  }
  return simulateDelay(userClasses);
};

export const getClassById = async (classId: string): Promise<{ classInfo: Class, members: User[] } | null> => {
  const classInfo = classes.find(c => c.id === classId);
  if (!classInfo) return simulateDelay(null);
  const memberIds = classMembers.filter(cm => cm.classId === classId).map(cm => cm.userId);
  const members = users.filter(u => memberIds.includes(u.id));
  return simulateDelay({ classInfo, members });
};

// --- Assignments ---
export const createAssignment = async (title: string, deadline: Date, classId: string, userId: string): Promise<Assignment> => {
  const newAssignment: Assignment = { id: generateId(), title, deadline, classId, createdBy: userId, submissionsOpen: true };
  assignments.push(newAssignment);
  return simulateDelay(newAssignment);
};

export const getAssignmentsForClass = async (classId: string): Promise<Assignment[]> => {
  return simulateDelay(assignments.filter(a => a.classId === classId));
};

export const getAssignmentById = async (assignmentId: string): Promise<Assignment | null> => {
  return simulateDelay(assignments.find(a => a.id === assignmentId) || null);
};

export const toggleAssignmentSubmissions = async (assignmentId: string): Promise<Assignment> => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) {
        throw new Error("Assignment not found.");
    }
    assignment.submissionsOpen = !assignment.submissionsOpen;
    return simulateDelay(assignment);
};


// --- Submissions ---
export const createSubmission = async (assignmentId: string, userId: string, fileName: string, content: string): Promise<Submission> => {
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment || !assignment.submissionsOpen || new Date(assignment.deadline) < new Date()) {
      throw new Error("Submissions are not being accepted for this assignment at this time.");
  }
  if (submissions.some(s => s.assignmentId === assignmentId && s.userId === userId)) {
    throw new Error("You have already submitted for this assignment.");
  }
  const newSubmission: Submission = {
    id: generateId(),
    assignmentId,
    userId,
    fileUrl: fileName,
    aiScore: null,
    plagiarismScore: null,
    resultJson: null,
    createdAt: new Date(),
    content
  };
  submissions.push(newSubmission);
  return simulateDelay(newSubmission);
};

export const getSubmissionsForAssignment = async (assignmentId: string): Promise<(Submission & { student: User })[]> => {
  const relevantSubmissions = submissions.filter(s => s.assignmentId === assignmentId);
  const result = relevantSubmissions.map(s => {
    const student = users.find(u => u.id === s.userId)!;
    return { ...s, student };
  });
  return simulateDelay(result);
};

export const getSubmissionForUser = async (assignmentId: string, userId: string): Promise<Submission | null> => {
  const submission = submissions.find(s => s.assignmentId === assignmentId && s.userId === userId) || null;
  return simulateDelay(submission);
};

// --- Analysis ---
export const runAssignmentAnalysis = async (assignmentId: string): Promise<Submission[]> => {
  const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignmentId);
  if (assignmentSubmissions.length === 0) return [];

  const updatedSubmissions = runAnalysis(assignmentSubmissions);
  
  // Update the main submissions array
  updatedSubmissions.forEach(updatedSub => {
    const index = submissions.findIndex(s => s.id === updatedSub.id);
    if (index !== -1) {
      submissions[index] = updatedSub;
    }
  });

  return simulateDelay(updatedSubmissions);
};


// --- DUMMY DATA ---
export const generateDummyData = async (): Promise<void> => {
  console.log("Generating dummy data...");
  // Clear existing data
  users = [];
  classes = [];
  classMembers = [];
  assignments = [];
  submissions = [];

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
  const assignment2 = await createAssignment('History of the Internet', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), cs101.id, teacher.id); // Past deadline
  
  // Manually close the past-deadline assignment
  const assignmentToClose = assignments.find(a => a.id === assignment2.id);
  if (assignmentToClose) {
    assignmentToClose.submissionsOpen = false;
  }

  // Create submissions for assignment 2 (so it can be analyzed)
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    let content = '';
    // Let's make 2 students use AI-assisted content
    if (i < 2) {
      content = await generateAIAssistedSubmissionContent(assignment2.title);
    } else {
      content = await generateDummySubmissionContent(assignment2.title);
    }
    // Make two students plagiarize each other
    if (i === 4) {
      const student3content = submissions.find(s => s.userId === students[3].id)?.content;
      content = student3content ? student3content + " A little extra text to avoid perfect match." : content;
    }

    // Create submission object directly since createSubmission API has checks for deadlines
    const dummySubmission: Submission = {
        id: generateId(),
        assignmentId: assignment2.id,
        userId: student.id,
        fileUrl: `${student.name.replace(' ', '_')}_submission.pdf`,
        aiScore: null,
        plagiarismScore: null,
        resultJson: null,
        createdAt: new Date(new Date(assignment2.deadline).getTime() - 24 * 60 * 60 * 1000), // submitted before deadline
        content
    };
    submissions.push(dummySubmission);
  }

  console.log("Dummy data generation complete.");
  return simulateDelay(undefined);
};