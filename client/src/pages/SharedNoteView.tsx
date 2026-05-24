import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  BookOpen, 
  ExternalLink,
  ArrowRight,
  Brain,
  Download,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { apiClient, StudyNote } from '@/services/api.client';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';

const SharedNoteView: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const [note, setNote] = useState<StudyNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedNote = async () => {
      try {
        setLoading(true);
        if (noteId) {
          const fetchedNote = await apiClient.getSharedNote(noteId);
          setNote(fetchedNote);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load shared study notes.');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedNote();
  }, [noteId]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-card/85 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/iconwhite.png" alt="REVISIO" className="h-9 w-9 transition-transform group-hover:scale-110 duration-300 dark:block hidden" />
            <img src="/iconblack.png" alt="REVISIO" className="h-9 w-9 transition-transform group-hover:scale-110 duration-300 dark:hidden block" />
            <span className="font-bold text-lg tracking-wider text-foreground">REVISIO</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground">Shared Resources</span>
            <ThemeToggle />
            <Button asChild className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium text-sm rounded-lg shadow-sm">
              <Link to="/register">
                Sign Up Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {loading ? (
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-10 w-2/3 rounded-lg" />
            <Skeleton className="h-6 w-1/3 rounded-lg" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        ) : error || !note ? (
          <div className="lg:col-span-3 flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="p-4 bg-destructive/10 rounded-full border border-destructive/20 text-destructive">
              <AlertCircle className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Note not found or link expired</h2>
            <p className="text-muted-foreground max-w-md">
              The sharing link might be invalid, or the owner has deleted this study material. Check with your classmate for the updated URL.
            </p>
            <Button asChild variant="outline" className="border-border hover:bg-muted text-muted-foreground">
              <Link to="/">Go to Homepage</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Note Sidebar & Actions */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card/50 border border-border rounded-2xl p-6 space-y-6 backdrop-blur shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="font-bold text-xl leading-tight text-foreground">{note.title}</h1>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5">
                      <Calendar className="h-3 w-3" />
                      Shared on {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-6 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This study note was uploaded by a classmate on **Revisio**. You can view the original document, download it, and review summaries directly.
                  </p>
                </div>

                {note.file_url && (
                  <div className="space-y-3 pt-2">
                    <Button 
                      onClick={() => window.open(note.file_url!, '_blank')} 
                      className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium border border-border"
                    >
                      <Download className="mr-2 h-4 w-4" /> Download PDF File
                    </Button>
                    <Button 
                      onClick={() => window.open(note.file_url!, '_blank')} 
                      variant="ghost" 
                      className="w-full text-primary hover:text-primary/80 hover:bg-primary/5"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" /> Open In New Tab
                    </Button>
                  </div>
                )}
              </div>

              {/* Call to Action box */}
              <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-card border border-primary/10 rounded-2xl p-6 text-center space-y-4 shadow-sm">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
                  <Brain className="h-6 w-6 animate-pulse" />
                </div>
                <h3 className="font-bold text-foreground text-lg">Study Smarter with AI</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Want to practice customizable AI-generated quizzes, outline study guides, and get step-by-step explanations? Create a free account today!
                </p>
                <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/95 font-medium shadow-sm">
                  <Link to="/register">
                    Create Free Account <ArrowRight className="ml-2 h-4.5 w-4.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Note Content / PDF Reader */}
            <div className="lg:col-span-2 space-y-6">
              {note.file_url ? (
                <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-[75vh] shadow-sm">
                  <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      PDF Document Reader
                    </span>
                    <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-mono">
                      Shared PDF
                    </span>
                  </div>
                  <iframe 
                    src={`${note.file_url}#toolbar=0`} 
                    className="w-full flex-1 border-none bg-muted"
                    title={note.title}
                  />
                </div>
              ) : (
                <div className="bg-card/30 border border-border rounded-2xl p-8 space-y-6 backdrop-blur shadow-sm">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" /> Note Summary / Text
                    </h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card py-8 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <strong className="text-foreground font-semibold">REVISIO Exam Assistant</strong>. &copy; {new Date().getFullYear()} all rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default SharedNoteView;
