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
  AlertCircle,
  Loader2
} from 'lucide-react';
import { apiClient, StudyNote } from '@/services/api.client';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';

const SharedNoteView: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const [note, setNote] = useState<StudyNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [openingTab, setOpeningTab] = useState(false);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  // Convert Cloudinary URL to an inline-viewable PDF URL.
  // - For /image/upload/ URLs: inject fl_inline so the browser displays the PDF inline.
  // - For /raw/upload/ URLs: return as-is (used only for iframe src; browser renders natively).
  const getInlinePdfUrl = (url: string): string => {
    if (!url) return url;
    if (url.includes('/image/upload/')) {
      return url.replace('/image/upload/', '/image/upload/fl_inline/');
    }
    return url;
  };

  // Programmatic download: fetches the file as a blob and forces a .pdf filename + MIME type.
  // This fixes the Cloudinary raw URL issue where the browser downloads the file as a
  // generic "file" type (no extension, no MIME) because the URL has no .pdf extension.
  const handleDownload = async (url: string, title: string) => {
    try {
      setDownloading(true);
      const response = await fetch(url);
      const blob = await response.blob();
      // Force application/pdf so the OS always recognises it as a PDF file
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      // Sanitise the note title and append .pdf extension
      const safeName = title.replace(/[^a-z0-9\s_-]/gi, '').trim() || 'study-note';
      anchor.download = `${safeName}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: open the URL directly if fetch fails (e.g. CORS)
      window.open(url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  // Open the PDF inline in a new browser tab.
  // Raw Cloudinary URLs are served with Content-Disposition: attachment, which forces a
  // download. By fetching + re-wrapping as a blob:// URL the browser opens it inline.
  const openPdfInNewTab = async (url: string) => {
    try {
      setOpeningTab(true);
      const response = await fetch(url);
      const rawBlob = await response.blob();
      const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch {
      window.open(url, '_blank');
    } finally {
      setOpeningTab(false);
    }
  };

  useEffect(() => {
    const fetchSharedNote = async () => {
      try {
        setLoading(true);
        if (noteId) {
          const fetchedNote = await apiClient.getSharedNote(noteId);
          setNote(fetchedNote);
          // Pre-fetch the PDF as a blob so the iframe renders inline (avoids download)
          if (fetchedNote?.file_url) {
            try {
              const res = await fetch(fetchedNote.file_url);
              const raw = await res.blob();
              const pdf = new Blob([raw], { type: 'application/pdf' });
              setIframeSrc(URL.createObjectURL(pdf));
            } catch {
              setIframeSrc(fetchedNote.file_url);
            }
          }
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
                      onClick={() => handleDownload(note.file_url!, note.title)}
                      disabled={downloading}
                      className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium border border-border"
                    >
                      {downloading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing download...</>
                      ) : (
                        <><Download className="mr-2 h-4 w-4" /> Download PDF File</>
                      )}
                    </Button>
                    <Button 
                      onClick={() => openPdfInNewTab(note.file_url!)} 
                      disabled={openingTab}
                      variant="ghost" 
                      className="w-full text-primary hover:text-primary/80 hover:bg-primary/5"
                    >
                      {openingTab ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening...</>
                      ) : (
                        <><ExternalLink className="mr-2 h-4 w-4" /> Open In New Tab</>
                      )}
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
                    src={iframeSrc ? `${iframeSrc}#toolbar=0` : undefined}
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
