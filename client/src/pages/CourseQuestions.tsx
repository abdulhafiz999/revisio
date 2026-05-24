import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import QuestionCard from '@/components/practice/QuestionCard';
import TopicFilter from '@/components/practice/TopicFilter';
import { 
  ArrowLeft, 
  BookOpen, 
  Filter,
  FolderOpen,
  Link as LinkIcon,
  Plus,
  Trash2,
  ExternalLink,
  Share2,
  AlertCircle,
  Flame,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient, Course, Topic, Question, SharedResource } from '@/services/api.client';
import { useApi } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useStudy } from '@/context/StudyContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const CourseQuestions: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Tabs & Resources States
  const [activeTab, setActiveTab] = useState<'practice' | 'resources'>('practice');
  const [resources, setResources] = useState<SharedResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [showAddResourceDialog, setShowAddResourceDialog] = useState(false);
  
  // Add Resource Form
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceLink, setResourceLink] = useState('');
  const [submittingResource, setSubmittingResource] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const { progress, history } = useStudy();

  const { data: course, loading: courseLoading, execute: fetchCourse } = useApi(apiClient.getCourse);
  const { data: topics, loading: topicsLoading, execute: fetchTopics } = useApi(apiClient.getTopics);
  const { data: questions, loading: questionsLoading, execute: fetchQuestions } = useApi(apiClient.getQuestions);

  const courseQuestionsMap = React.useMemo(() => {
    const map = new Map<string, Question>();
    questions?.forEach((q) => map.set(q.id, q));
    return map;
  }, [questions]);

  const courseAttempts = React.useMemo(() => {
    return history.filter((attempt) => courseQuestionsMap.has(attempt.question_id));
  }, [history, courseQuestionsMap]);

  const totalCourseAttempts = courseAttempts.length;
  const correctCourseAttempts = courseAttempts.filter((a) => a.is_correct).length;
  const courseAccuracy = totalCourseAttempts > 0 
    ? Math.round((correctCourseAttempts / totalCourseAttempts) * 100) 
    : 0;

  const topicStats = React.useMemo(() => {
    if (!topics || courseAttempts.length === 0) return [];
    
    // Group attempts by topic
    const topicAttemptsMap: Record<string, { total: number; correct: number }> = {};
    
    courseAttempts.forEach((attempt) => {
      const q = courseQuestionsMap.get(attempt.question_id);
      if (q && q.topic_id) {
        if (!topicAttemptsMap[q.topic_id]) {
          topicAttemptsMap[q.topic_id] = { total: 0, correct: 0 };
        }
        topicAttemptsMap[q.topic_id].total += 1;
        if (attempt.is_correct) {
          topicAttemptsMap[q.topic_id].correct += 1;
        }
      }
    });
    
    return topics.map((topic) => {
      const stats = topicAttemptsMap[topic.id] || { total: 0, correct: 0 };
      const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
      return {
        ...topic,
        total: stats.total,
        correct: stats.correct,
        accuracy,
      };
    }).filter(t => t.total > 0);
  }, [topics, courseAttempts, courseQuestionsMap]);

  const weakTopic = React.useMemo(() => {
    const weak = topicStats.filter(t => t.accuracy !== null && t.accuracy < 60);
    if (weak.length === 0) return null;
    return weak.reduce((min, t) => (min.accuracy === null || (t.accuracy !== null && t.accuracy < min.accuracy) ? t : min), weak[0]);
  }, [topicStats]);

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
      fetchTopics(courseId);
      fetchQuestions({ courseId });
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId && activeTab === 'practice') {
      fetchQuestions({ 
        courseId,
        topicId: selectedTopic || undefined,
        difficulty: selectedDifficulty as 'easy' | 'medium' | 'hard' | undefined
      });
    }
  }, [selectedTopic, selectedDifficulty, courseId, activeTab]);

  // Fetch shared resources
  const fetchResources = async () => {
    if (!courseId) return;
    try {
      setResourcesLoading(true);
      const res = await apiClient.getSharedResources(courseId);
      setResources(res);
    } catch (err) {
      toast({
        title: 'Failed to load resources',
        description: 'Could not fetch shared resource directory.',
        variant: 'destructive',
      });
    } finally {
      setResourcesLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && activeTab === 'resources') {
      fetchResources();
    }
  }, [activeTab, courseId]);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !resourceTitle.trim() || !resourceLink.trim()) return;

    try {
      setSubmittingResource(true);
      await apiClient.addSharedResource(courseId, resourceTitle, resourceLink);
      toast({
        title: 'Resource shared!',
        description: 'Your class link has been successfully added.',
      });
      setResourceTitle('');
      setResourceLink('');
      setShowAddResourceDialog(false);
      fetchResources();
    } catch (err: any) {
      toast({
        title: 'Sharing failed',
        description: err.response?.data?.error || 'Could not save link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await apiClient.deleteSharedResource(resourceId);
      toast({
        title: 'Resource deleted',
        description: 'Resource has been removed from directory.',
      });
      fetchResources();
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: 'Could not delete resource link.',
        variant: 'destructive',
      });
    }
  };

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
            
            {activeTab === 'practice' && (
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            )}

            {activeTab === 'resources' && (
              <Button
                onClick={() => setShowAddResourceDialog(true)}
                className="bg-gradient-primary hover:opacity-90 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Share Drive / Link
              </Button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('practice')}
            className={cn(
              "px-6 py-3 font-semibold text-sm border-b-2 transition-all duration-200",
              activeTab === 'practice' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Practice Quizzes
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={cn(
              "px-6 py-3 font-semibold text-sm border-b-2 transition-all duration-200 flex items-center gap-2",
              activeTab === 'resources' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FolderOpen className="h-4 w-4" />
            Shared Resources (Drive Links)
          </button>
        </div>

        {/* Content Section */}
        {activeTab === 'practice' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
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
                               {/* Advanced Interactive Course Analytics */}
                <div className="mt-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-tight">Course Analytics</span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>

                  {/* Circular Accuracy Meter */}
                  <div className="flex flex-col items-center justify-center py-2 relative">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Background track circle */}
                        <circle
                          cx="56"
                          cy="56"
                          r="44"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-muted/30"
                        />
                        {/* Interactive glow layer */}
                        <circle
                          cx="56"
                          cy="56"
                          r="44"
                          stroke="hsl(175,60%,35%)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 44}
                          strokeDashoffset={2 * Math.PI * 44 - (courseAccuracy / 100) * (2 * Math.PI * 44)}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out opacity-25 blur-[2px]"
                        />
                        {/* Active stroke progress circle */}
                        <circle
                          cx="56"
                          cy="56"
                          r="44"
                          stroke="hsl(175,60%,35%)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 44}
                          strokeDashoffset={2 * Math.PI * 44 - (courseAccuracy / 100) * (2 * Math.PI * 44)}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      {/* Text indicator inside circle */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-foreground">{courseAccuracy}%</span>
                        <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Accuracy</span>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-xs text-muted-foreground font-medium">
                        {totalCourseAttempts > 0 
                          ? `${correctCourseAttempts} of ${totalCourseAttempts} correct`
                          : "No attempts yet in this course"}
                      </p>
                    </div>
                  </div>

                  {/* Daily Streak Indicator */}
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                      <Flame className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-foreground">{progress?.streak_days || 0}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">Day Streak</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight truncate">
                        {(progress?.streak_days || 0) > 0 
                          ? "Great momentum! Study daily." 
                          : "Start your daily learning streak!"}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Focus Topic Alert / Encouragement */}
                  {weakTopic ? (
                    <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10 space-y-1">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Focus Needed</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        You have <span className="font-semibold text-destructive">{weakTopic.accuracy}%</span> accuracy in <strong className="text-foreground">{weakTopic.name}</strong>. Practice more questions in this topic.
                      </p>
                    </div>
                  ) : totalCourseAttempts > 0 ? (
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">On Track</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Keep up the excellent work! You are solidifying your understanding.
                      </p>
                    </div>
                  ) : null}
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
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Resources empty list & directory */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Classroom Sharing Hub</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload your resources (exam guides, lecture slides, past papers) to Google Drive, share the folder link, and paste it here so the entire class has immediate access!
                </p>
              </div>
            </div>

            {resourcesLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : resources && resources.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {resources.map((resource) => {
                  const isGoogleDrive = resource.resource_type === 'google_drive';
                  const isOneDrive = resource.resource_type === 'onedrive';
                  
                  return (
                    <div 
                      key={resource.id} 
                      className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-lg border",
                          isGoogleDrive && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                          isOneDrive && "bg-blue-500/10 border-blue-500/20 text-blue-500",
                          !isGoogleDrive && !isOneDrive && "bg-primary/10 border-primary/20 text-primary"
                        )}>
                          {isGoogleDrive ? (
                            <FolderOpen className="h-5 w-5" />
                          ) : (
                            <LinkIcon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground leading-snug">{resource.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {isGoogleDrive ? 'Google Drive Folder' : isOneDrive ? 'OneDrive Link' : 'Shared Web Link'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(resource.url, '_blank')}
                          className="hover:bg-muted"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Link
                        </Button>
                        {user?.id === resource.user_id && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteResource(resource.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg text-foreground">No resources shared yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Be the first to share a Google Drive lecture notes folder or review guide link with the class!
                </p>
                <Button
                  onClick={() => setShowAddResourceDialog(true)}
                  className="mt-4 bg-gradient-primary hover:opacity-90"
                >
                  Share First Link
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Resource Dialog */}
      <Dialog open={showAddResourceDialog} onOpenChange={setShowAddResourceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Link with Class
            </DialogTitle>
            <DialogDescription>
              Add a Google Drive, OneDrive, or document folder link for {course.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddResource} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="resource-title">Resource Title</Label>
              <Input
                id="resource-title"
                placeholder="e.g. CHM 101 Past Questions Drive Folder"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resource-url">Folder/Document Link (URL)</Label>
              <Input
                id="resource-url"
                type="url"
                placeholder="e.g. https://drive.google.com/drive/folders/..."
                value={resourceLink}
                onChange={(e) => setResourceLink(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submittingResource}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {submittingResource ? 'Sharing link...' : 'Share with Class'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default CourseQuestions;
