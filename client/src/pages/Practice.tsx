import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CourseCard from '@/components/practice/CourseCard';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  Upload, 
  FileText, 
  Brain, 
  Clock, 
  AlertCircle, 
  ChevronRight 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient, Course, StudyNote, Question } from '@/services/api.client';
import { useApi } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useStudy } from '@/context/StudyContext';
import QuestionCard from '@/components/practice/QuestionCard';
import { cn } from '@/lib/utils';

const Practice: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('courses');
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

  const { toast } = useToast();
  const { hasAttempted, refreshProgress } = useStudy();

  const { data: courses, loading: coursesLoading, error: coursesError, execute: fetchCourses } = useApi(apiClient.getCourses);

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

  useEffect(() => {
    fetchCourses();
    fetchNotes(true);
  }, []);

  const filteredCourses = (courses || []).filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Tabs defaultValue="courses" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/80 p-1 rounded-xl">
            <TabsTrigger value="courses" className="rounded-lg py-2.5 font-semibold text-sm transition-all flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course Questions
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg py-2.5 font-semibold text-sm transition-all flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Notes Quizzes
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab Content */}
          <TabsContent value="courses" className="space-y-6 outline-none">
            {/* Search and learning banner */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 flex-1 md:flex-initial text-center md:text-left">
                <p className="text-xs">
                  📚 <strong>Learning Mode Active:</strong> You must attempt each question before viewing explanations.
                </p>
              </div>
            </div>

            {/* Course Grid */}
            {coursesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : coursesError ? (
              <div className="text-center py-12">
                <p className="text-destructive">{coursesError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}

            {!coursesLoading && filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No courses found matching "{searchTerm}"</p>
              </div>
            )}
          </TabsContent>

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
            <DialogDescription className="space-y-2 pt-2">
              <p>AI is reading your notes and building {questionCount} questions.</p>
              <p className="text-xs">
                This usually takes 5–10 seconds. Larger notes or 20+ questions may take a bit longer.
              </p>
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

