/**
 * Example: How to use the PdfUpload component
 * 
 * This file shows different ways to integrate the PdfUpload component
 * into your application.
 */

import { PdfUpload } from '@/components/PdfUpload';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

// ============================================================================
// Example 1: Simple PDF Upload (without course context)
// ============================================================================

export function SimpleUploadExample() {
  return (
    <div className="container mx-auto p-4">
      <PdfUpload 
        onUploadComplete={(data) => {
          toast.success('PDF uploaded successfully!');
          console.log('File URL:', data.file.url);
          console.log('Public ID:', data.file.publicId);
          console.log('Text extracted:', data.textPreview);
        }}
      />
    </div>
  );
}

// ============================================================================
// Example 2: Upload with Course Context
// ============================================================================

export function CourseUploadExample() {
  const courseId = 'course-123'; // From your route params or state
  const topicId = 'topic-456';   // Optional

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Upload Study Material</h2>
      
      <PdfUpload 
        courseId={courseId}
        topicId={topicId}
        onUploadComplete={(data) => {
          toast.success('Study material uploaded!');
          
          // The data includes course metadata
          console.log('Uploaded for course:', data.metadata.course_id);
          console.log('Uploaded for topic:', data.metadata.topic_id);
          console.log('Full text content:', data.content);
          
          // You might want to:
          // 1. Save the URL to your database
          // 2. Navigate to another page
          // 3. Refresh a list of resources
          // 4. Generate questions from the content
        }}
      />
    </div>
  );
}

// ============================================================================
// Example 3: Upload in a Modal/Dialog
// ============================================================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function ModalUploadExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Upload PDF
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Study Material</DialogTitle>
          </DialogHeader>
          
          <PdfUpload 
            courseId="course-123"
            onUploadComplete={(data) => {
              toast.success('Upload complete!');
              setOpen(false); // Close modal on success
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// Example 4: Upload with Additional Actions
// ============================================================================

export function AdvancedUploadExample() {
  const handleUploadComplete = async (data: any) => {
    try {
      // 1. Save the PDF reference to your database
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          course_id: data.metadata.course_id,
          topic_id: data.metadata.topic_id,
          title: data.metadata.title,
          url: data.file.url,
          type: 'pdf',
        }),
      });

      if (!response.ok) throw new Error('Failed to save resource');

      // 2. Generate questions from the PDF content
      const aiResponse = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: data.content,
          course_id: data.metadata.course_id,
          count: 10,
        }),
      });

      if (!aiResponse.ok) throw new Error('Failed to generate questions');

      toast.success('PDF uploaded and questions generated!');
      
      // 3. Redirect or refresh
      window.location.reload();
      
    } catch (error) {
      console.error('Error processing upload:', error);
      toast.error('Upload succeeded but post-processing failed');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <PdfUpload 
          courseId="course-123"
          topicId="topic-456"
          onUploadComplete={handleUploadComplete}
        />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Example 5: Direct API Call (without component)
// ============================================================================

export async function directUploadExample(file: File, courseId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('course_id', courseId);
  formData.append('title', 'My Custom Title');

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/pdf/process`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    
    return {
      url: result.data.file.url,
      publicId: result.data.file.publicId,
      content: result.data.content,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// ============================================================================
// Example 6: Delete a PDF
// ============================================================================

export async function deletePdfExample(publicId: string) {
  try {
    // URL encode the publicId (it contains slashes)
    const encodedPublicId = encodeURIComponent(publicId);
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/upload/pdf/${encodedPublicId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }

    toast.success('PDF deleted successfully');
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    toast.error('Failed to delete PDF');
    return false;
  }
}

// ============================================================================
// Usage in a Page Component
// ============================================================================

export function ResourcesPage() {
  const courseId = 'course-123'; // From useParams() or props

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Course Resources</h1>
      </div>

      {/* Upload Section */}
      <PdfUpload 
        courseId={courseId}
        onUploadComplete={(data) => {
          toast.success('Resource added!');
          // Refresh your resources list here
        }}
      />

      {/* Your existing resources list */}
      <div className="grid gap-4">
        {/* ... your resource cards ... */}
      </div>
    </div>
  );
}
