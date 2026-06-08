import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PdfUploadProps {
  courseId?: string;
  topicId?: string;
  onUploadComplete?: (data: any) => void;
}

interface UploadResult {
  success: boolean;
  data?: {
    file: {
      url: string;
      publicId: string;
      format: string;
      bytes: number;
    };
    textPreview?: string;
    textLength?: number;
    content?: string;
  };
  error?: string;
}

export function PdfUpload({ courseId, topicId, onUploadComplete }: PdfUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [title, setTitle] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setResult({
          success: false,
          error: 'Please select a PDF file',
        });
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setResult({
          success: false,
          error: 'File size must be less than 50MB',
        });
        return;
      }

      setSelectedFile(file);
      setResult(null);
      setTitle('');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Determine which endpoint to use
      let endpoint = '/api/upload/pdf';
      
      if (courseId) {
        endpoint = '/api/upload/pdf/process';
        formData.append('course_id', courseId);
        if (topicId) formData.append('topic_id', topicId);
        if (title) formData.append('title', title);
      }

      // Simulate progress (since we can't track actual upload progress with fetch)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult({
        success: true,
        data: data.data,
      });

      // Call onUploadComplete callback if provided
      if (onUploadComplete) {
        onUploadComplete(data.data);
      }

      // Reset after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setProgress(0);
        setTitle('');
      }, 2000);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload PDF
        </CardTitle>
        <CardDescription>
          Upload study materials, notes, or resources in PDF format (max 50MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <div className="space-y-2">
          <Label htmlFor="pdf-file">Select PDF File</Label>
          <div className="flex items-center gap-2">
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="cursor-pointer"
            />
            {selectedFile && (
              <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
            )}
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Optional Title Input (for course uploads) */}
        {courseId && (
          <div className="space-y-2">
            <Label htmlFor="pdf-title">Title (Optional)</Label>
            <Input
              id="pdf-title"
              type="text"
              placeholder="Enter a custom title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={uploadFile}
          disabled={!selectedFile || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload PDF
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">{progress}%</p>
          </div>
        )}

        {/* Result Messages */}
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.success ? (
                <div className="space-y-2">
                  <p className="font-medium">Upload successful!</p>
                  {result.data && (
                    <div className="text-sm space-y-1">
                      <p>File URL: <a href={result.data.file.url} target="_blank" rel="noopener noreferrer" className="underline">View PDF</a></p>
                      <p>Size: {(result.data.file.bytes / 1024).toFixed(2)} KB</p>
                      {result.data.textLength && (
                        <p>Extracted {result.data.textLength} characters of text</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p>{result.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
