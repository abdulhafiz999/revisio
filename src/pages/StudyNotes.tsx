import React, { useState, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Upload, 
  BookOpen, 
  Sparkles, 
  FileQuestion,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedNote {
  id: string;
  name: string;
  uploadedAt: Date;
  size: string;
  status: 'processing' | 'ready' | 'error';
}

const StudyNotes: React.FC = () => {
  const [uploadedNotes, setUploadedNotes] = useState<UploadedNote[]>([
    {
      id: '1',
      name: 'CS101_Algorithms_Notes.pdf',
      uploadedAt: new Date('2024-01-18'),
      size: '2.4 MB',
      status: 'ready'
    },
    {
      id: '2',
      name: 'MATH201_Integration_Slides.pdf',
      uploadedAt: new Date('2024-01-15'),
      size: '5.1 MB',
      status: 'ready'
    }
  ]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type === 'application/pdf') {
        const newNote: UploadedNote = {
          id: Date.now().toString(),
          name: file.name,
          uploadedAt: new Date(),
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          status: 'processing'
        };
        setUploadedNotes(prev => [newNote, ...prev]);
        
        // Simulate processing
        setTimeout(() => {
          setUploadedNotes(prev => 
            prev.map(note => 
              note.id === newNote.id ? { ...note, status: 'ready' as const } : note
            )
          );
        }, 2000);
      }
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const newNote: UploadedNote = {
          id: Date.now().toString(),
          name: file.name,
          uploadedAt: new Date(),
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          status: 'processing'
        };
        setUploadedNotes(prev => [newNote, ...prev]);
        
        setTimeout(() => {
          setUploadedNotes(prev => 
            prev.map(note => 
              note.id === newNote.id ? { ...note, status: 'ready' as const } : note
            )
          );
        }, 2000);
      });
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Study Notes</h1>
          </div>
          <p className="text-muted-foreground">
            Upload your study materials and let AI help you understand them better
          </p>
        </div>

        {/* Important Notice */}
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

        {/* Upload Area */}
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
                {isDragging ? "Drop your files here" : "Drag and drop your PDF files here"}
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
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
          </div>
        </div>

        {/* AI Features */}
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

        {/* Uploaded Notes */}
        {uploadedNotes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Uploaded Notes</h2>
            <div className="space-y-3">
              {uploadedNotes.map(note => (
                <div 
                  key={note.id}
                  className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{note.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {note.size} • Uploaded {note.uploadedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {note.status === 'processing' ? (
                      <span className="text-sm text-muted-foreground animate-pulse">
                        Processing...
                      </span>
                    ) : (
                      <>
                        <Button variant="outline" size="sm">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Summarize
                        </Button>
                        <Button variant="outline" size="sm">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Ask AI
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default StudyNotes;
