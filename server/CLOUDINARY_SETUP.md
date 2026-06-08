# Cloudinary Setup Guide

This guide will help you set up Cloudinary for PDF storage in your REVISIO application.

## Why Cloudinary?

Cloudinary provides:
- **Larger Storage**: More storage capacity than Supabase free tier
- **Fast CDN**: Global content delivery network for fast file access
- **Easy Management**: Simple API for upload, delete, and file management
- **Free Tier**: Generous free tier (25 GB storage, 25 GB bandwidth/month)

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Click "Sign Up for Free"
3. Create your account (or sign in with Google/GitHub)

### 2. Get Your Credentials

After signing up:

1. Go to your [Cloudinary Console Dashboard](https://console.cloudinary.com/)
2. You'll see your **Account Details** section with:
   - **Cloud Name**: Your unique identifier (e.g., `dxyz123abc`)
   - **API Key**: Public key for API access
   - **API Secret**: Secret key (click "👁️" to reveal)

### 3. Configure Environment Variables

Add these to your `.env` file in the `server` directory:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

**⚠️ Important**: 
- Never commit your `.env` file to version control
- Keep your API Secret private
- Use different credentials for development and production

### 4. Test Your Setup

Start your server and test the upload endpoint:

```bash
npm run dev
```

The server will validate your Cloudinary configuration on startup.

## API Endpoints

### Upload a PDF

**POST** `/api/upload/pdf`

Headers:
- `Authorization: Bearer <your-token>`
- `Content-Type: multipart/form-data`

Body (form-data):
- `file`: PDF file (max 10MB)

Response:
```json
{
  "success": true,
  "data": {
    "file": {
      "url": "https://res.cloudinary.com/.../file.pdf",
      "publicId": "revisio/pdfs/user123/12345_filename",
      "format": "pdf",
      "bytes": 123456,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "textPreview": "First 500 characters...",
    "textLength": 5000
  }
}
```

### Upload and Process PDF

**POST** `/api/upload/pdf/process`

Headers:
- `Authorization: Bearer <your-token>`
- `Content-Type: multipart/form-data`

Body (form-data):
- `file`: PDF file
- `course_id`: Course ID (required)
- `topic_id`: Topic ID (optional)
- `title`: Custom title (optional, defaults to filename)

Response:
```json
{
  "success": true,
  "data": {
    "file": { ... },
    "content": "Full extracted text from PDF",
    "metadata": {
      "course_id": "course-123",
      "topic_id": "topic-456",
      "title": "My Study Material",
      "uploaded_by": "user-789"
    }
  }
}
```

### Delete a PDF

**DELETE** `/api/upload/pdf/:publicId`

The `publicId` should be URL encoded if it contains slashes.

Example:
```
DELETE /api/upload/pdf/revisio%2Fpdfs%2Fuser123%2F12345_filename
```

Response:
```json
{
  "success": true,
  "data": {
    "message": "File deleted successfully"
  }
}
```

## File Organization

PDFs are automatically organized in Cloudinary folders:

- **Simple uploads**: `revisio/pdfs/{userId}/`
- **Course uploads**: `revisio/pdfs/{userId}/course_{courseId}/`

## Limits and Best Practices

### Free Tier Limits
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25 credits/month
- **API Calls**: Unlimited

### Best Practices
1. **Delete old files**: Remove PDFs users no longer need
2. **Monitor usage**: Check your Cloudinary dashboard regularly
3. **Optimize PDFs**: Compress PDFs before uploading when possible
4. **Secure access**: Always use authentication for upload/delete operations
5. **Error handling**: Implement retry logic for failed uploads

## Troubleshooting

### "Cloudinary configuration is incomplete"
- Check all three environment variables are set
- Make sure there are no extra spaces or quotes

### "Failed to upload PDF"
- Check your API credentials are correct
- Verify you haven't exceeded your storage limit
- Check file size is under 10MB

### "Only PDF files are allowed"
- Ensure you're uploading a file with `.pdf` extension
- Check the file MIME type is `application/pdf`

### Rate Limiting
If you hit rate limits:
- Implement exponential backoff
- Consider upgrading to a paid plan
- Batch operations when possible

## Next Steps

1. ✅ Set up your Cloudinary account
2. ✅ Add credentials to `.env`
3. ✅ Test the upload endpoint
4. 🔄 Update your frontend to use the new upload API
5. 🔄 Migrate existing PDFs from Supabase (if needed)

## Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK Guide](https://cloudinary.com/documentation/node_integration)
- [Upload API Reference](https://cloudinary.com/documentation/upload_images)
- [Cloudinary Console](https://console.cloudinary.com/)
