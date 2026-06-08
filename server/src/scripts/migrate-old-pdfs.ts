/**
 * Script to migrate old PDF files from Supabase Storage to Cloudinary
 * Run this ONCE to migrate your existing files
 */

import { supabaseAdmin } from '../config/database';
import { uploadPdf } from '../services/cloudinary.service';
import { logger } from '../utils/logger';

interface Note {
  id: string;
  user_id: string;
  title: string;
  file_url: string | null;
}

async function migrateOldPdfs() {
  console.log('🔄 Starting PDF migration from Supabase to Cloudinary...\n');

  try {
    // 1. Get all notes with Supabase Storage URLs
    const { data: notes, error } = await supabaseAdmin
      .from('study_notes')
      .select('id, user_id, title, file_url')
      .not('file_url', 'is', null)
      .like('file_url', '%supabase.co/storage%');

    if (error) {
      throw error;
    }

    if (!notes || notes.length === 0) {
      console.log('✅ No files to migrate. All notes already use Cloudinary or have no files.');
      return;
    }

    console.log(`📋 Found ${notes.length} files to migrate\n`);

    let successCount = 0;
    let failCount = 0;
    const failures: { id: string; title: string; error: string }[] = [];

    // 2. Process each note
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      console.log(`\n[${i + 1}/${notes.length}] Processing: ${note.title}`);
      console.log(`   Old URL: ${note.file_url}`);

      try {
        // Try to download the file from Supabase
        const response = await fetch(note.file_url!);
        
        if (!response.ok) {
          throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`   ✓ Downloaded (${(buffer.length / 1024).toFixed(2)} KB)`);

        // Upload to Cloudinary
        const fileName = note.file_url!.split('/').pop() || `${note.id}.pdf`;
        const cloudinaryResult = await uploadPdf(
          buffer,
          fileName,
          `revisio/notes/${note.user_id}`
        );

        console.log(`   ✓ Uploaded to Cloudinary`);
        console.log(`   New URL: ${cloudinaryResult.url}`);

        // Update database with new URL
        const { error: updateError } = await supabaseAdmin
          .from('study_notes')
          .update({ file_url: cloudinaryResult.url })
          .eq('id', note.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`   ✓ Database updated`);
        successCount++;

      } catch (error) {
        console.error(`   ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failCount++;
        failures.push({
          id: note.id,
          title: note.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${successCount} files`);
    console.log(`❌ Failed: ${failCount} files`);
    console.log('='.repeat(60));

    if (failures.length > 0) {
      console.log('\n⚠️  Failed Migrations:');
      failures.forEach(f => {
        console.log(`\n- ${f.title} (${f.id})`);
        console.log(`  Error: ${f.error}`);
      });
    }

    console.log('\n✨ Migration complete!');

  } catch (error) {
    logger.error('Migration failed:', error);
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateOldPdfs()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
