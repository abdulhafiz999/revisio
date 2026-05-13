import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import QuestionCard from '@/components/practice/QuestionCard';
import TopicFilter from '@/components/practice/TopicFilter';
import { ArrowLeft, BookOpen, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient, Course, Topic, Question } from '@/services/api.client';
import { useApi } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

const CourseQuestions: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const { data: course, loading: courseLoading, execute: fetchCourse } = useApi(apiClient.getCourse);
  const { data: topics, loading: topicsLoading, execute: fetchTopics } = useApi(apiClient.getTopics);
  const { data: questions, loading: questionsLoading, execute: fetchQuestions } = useApi(apiClient.getQuestions);

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
      fetchTopics(courseId);
      fetchQuestions({ courseId });
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchQuestions({ 
        courseId,
        topicId: selectedTopic || undefined,
        difficulty: selectedDifficulty as 'easy' | 'medium' | 'hard' | undefined
      });
    }
  }, [selectedTopic, selectedDifficulty, courseId]);

  const loading = courseLoading || topicsLoading || questionsLoading;

  if (courseLoading) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Course not found</p>
            <Link to="/practice">
              <Button variant="link" className="mt-4">
                ← Back to courses
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link 
            to="/practice"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to courses
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{course.icon}</span>
              <div>
                <p className="text-sm text-muted-foreground">{course.code}</p>
                <h1 className="text-2xl font-bold">{course.name}</h1>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-20">
              <TopicFilter
                topics={topics || []}
                selectedTopic={selectedTopic}
                onSelectTopic={setSelectedTopic}
                selectedDifficulty={selectedDifficulty}
                onSelectDifficulty={setSelectedDifficulty}
              />
              
              {/* Quick Stats */}
              <div className="mt-4 p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Quick Stats</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Showing</span>
                    <span className="font-medium">{questions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Topics</span>
                    <span className="font-medium">{topics?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="lg:col-span-3 space-y-6">
            {questionsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : questions && questions.length > 0 ? (
              questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No questions match your current filters.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSelectedTopic(null);
                    setSelectedDifficulty(null);
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CourseQuestions;
