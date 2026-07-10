import React, { useState, useCallback, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Upload,
  BookOpen,
  Sparkles,
  FileQuestion,
  Lightbulb,
  AlertCircle,
  Trash2,
  MoreVertical,
  FileType,
  Brain,
  Share2,
  ExternalLink,
  Link2,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, Question } from '@/services/api.client';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useStudy } from '@/context/StudyContext';
import QuestionCard from '@/components/practice/QuestionCard';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const StudyNotes: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [isQuizMinimized, setIsQuizMinimized] = useState(false);
  const isMinimizingRef = useRef(false);
  const [showGeneratingDialog, setShowGeneratingDialog] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAIResultDialog, setShowAIResultDialog] = useState(false);
  const [aiResultTitle, setAIResultTitle] = useState('');
  const [aiResultContent, setAIResultContent] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasAttempted, refreshProgress } = useStudy();
  const navigate = useNavigate();

  // Bulk quiz submission state
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);
  const [submittingAll, setSubmittingAll] = useState(false);

  // Open a Cloudinary PDF URL inline in a new tab.
  // Problem: /raw/upload/ URLs are served by Cloudinary with Content-Disposition: attachment,
  // so window.open() always triggers a download instead of displaying inline.
  // Fix: fetch the file, re-wrap it as a Blob with explicit application/pdf MIME type,
  // then open the local blob:// URL. The browser always renders blob PDF URLs inline.
  const viewPdfInline = async (url: string, noteId: string) => {
    try {
      setViewingPdf(noteId);
      const response = await fetch(url);
      const rawBlob = await response.blob();
      const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
      // Clean up the blob URL after a short delay to free memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch {
      // Fallback: open the raw URL directly if fetch fails
      window.open(url, '_blank');
    } finally {
      setViewingPdf(null);
    }
  };

  const handleShare = (noteId: string) => {
    const url = `${window.location.origin}/shared/note/${noteId}`;
    setShareUrl(url);
    setShowShareDialog(true);
  };

  // For /image/upload/ URLs only: inject fl_inline so the iframe in SharedNoteView renders inline.
  // For /raw/upload/ URLs: use viewPdfInline() instead (blob approach).
  const getInlinePdfUrl = (url: string): string => {
    if (!url) return url;
    if (url.includes('/image/upload/')) {
      return url.replace('/image/upload/', '/image/upload/fl_inline/');
    }
    return url;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied',
      description: 'Sharing link copied to your clipboard!',
    });
  };

  const { data: notes, loading, execute: fetchNotes } = useApi(apiClient.getNotes);
  const { loading: uploading, execute: uploadPDF } = useApi(apiClient.uploadPDF);
  const { execute: deleteNote } = useApi(apiClient.deleteNote);
  const { loading: generating, error: generateError, execute: generateQuestions } = useApi(apiClient.generateQuestions);
  const { loading: aiLoading, error: summarizeError, execute: summarizeNote } = useApi(apiClient.summarizeNote);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    const handleOpenReviChat = () => {
      if (showQuestionsDialog) {
        isMinimizingRef.current = true;
        setShowQuestionsDialog(false);
        setIsQuizMinimized(true);
      }
    };

    window.addEventListener('open-revi-chat', handleOpenReviChat);
    return () => {
      window.removeEventListener('open-revi-chat', handleOpenReviChat);
    };
  }, [showQuestionsDialog]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
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
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (const file of Array.from(files)) {
        await handleFileUpload(file);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    const result = await uploadPDF(file);
    if (result) {
      toast({
        title: 'Upload successful',
        description: `${file.name} has been uploaded and processed`,
      });
      fetchNotes();
    } else {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (noteId: string) => {
    const result = await deleteNote(noteId);
    if (result !== null) {
      toast({
        title: 'Note deleted',
        description: 'The note has been removed',
      });
      fetchNotes();
    }
  };

  const handleAskAI = async (noteId: string) => {
    setSelectedNoteId(noteId);
    setShowSettingsDialog(true);
  };

  const handleSummarize = async (noteId: string) => {
    const result = await summarizeNote(noteId);
    if (result) {
      setAIResultTitle('Summary');
      setAIResultContent(result);
      setShowAIResultDialog(true);
    } else {
      toast({
        title: 'Failed to summarize',
        description: summarizeError ?? 'Could not generate summary. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateQuestions = async () => {
    setShowSettingsDialog(false);
    setShowLoadingDialog(true);
    setGenerationProgress(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Exponential decay toward 95%
      const progress = Math.min(95, Math.round(95 * (1 - Math.pow(Math.E, -elapsed / 4500))));
      setGenerationProgress(progress);
    }, 150);

    const result = await generateQuestions(selectedNoteId, questionCount, difficulty);
    clearInterval(interval);

    if (result) {
      setGenerationProgress(100);
      setTimeout(() => {
        setPracticeQuestions(result);
        setShowQuestionsDialog(true);
        setShowLoadingDialog(false);
      }, 600);
    } else {
      setShowLoadingDialog(false);
      toast({
        title: 'Failed to generate questions',
        description: generateError ?? 'Could not generate questions from this note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Reset bulk-submit state whenever a fresh quiz is generated
  useEffect(() => {
    if (practiceQuestions.length > 0) {
      setLocalAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    }
  }, [practiceQuestions]);

  const handleSubmitAll = async () => {
    if (Object.keys(localAnswers).length < practiceQuestions.length || submittingAll) return;
    setSubmittingAll(true);
    let correct = 0;
    const startTime = Date.now();
    try {
      for (const question of practiceQuestions) {
        const answer = localAnswers[question.id];
        if (answer) {
          try {
            const result = await apiClient.submitAnswer({
              question_id: question.id,
              student_answer: answer,
              time_spent_seconds: Math.round((Date.now() - startTime) / 1000),
            });
            if (result.is_correct) correct++;
          } catch {
            // continue submitting others even if one fails
          }
        }
      }
      setQuizScore({ correct, total: practiceQuestions.length });
      setQuizSubmitted(true);
      await refreshProgress();
    } finally {
      setSubmittingAll(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Study Notes</h1>
          </div>
          <p className="text-muted-foreground">
            Upload your study materials and let AI help you understand them better
          </p>
        </div>

        {/* <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning">Learning-Focused AI</p>
            <p className="text-sm text-muted-foreground mt-1">
              Our AI is designed to help you <strong>understand</strong> your study materials, not to provide exam answers.
              It will summarize content, explain difficult concepts, and generate practice questions to test your understanding.
            </p>
          </div>
        </div> */}

        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />

        {/* Mobile: upload button only */}
        <div className="lg:hidden rounded-xl border bg-card p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {uploading ? 'Uploading...' : 'Upload your PDF study notes'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tap below to choose a file from your device
              </p>
            </div>
            <Button asChild disabled={uploading}>
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </label>
            </Button>
          </div>
        </div>

        {/* Desktop: drag and drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'hidden lg:block border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className={cn(
                'p-4 rounded-full transition-colors',
                isDragging ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              <Upload
                className={cn(
                  'h-8 w-8 transition-colors',
                  isDragging ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </div>
            <div>
              <p className="font-medium">
                {uploading
                  ? 'Uploading...'
                  : isDragging
                    ? 'Drop your files here'
                    : 'Drag and drop your PDF files here'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse from your computer
              </p>
            </div>
            <Button asChild variant="outline" disabled={uploading}>
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Summarize Content</h3>
            <p className="text-sm text-muted-foreground">
              Get concise summaries of your study materials to quickly review key concepts.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
            <div className="p-3 rounded-lg bg-accent/20 w-fit mb-4">
              <Lightbulb className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Explain Concepts</h3>
            <p className="text-sm text-muted-foreground">
              Ask AI to break down complex topics into simple, understandable explanations.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
            <div className="p-3 rounded-lg bg-success/10 w-fit mb-4">
              <FileQuestion className="h-6 w-6 text-success" />
            </div>
            <h3 className="font-semibold mb-2">Generate Practice Questions</h3>
            <p className="text-sm text-muted-foreground">
              Create practice questions from your notes to test your understanding.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Uploaded Notes</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        ) : notes && notes.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Uploaded Notes</h2>
            <div className="space-y-3">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{note.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {note.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewPdfInline(note.file_url!, note.id)}
                        disabled={viewingPdf === note.id}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        {viewingPdf === note.id ? 'Loading...' : 'View Notes'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(note.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Tools
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => handleAskAI(note.id)}>
                          <FileQuestion className="h-4 w-4 mr-2" />
                          Generate Quiz
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSummarize(note.id)} disabled={aiLoading}>
                          <FileText className="h-4 w-4 mr-2" />
                          Summarize Notes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Practice Questions</DialogTitle>
            <DialogDescription>
              Choose the difficulty level and number of questions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={difficulty === 'easy' ? 'default' : 'outline'}
                  onClick={() => setDifficulty('easy')}
                  className="w-full"
                >
                  Easy
                </Button>
                <Button
                  variant={difficulty === 'medium' ? 'default' : 'outline'}
                  onClick={() => setDifficulty('medium')}
                  className="w-full"
                >
                  Medium
                </Button>
                <Button
                  variant={difficulty === 'hard' ? 'default' : 'outline'}
                  onClick={() => setDifficulty('hard')}
                  className="w-full"
                >
                  Hard
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Number of Questions</label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={questionCount === 10 ? 'default' : 'outline'}
                  onClick={() => setQuestionCount(10)}
                  className="w-full"
                >
                  10
                </Button>
                <Button
                  variant={questionCount === 20 ? 'default' : 'outline'}
                  onClick={() => setQuestionCount(20)}
                  className="w-full"
                >
                  20
                </Button>
                <Button
                  variant={questionCount === 25 ? 'default' : 'outline'}
                  onClick={() => setQuestionCount(25)}
                  className="w-full"
                >
                  25
                </Button>
              </div>
            </div>

            <Button
              onClick={handleGenerateQuestions}
              className="w-full"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Questions
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generating Dialog Overlay with Dynamic Progress Bar */}
      <Dialog open={showLoadingDialog} onOpenChange={() => { }}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl flex flex-col gap-5" onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl text-primary animate-pulse">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Generating Your Quiz</h3>
              <p className="text-xs text-muted-foreground">AI is reading your materials and building {questionCount} questions...</p>
            </div>
          </div>
          
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-primary font-medium animate-pulse">
                {generationProgress < 20 ? "Scanning study notes..." :
                 generationProgress < 45 ? "Extracting key concepts..." :
                 generationProgress < 70 ? "Generating practice questions..." :
                 generationProgress < 90 ? "Formulating answer options..." :
                 generationProgress < 100 ? "Polishing explanations..." :
                 "Popping quiz out!"}
              </span>
              <span className="text-muted-foreground font-mono">{generationProgress}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground/80 leading-relaxed italic bg-muted/40 p-3 rounded-lg border border-border/40 text-center">
            &quot;Every incorrect answer is a custom learning path generated just for you. Take your time, think through them!&quot;
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showQuestionsDialog}
        onOpenChange={(open) => {
          setShowQuestionsDialog(open);
          if (!open) {
            refreshProgress();
            if (isMinimizingRef.current) {
              isMinimizingRef.current = false;
            } else {
              setIsQuizMinimized(false);
            }
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden [&>button]:hidden">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <DialogTitle>Practice Quiz</DialogTitle>
            <div className="flex items-center justify-between gap-3">
              <DialogDescription className="text-left flex-1 min-w-0 m-0">
                {practiceQuestions.length} {difficulty} questions — select your answers then hit "Submit All" to see your score.
              </DialogDescription>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setShowQuestionsDialog(false);
                  setIsQuizMinimized(false);
                  refreshProgress();
                }}
              >
                Close
              </Button>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {practiceQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  bulkMode={!quizSubmitted}
                  externalAnswer={localAnswers[question.id] ?? null}
                  onAnswerSelect={(qId, answer) =>
                    setLocalAnswers((prev) => ({ ...prev, [qId]: answer }))
                  }
                  revealed={quizSubmitted}
                />
              ))}
            </div>

            {/* Submit All button */}
            {!quizSubmitted && (
              <div className="mt-8 border-t pt-6 space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{Object.keys(localAnswers).length} / {practiceQuestions.length} answered</span>
                  {Object.keys(localAnswers).length < practiceQuestions.length && (
                    <span className="text-xs italic">Answer all questions to submit</span>
                  )}
                </div>
                <Button
                  onClick={handleSubmitAll}
                  disabled={Object.keys(localAnswers).length < practiceQuestions.length || submittingAll}
                  className="w-full bg-gradient-primary hover:opacity-90 font-bold py-5 text-base rounded-xl flex items-center justify-center gap-2"
                >
                  {submittingAll ? (
                    <>
                      <Sparkles className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Submit All Answers
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Score banner */}
            {quizSubmitted && quizScore && (
              <div className={cn(
                "mt-8 p-6 rounded-2xl border text-center space-y-4",
                quizScore.correct / quizScore.total >= 0.8
                  ? "bg-success/10 border-success/20"
                  : quizScore.correct / quizScore.total >= 0.5
                  ? "bg-warning/10 border-warning/20"
                  : "bg-destructive/10 border-destructive/20"
              )}>
                <div className="space-y-1">
                  <p className="text-4xl font-bold">
                    {quizScore.correct} / {quizScore.total}
                  </p>
                  <p className={cn(
                    "text-xl font-semibold",
                    quizScore.correct / quizScore.total >= 0.8 ? "text-success"
                    : quizScore.correct / quizScore.total >= 0.5 ? "text-warning"
                    : "text-destructive"
                  )}>
                    {Math.round((quizScore.correct / quizScore.total) * 100)}% Correct
                  </p>
                  <p className="text-sm text-muted-foreground pt-1">
                    {quizScore.correct / quizScore.total >= 0.8
                      ? "🎉 Outstanding! You've mastered this material."
                      : quizScore.correct / quizScore.total >= 0.5
                      ? "👍 Good effort! Review the explanations below to improve."
                      : "💪 Keep going! Study the explanations and try again."}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowQuestionsDialog(false);
                      setIsQuizMinimized(false);
                      navigate('/practice?tab=history');
                    }}
                  >
                    <FileQuestion className="h-4 w-4 mr-2" />
                    View Quiz History
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowQuestionsDialog(false);
                      setIsQuizMinimized(false);
                      refreshProgress();
                    }}
                  >
                    Close Quiz
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Minimized Quiz Widget */}
      {isQuizMinimized && practiceQuestions.length > 0 && (
        <div 
          onClick={() => {
            setShowQuestionsDialog(true);
            setIsQuizMinimized(false);
          }}
          className={cn(
            "fixed bottom-24 lg:bottom-6 left-6 z-40 cursor-pointer animate-fade-in",
            "flex items-center gap-3 p-4 rounded-xl border border-border shadow-lg",
            "bg-card/90 backdrop-blur-md hover:bg-card hover:scale-105 transition-all duration-300",
            "select-none max-w-sm sm:max-w-md"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 relative">
            <FileQuestion className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Practice Quiz Minimized</p>
            <p className="text-sm font-semibold text-foreground truncate">
              {practiceQuestions.length} {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Questions
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out animate-pulse-subtle"
                  style={{ width: `${(practiceQuestions.filter(q => hasAttempted(q.id)).length / practiceQuestions.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                {practiceQuestions.filter(q => hasAttempted(q.id)).length}/{practiceQuestions.length}
              </span>
            </div>
          </div>
          <Button 
            size="sm" 
            className="shrink-0 bg-gradient-primary text-primary-foreground hover:opacity-95 text-xs font-semibold px-3 py-1.5 h-8 rounded-lg shadow-sm"
          >
            Resume
          </Button>
        </div>
      )}

      {/* AI Result Dialog (Summary/Study Guide) */}
      <Dialog open={showAIResultDialog} onOpenChange={setShowAIResultDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4 pr-12">
            <DialogTitle>{aiResultTitle}</DialogTitle>
            <DialogDescription>
              AI-generated content from your study notes
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-4">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {aiResultContent}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Note Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        {/* Tweaked the className below to add rounded-2xl and changed w-full to w-[90%] */}
        <DialogContent className="max-w-md w-[90%] rounded-2xl animate-scale-in overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary animate-pulse" />
              Share Study Note
            </DialogTitle>
            <DialogDescription>
              Share this link with your classmates. Anyone with this link can view your note summaries, open the PDF, and practice custom AI quizzes!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-[1fr_auto] items-center gap-2 p-3 rounded-lg bg-muted border">
              <span className="text-xs text-muted-foreground truncate overflow-hidden select-all px-2 font-mono">
                {shareUrl}
              </span>
              <Button size="sm" onClick={copyShareLink} className="whitespace-nowrap bg-primary text-primary-foreground hover:opacity-90">
                <Link2 className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
};

export default StudyNotes;
