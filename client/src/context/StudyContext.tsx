import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Question, 
  AttemptHistory, 
  StudentProgress,
  studentProgress as initialProgress,
  attemptHistory as initialHistory 
} from '@/data/mockData';

interface StudyContextType {
  progress: StudentProgress;
  history: AttemptHistory[];
  recordAttempt: (questionId: string, studentAnswer: string, isCorrect: boolean, timeSpent: number) => void;
  getQuestionAttempt: (questionId: string) => AttemptHistory | undefined;
  hasAttempted: (questionId: string) => boolean;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<StudentProgress>(initialProgress);
  const [history, setHistory] = useState<AttemptHistory[]>(initialHistory);

  const recordAttempt = (
    questionId: string, 
    studentAnswer: string, 
    isCorrect: boolean, 
    timeSpent: number
  ) => {
    const newAttempt: AttemptHistory = {
      questionId,
      attemptedAt: new Date().toISOString(),
      studentAnswer,
      isCorrect,
      timeSpent
    };

    setHistory(prev => [...prev, newAttempt]);
    
    setProgress(prev => ({
      ...prev,
      totalAttempted: prev.totalAttempted + 1,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      wrongAnswers: isCorrect ? prev.wrongAnswers : prev.wrongAnswers + 1
    }));
  };

  const getQuestionAttempt = (questionId: string): AttemptHistory | undefined => {
    return history.find(h => h.questionId === questionId);
  };

  const hasAttempted = (questionId: string): boolean => {
    return history.some(h => h.questionId === questionId);
  };

  return (
    <StudyContext.Provider value={{
      progress,
      history,
      recordAttempt,
      getQuestionAttempt,
      hasAttempted
    }}>
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = (): StudyContextType => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
