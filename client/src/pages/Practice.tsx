import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';

import { 
  BookOpen,
  Sparkles, 
  Upload, 
  FileText, 
  Brain, 
  Clock, 
  AlertCircle, 
  RotateCcw,
  Calendar,
  Award
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient, StudyNote, Question, AIQuizHistory } from '@/services/api.client';
import { useApi } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useStudy } from '@/context/StudyContext';
import QuestionCard from '@/components/practice/QuestionCard';
import { cn } from '@/lib/utils';

const Practice: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('notes');
  const [notes, setNotes] = React.useState<StudyNote[]>([]);
  const [notesLoading, setNotesLoading] = React.useState(false);
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null);
  const [difficulty, setDifficulty] = React.useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = React.useState<number>(10);
  const [uploading, setUploading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [showQuizDialog, setShowQuizDialog] = React.useState(false);
  const [practiceQuestions, setPracticeQuestions] = React.useState<Question[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);

  const [quizzes, setQuizzes] = React.useState<AIQuizHistory[]>([]);
  const [quizzesLoading, setQuizzesLoading] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  const { toast } = useToast();
  const { hasAttempted, refreshProgress } = useStudy();



  const fetchNotes = async (selectFirst = false) => {
    try {
      setNotesLoading(true);
      const data = await apiClient.getNotes();
      setNotes(data);
      if (data.length > 0 && (selectFirst || !selectedNoteId)) {
        setSelectedNoteId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load study notes:', err);
    } finally {
      setNotesLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setQuizzesLoading(true);
      const data = await apiClient.getAIQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error('Failed to load quiz history:', err);
    } finally {
      setQuizzesLoading(false);
    }
  };

  const handleReviewQuiz = async (noteId: string) => {
    try {
      setActionLoadingId(noteId + '-review');
      const questions = await apiClient.getQuestions({ topicId: noteId });
      if (questions && questions.length > 0) {
        setPracticeQuestions(questions);
        setShowQuizDialog(true);
      } else {
        toast({
          title: 'Error loading questions',
          description: 'No questions found for this quiz.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Failed to load questions for review:', err);
      toast({
        title: 'Error loading questions',
        description: 'Failed to load questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRetakeQuiz = async (noteId: string) => {
    try {
      setActionLoadingId(noteId + '-retake');
      await apiClient.resetQuizAttempts(noteId);
      refreshProgress();
      const questions = await apiClient.getQuestions({ topicId: noteId });
      if (questions && questions.length > 0) {
        setPracticeQuestions(questions);
        setShowQuizDialog(true);
        await fetchQuizzes();
      } else {
        toast({
          title: 'Error loading questions',
          description: 'No questions found for this quiz.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Failed to retake quiz:', err);
      toast({
        title: 'Failed to reset quiz',
        description: 'Could not reset attempts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    fetchNotes(true);
    fetchQuizzes();
  }, []);



  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const result = await apiClient.uploadPDF(file);
      if (result) {
        toast({
          title: 'Upload successful',
          description: `${file.name} has been uploaded and processed`,
        });
        // Refresh notes list
        const updatedNotes = await apiClient.getNotes();
        setNotes(updatedNotes);
        // Automatically select the newly uploaded note
        setSelectedNoteId(result.id);
      }
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload the file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        await handleFileUpload(file);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Only PDF files are supported',
          variant: 'destructive',
        });
      }
    }
  }, [notes]);

  const handleGenerateQuiz = async () => {
    if (!selectedNoteId) return;
    try {
      setGenerating(true);
      const result = await apiClient.generateQuestions(selectedNoteId, questionCount, difficulty);
      if (result && result.length > 0) {
        setPracticeQuestions(result);
        setShowQuizDialog(true);
      } else {
        toast({
          title: 'Failed to generate questions',
          description: 'AI did not return any questions. Please try again or try another note.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Generation failed',
        description: err.response?.data?.error || 'Could not generate questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Practice Portal</h1>
            </div>
            <p className="text-muted-foreground">
              Practice past exam questions or generate custom AI quizzes from your study notes
            </p>
          </div>
        </div>

        {/* Tab System */}
        <Tabs defaultValue="notes" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/80 p-1 rounded-xl">
            <TabsTrigger value="notes" className="rounded-lg py-2.5 font-semibold text-sm transition-all flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Notes Quizzes
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg py-2.5 font-semibold text-sm transition-all flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              Quiz History
            </TabsTrigger>
          </TabsList>



          {/* AI Notes Quizzes Tab Content */}
          <TabsContent value="notes" className="space-y-6 outline-none">
            {notes.length === 0 && !notesLoading ? (
              /* Drag & Drop Upload Zone (Empty State) */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-200 bg-card/40 backdrop-blur-md",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/20"
                )}
              >
                <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                  <div className={cn(
                    "p-4 rounded-full bg-muted text-muted-foreground transition-colors",
                    isDragging && "bg-primary/10 text-primary"
                  )}>
                    <Upload className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Upload your PDF Study Notes</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag and drop a PDF study guide or lecture slides here to generate your first custom practice quiz!
                    </p>
                  </div>
                  <Button asChild variant="default" disabled={uploading} className="mt-2 bg-gradient-primary">
                    <label htmlFor="notes-tab-upload-empty" className="cursor-pointer">
                      {uploading ? "Uploading..." : "Browse PDF File"}
                    </label>
                  </Button>
                  <input
                    type="file"
                    id="notes-tab-upload-empty"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              </div>
            ) : (
              /* Two column note selector & configurator */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Notes List (Left side) */}
                <div className="md:col-span-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Your Materials</h3>
                    <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary hover:text-primary/80">
                      <label htmlFor="notes-tab-upload-list" className="cursor-pointer flex items-center">
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        {uploading ? "Uploading..." : "Upload PDF"}
                      </label>
                    </Button>
                    <input
                      type="file"
                      id="notes-tab-upload-list"
                      accept=".pdf"
                      onChange={handleFileInput}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>

                  {notesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {notes.map(note => (
                        <button
                          key={note.id}
                          onClick={() => setSelectedNoteId(note.id)}
                          className={cn(
                            "w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3",
                            selectedNoteId === note.id
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/30 hover:bg-muted/30"
                          )}
                        >
                          <div className={cn(
                            "p-2.5 rounded-lg shrink-0",
                            selectedNoteId === note.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "text-sm font-semibold truncate",
                              selectedNoteId === note.id ? "text-primary" : "text-foreground"
                            )}>
                              {note.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Uploaded {new Date(note.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Configuration Panel (Right side) */}
                <div className="md:col-span-2">
                  {selectedNote ? (
                    <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm space-y-6">
                      <div className="border-b pb-4">
                        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                          <Brain className="h-4 w-4" />
                          AI Practice Quiz Generator
                        </div>
                        <h3 className="text-xl font-bold mt-2 text-foreground">{selectedNote.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Create custom multiple-choice questions from this document using Gemini 3.5 Flash.
                        </p>
                      </div>

                      <div className="space-y-5">
                        {/* Difficulty Selector */}
                        <div className="space-y-2.5">
                          <label className="text-sm font-semibold text-foreground">Difficulty Level</label>
                          <div className="grid grid-cols-3 gap-3">
                            {(['easy', 'medium', 'hard'] as const).map((level) => {
                              const isActive = difficulty === level;
                              return (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => setDifficulty(level)}
                                  className={cn(
                                    "py-3 px-4 rounded-xl border text-sm font-semibold transition-all capitalize",
                                    isActive
                                      ? level === 'easy'
                                        ? "bg-success/15 border-success text-success shadow-sm"
                                        : level === 'medium'
                                        ? "bg-warning/15 border-warning text-warning shadow-sm"
                                        : "bg-destructive/15 border-destructive text-destructive shadow-sm"
                                      : "border-border hover:bg-muted/50 text-muted-foreground"
                                  )}
                                >
                                  {level}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Question Count Selector */}
                        <div className="space-y-2.5">
                          <label className="text-sm font-semibold text-foreground">Number of Questions</label>
                          <div className="grid grid-cols-3 gap-3">
                            {([10, 20, 25] as const).map((count) => {
                              const isActive = questionCount === count;
                              return (
                                <button
                                  key={count}
                                  type="button"
                                  onClick={() => setQuestionCount(count)}
                                  className={cn(
                                    "py-3 px-4 rounded-xl border text-sm font-semibold transition-all",
                                    isActive
                                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                      : "border-border hover:bg-muted/50 text-muted-foreground"
                                  )}
                                >
                                  {count} Questions
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          onClick={handleGenerateQuiz}
                          disabled={generating}
                          className="w-full bg-gradient-primary hover:opacity-90 font-bold py-6 text-base rounded-xl flex items-center justify-center gap-2"
                        >
                          {generating ? (
                            <>
                              <Sparkles className="h-5 w-5 animate-spin text-white" />
                              Generating Custom Quiz...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5 text-white" />
                              Generate & Start Custom Quiz
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-2xl p-12 text-center text-muted-foreground bg-card/40 backdrop-blur-md flex flex-col items-center justify-center h-64">
                      <Brain className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm font-medium">Select a study note from the left to configure your quiz.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Quiz History Tab Content */}
          <TabsContent value="history" className="space-y-6 outline-none">
            {quizzesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="border rounded-2xl p-16 text-center text-muted-foreground bg-card/40 backdrop-blur-md flex flex-col items-center justify-center min-h-[300px]">
                <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-bold text-lg text-foreground mb-1">No Quiz History Yet</h3>
                <p className="text-sm max-w-md mx-auto">
                  Quizzes you generate from study notes will appear here. Go to the <span className="text-primary font-semibold cursor-pointer" onClick={() => setActiveTab('notes')}>AI Notes Quizzes</span> tab to get started!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => {
                  const isCompleted = quiz.attempted_questions === quiz.total_questions;
                  const isActionLoading = actionLoadingId !== null;
                  const isReviewLoading = actionLoadingId === `${quiz.note_id}-review`;
                  const isRetakeLoading = actionLoadingId === `${quiz.note_id}-retake`;
                  
                  // Score color mapping
                  let scoreColor = "text-muted-foreground bg-muted";
                  if (quiz.attempted_questions > 0) {
                    if (quiz.score_percentage >= 80) scoreColor = "text-success bg-success/10 border border-success/20";
                    else if (quiz.score_percentage >= 50) scoreColor = "text-warning bg-warning/10 border border-warning/20";
                    else scoreColor = "text-destructive bg-destructive/10 border border-destructive/20";
                  }

                  return (
                    <div 
                      key={quiz.note_id} 
                      className="p-5 rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between h-[230px]"
                    >
                      <div className="space-y-3 min-w-0">
                        {/* Title & badge */}
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-bold text-base text-foreground truncate flex-1 leading-snug">
                            {quiz.note_title}
                          </h4>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            isCompleted ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                          )}>
                            {isCompleted ? "Completed" : "In Progress"}
                          </span>
                        </div>

                        {/* Date and difficulty */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(quiz.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px]">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              quiz.difficulty === 'easy' ? "bg-success" : quiz.difficulty === 'medium' ? "bg-warning" : "bg-destructive"
                            )} />
                            {quiz.difficulty}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="text-foreground">
                              {quiz.attempted_questions}/{quiz.total_questions} Questions
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${(quiz.attempted_questions / quiz.total_questions) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Score and actions */}
                      <div className="flex items-center justify-between pt-4 border-t gap-3">
                        <div className={cn("px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-sm", scoreColor)}>
                          <Award className="h-4 w-4 shrink-0" />
                          {quiz.attempted_questions > 0 ? `${quiz.score_percentage}%` : "— %"}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewQuiz(quiz.note_id)}
                            disabled={isActionLoading}
                            className="text-xs h-9 rounded-lg"
                          >
                            {isReviewLoading ? "Loading..." : "Review"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetakeQuiz(quiz.note_id)}
                            disabled={isActionLoading}
                            className="text-xs h-9 rounded-lg gap-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                          >
                            <RotateCcw className={cn("h-3 w-3", isRetakeLoading && "animate-spin")} />
                            {isRetakeLoading ? "Reset..." : "Retake"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Generating Dialog Overlay */}
      <Dialog open={generating} onOpenChange={() => { }}>
        <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Sparkles className="h-5 w-5 text-primary animate-spin" />
              Generating your quiz
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2 text-muted-foreground text-sm">
              <div>AI is reading your notes and building {questionCount} questions.</div>
              <div className="text-xs">
                This usually takes 5–10 seconds. Larger notes or 20+ questions may take a bit longer.
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Active Quiz Dialog */}
      <Dialog
        open={showQuizDialog}
        onOpenChange={(open) => {
          setShowQuizDialog(open);
          if (!open) {
            refreshProgress();
            fetchQuizzes();
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden [&>button]:hidden">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Practice Quiz: {selectedNote?.title}
            </DialogTitle>
            <div className="flex items-center justify-between gap-3">
              <DialogDescription className="text-left flex-1 min-w-0 m-0">
                {practiceQuestions.length} {difficulty} questions — select an answer and submit before viewing explanations.
              </DialogDescription>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setShowQuizDialog(false);
                  refreshProgress();
                }}
              >
                Close Quiz
              </Button>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {practiceQuestions.map((question, index) => (
                <QuestionCard key={question.id} question={question} index={index} />
              ))}
            </div>
            {practiceQuestions.length > 0 && practiceQuestions.every((q) => hasAttempted(q.id)) && (
              <div className="mt-6 p-5 rounded-2xl border bg-success/10 border-success/20 text-center space-y-3">
                <p className="font-bold text-success text-base">Quiz complete! 🎉</p>
                <p className="text-sm text-muted-foreground">
                  Excellent work! Your answers have been recorded and your streak has been updated.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowQuizDialog(false);
                    refreshProgress();
                  }}
                  className="mt-2"
                >
                  Return to Practice Tab
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Practice;

