# Migration Guide: Supabase Storage → Cloudinary

This guide helps you migrate your PDF storage from Supabase to Cloudinary.

## Why Migrate?

- **Storage Limits**: Supabase free tier has limited storage (1GB)
- **Better Performance**: Cloudinary CDN delivers files faster globally
- **More Features**: Better file management, transformations, and analytics

## Quick Start

### 1. Environment Setup

Add to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Get these from: [Cloudinary Console](https://console.cloudinary.com/)

### 2. Frontend Changes

#### Old Supabase Upload Code:
```typescript
// OLD: Uploading to Supabase Storage
const { data, error } = await supabase.storage
  .from('pdfs')
  .upload(`${userId}/${fileName}`, file);
```

#### New Cloudinary Upload Code:
```typescript
// NEW: Upload to Cloudinary via API
const formData = new FormData();
formData.append('file', file);
formData.append('course_id', courseId);

const response = await fetch('/api/upload/pdf/process', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
// result.data.file.url contains the Cloudinary URL
```

#### Use the PdfUpload Component:
```tsx
import { PdfUpload } from '@/components/PdfUpload';

// In your component:
<PdfUpload 
  courseId="course-123"
  topicId="topic-456"
  onUploadComplete={(data) => {
    console.log('Upload complete:', data);
    // Handle the uploaded file data
  }}
/>
```

### 3. Database Schema Updates

If you're storing PDF URLs in your database, you'll need to update the URL format:

**Old Supabase URL format:**
```
https://your-project.supabase.co/storage/v1/object/public/pdfs/user123/file.pdf
```

**New Cloudinary URL format:**
```
https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/revisio/pdfs/user123/file.pdf
```

Update your `shared_resources` table to handle both formats during migration:

```sql
-- Add a migration column (optional, for tracking)
ALTER TABLE shared_resources 
ADD COLUMN migrated_to_cloudinary BOOLEAN DEFAULT FALSE;

-- Later, after migration is complete, you can remove the column
```

### 4. Migrating Existing Files

#### Option A: Manual Migration (Small Dataset)

1. Download PDFs from Supabase
2. Re-upload through the new API endpoint
3. Update database URLs

#### Option B: Automated Migration Script

Create a migration script in `server/src/scripts/migrate-pdfs.ts`:

```typescript
import { supabase } from '../config/database';
import { uploadPdf } from '../services/cloudinary.service';
import { logger } from '../utils/logger';

async function migratePdfs() {
  // 1. Get all PDF URLs from database
  const { data: resources } = await supabase
    .from('shared_resources')
    .select('*')
    .like('url', '%supabase.co/storage%');

  if (!resources) return;

  for (const resource of resources) {
    try {
      // 2. Download from Supabase
      const response = await fetch(resource.url);
      const buffer = Buffer.from(await response.arrayBuffer());

      // 3. Upload to Cloudinary
      const result = await uploadPdf(
        buffer,
        `migrated_${resource.id}.pdf`,
        `revisio/pdfs/migrated/${resource.user_id}`
      );

      // 4. Update database with new URL
      await supabase
        .from('shared_resources')
        .update({ 
          url: result.url,
          migrated_to_cloudinary: true 
        })
        .eq('id', resource.id);

      logger.info(`Migrated: ${resource.id}`);
    } catch (error) {
      logger.error(`Failed to migrate ${resource.id}:`, error);
    }
  }
}

// Run: npx tsx src/scripts/migrate-pdfs.ts
migratePdfs();
```

### 5. Update API Calls

Replace all Supabase storage calls with the new Cloudinary endpoints:

| Operation | Old (Supabase) | New (Cloudinary) |
|-----------|---------------|------------------|
| Upload | `supabase.storage.from('pdfs').upload()` | `POST /api/upload/pdf` |
| Delete | `supabase.storage.from('pdfs').remove()` | `DELETE /api/upload/pdf/:publicId` |
| Get URL | `supabase.storage.from('pdfs').getPublicUrl()` | URL returned from upload |

### 6. Cleanup Supabase Storage (Optional)

After successful migration:

1. Verify all files are accessible via Cloudinary
2. Backup Supabase storage (download all files)
3. Delete files from Supabase Storage bucket
4. Remove Supabase storage dependencies (if not used elsewhere)

## Testing Checklist

- [ ] Environment variables configured
- [ ] Server starts without errors
- [ ] Upload single PDF via API
- [ ] Upload PDF with course/topic metadata
- [ ] Delete uploaded PDF
- [ ] Verify PDF accessible via Cloudinary URL
- [ ] Check text extraction still works
- [ ] Test frontend upload component
- [ ] Verify mobile upload (if applicable)
- [ ] Test error handling (large files, non-PDF files)

## Rollback Plan

If something goes wrong:

1. Keep your old Supabase storage code in a branch
2. Don't delete files from Supabase until fully tested
3. Can revert environment variables and redeploy
4. Database URLs can be rolled back if needed

## Cost Comparison

### Supabase Free Tier:
- Storage: 1 GB
- Transfer: 2 GB/month

### Cloudinary Free Tier:
- Storage: 25 GB (25x more!)
- Bandwidth: 25 GB/month (12.5x more!)
- Transformations: 25 credits/month

## Support

- Cloudinary Docs: https://cloudinary.com/documentation
- Server setup: See `CLOUDINARY_SETUP.md`
- Issues: Check server logs for detailed errors

## Common Issues

### "Cloudinary configuration is incomplete"
**Fix**: Add all three env variables (CLOUD_NAME, API_KEY, API_SECRET)

### "Upload failed: 401 Unauthorized"
**Fix**: Check your API credentials in Cloudinary dashboard

### "Maximum file size exceeded"
**Fix**: Current limit is 10MB. Either compress PDF or increase limit in multer config

### Migration script fails
**Fix**: Run migrations in batches, add retry logic, check network connectivity
