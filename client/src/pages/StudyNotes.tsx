import React, { useState, useCallback, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, Question } from '@/services/api.client';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useStudy } from '@/context/StudyContext';
import QuestionCard from '@/components/practice/QuestionCard';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const StudyNotes: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const { toast } = useToast();
  const { hasAttempted, refreshProgress } = useStudy();
  
  const { data: notes, loading, execute: fetchNotes } = useApi(apiClient.getNotes);
  const { loading: uploading, execute: uploadPDF } = useApi(apiClient.uploadPDF);
  const { execute: deleteNote } = useApi(apiClient.deleteNote);
  const { loading: generating, execute: generateQuestions } = useApi(apiClient.generateQuestions);

  useEffect(() => {
    fetchNotes();
  }, []);

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

  const handleGenerateQuestions = async () => {
    setShowSettingsDialog(false);
    const result = await generateQuestions(selectedNoteId, questionCount, difficulty);
    if (result) {
      setPracticeQuestions(result);
      setShowQuestionsDialog(true);
    } else {
      toast({
        title: 'Failed to generate questions',
        description: 'Could not generate questions from this note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const allQuestionsAnswered =
    practiceQuestions.length > 0 &&
    practiceQuestions.every((q) => hasAttempted(q.id));

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

        <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning">Learning-Focused AI</p>
            <p className="text-sm text-muted-foreground mt-1">
              Our AI is designed to help you <strong>understand</strong> your study materials, not to provide exam answers. 
              It will summarize content, explain difficult concepts, and generate practice questions to test your understanding.
            </p>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              "p-4 rounded-full transition-colors",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}>
              <Upload className={cn(
                "h-8 w-8 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-medium">
                {uploading ? "Uploading..." : isDragging ? "Drop your files here" : "Drag and drop your PDF files here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse from your computer
              </p>
            </div>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
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
                  className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{note.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAskAI(note.id)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Ask AI
                    </Button>
                    <Button 
                      variant="outline" 
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

      <Dialog
        open={showQuestionsDialog}
        onOpenChange={(open) => {
          setShowQuestionsDialog(open);
          if (!open) refreshProgress();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Practice Quiz</DialogTitle>
            <DialogDescription>
              {practiceQuestions.length} {difficulty} questions — select an answer and submit before viewing explanations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {practiceQuestions.map((question, index) => (
              <QuestionCard key={question.id} question={question} index={index} />
            ))}
          </div>
          {allQuestionsAnswered && (
            <div className="mt-6 p-4 rounded-xl border bg-success/10 border-success/20 text-center space-y-3">
              <p className="font-medium text-success">Quiz complete!</p>
              <p className="text-sm text-muted-foreground">
                Your dashboard stats have been updated.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard" onClick={() => setShowQuestionsDialog(false)}>
                  View Dashboard
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default StudyNotes;
