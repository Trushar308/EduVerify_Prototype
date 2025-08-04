import { Submission, AnalysisData, PlagiarismDetail } from '../types';

// Dummy AI Detection
const detectAI = (content: string): number => {
  const aiKeywords = ['gpt', 'gemini', 'generative', 'ai model', 'language model'];
  const sentences = content.toLowerCase().split(/[.!?]/);
  let aiMentions = 0;

  sentences.forEach(sentence => {
    if (aiKeywords.some(keyword => sentence.includes(keyword))) {
      aiMentions++;
    }
  });

  if (aiMentions > 0) {
    return 85 + Math.floor(Math.random() * 15); // High score if AI is mentioned
  }

  // Simple heuristic: very long words or complex sentences might indicate AI
  const words = content.split(/\s+/);
  const avgWordLength = words.reduce((acc, word) => acc + word.length, 0) / words.length;
  if (avgWordLength > 6.5) {
     return 50 + Math.floor(Math.random() * 25);
  }
  
  return 5 + Math.floor(Math.random() * 25);
};

// Dummy Plagiarism Detection (Jaccard Similarity)
const calculateSimilarity = (text1: string, text2: string): number => {
  const set1 = new Set(text1.toLowerCase().split(/\s+/).slice(0, 100)); // Compare first 100 words for more accuracy
  const set2 = new Set(text2.toLowerCase().split(/\s+/).slice(0, 100));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;

  const similarity = (intersection.size / union.size) * 100;
  return Math.round(similarity);
};

export const runAnalysis = (submissions: Submission[]): Submission[] => {
  const analyzedSubmissions: Submission[] = JSON.parse(JSON.stringify(submissions));

  const submissionsWithContent = analyzedSubmissions.filter(s => s.content);
  if (submissionsWithContent.length === 0) return analyzedSubmissions;
  
  const userIds = submissionsWithContent.map(s => s.userId);
  const similarityMatrix: { [userId: string]: { [partnerId: string]: number } } = {};

  // Initialize matrix
  userIds.forEach(u1 => {
    similarityMatrix[u1] = {};
  });

  // Calculate pairwise similarity
  for (let i = 0; i < submissionsWithContent.length; i++) {
    for (let j = i + 1; j < submissionsWithContent.length; j++) {
      const sub1 = submissionsWithContent[i];
      const sub2 = submissionsWithContent[j];
      const similarity = calculateSimilarity(sub1.content, sub2.content);
      similarityMatrix[sub1.userId][sub2.userId] = similarity;
      similarityMatrix[sub2.userId][sub1.userId] = similarity;
    }
  }

  // Final processing for each submission
  return analyzedSubmissions.map(sub => {
    if (!sub.content) return sub;

    const aiScore = detectAI(sub.content);
    
    const similarities = similarityMatrix[sub.userId] ? Object.values(similarityMatrix[sub.userId]) : [0];
    const maxSimilarity = Math.max(0, ...similarities);

    // Find top plagiarism partners
    const plagiarismDetails: PlagiarismDetail[] = [];
    if(similarityMatrix[sub.userId]) {
        Object.entries(similarityMatrix[sub.userId])
            .filter(([, sim]) => sim > 60) // Plagiarism threshold
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3) // Top 3
            .forEach(([partnerId, similarity]) => {
                plagiarismDetails.push({ partnerId, similarity });
            });
    }

    const analysisData: AnalysisData = {
      aiScore,
      plagiarismScore: maxSimilarity,
      plagiarismDetails,
      similarityMatrix,
    };
    
    sub.aiScore = aiScore;
    sub.plagiarismScore = maxSimilarity;
    sub.resultJson = JSON.stringify(analysisData);
    
    return sub;
  });
};