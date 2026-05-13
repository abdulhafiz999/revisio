import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, UserProgress, Attempt } from '@/services/api.client';
import { useAuth } from '@/context/AuthContext';

interface StudyContextType {
  progress: UserProgress | null;
  history: Attempt[];
  recordAttempt: (questionId: string, studentAnswer: string, timeSpent: number) => Promise<boolean>;
  getQuestionAttempt: (questionId: string) => Attempt | undefined;
  hasAttempted: (questionId: string) => boolean;
  refreshProgress: () => Promise<void>;
  loading: boolean;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Only load data when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setProgress(null);
      setHistory([]);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [progressData, recentActivity] = await Promise.all([
          apiClient.getProgress(),
          apiClient.getRecentActivity()
        ]);
        setProgress(progressData);
        setHistory(recentActivity);
      } catch (error) {
        console.error('Failed to load progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const refreshProgress = async () => {
    try {
      const [progressData, recentActivity] = await Promise.all([
        apiClient.getProgress(),
        apiClient.getRecentActivity()
      ]);
      setProgress(progressData);
      setHistory(recentActivity);
    } catch (error) {
      console.error('Failed to refresh progress data:', error);
    }
  };

  const recordAttempt = async (
    questionId: string, 
    studentAnswer: string, 
    timeSpent: number
  ): Promise<boolean> => {
    try {
      const result = await apiClient.submitAnswer({
        question_id: questionId,
        student_answer: studentAnswer,
        time_spent_seconds: timeSpent
      });

      // Refresh progress and history after successful submission
      await refreshProgress();

      return result.is_correct;
    } catch (error) {
      console.error('Failed to record attempt:', error);
      throw error;
    }
  };

  const getQuestionAttempt = (questionId: string): Attempt | undefined => {
    return history.find(h => h.question_id === questionId);
  };

  const hasAttempted = (questionId: string): boolean => {
    return history.some(h => h.question_id === questionId);
  };

  return (
    <StudyContext.Provider value={{
      progress,
      history,
      recordAttempt,
      getQuestionAttempt,
      hasAttempted,
      refreshProgress,
      loading
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
