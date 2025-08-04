export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface Class {
  id: string;
  title: string;
  code: string;
  createdBy: string; // user id
  semester: string;
}

export interface ClassMember {
  id: string;
  classId: string;
  userId: string;
}

export interface Assignment {
  id: string;
  title: string;
  deadline: Date;
  classId: string;
  createdBy: string; // user id
  submissionsOpen: boolean;
}

export interface PlagiarismDetail {
  partnerId: string;
  similarity: number;
}

export interface AnalysisData {
  aiScore: number;
  plagiarismScore: number;
  plagiarismDetails: PlagiarismDetail[];
  similarityMatrix: {
    [userId: string]: { [partnerId: string]: number };
  };
}

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  fileUrl: string; // Just a filename for mock
  aiScore: number | null;
  plagiarismScore: number | null;
  resultJson: string | null; // Will store stringified AnalysisData
  createdAt: Date;
  content: string; // Mock content for analysis
}