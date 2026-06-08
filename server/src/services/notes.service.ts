import { supabaseAdmin } from '../config/database';
import { deleteStoredFile } from './file-storage.service';
import { logger } from '../utils/logger';
import { StudyNote } from '../models/types';

/**
 * Simple Notes Service
 * Handles CRUD operations for study notes
 */

/**
 * Create a new study note
 */
export async function createNote(
  userId: string,
  title: string,
  content: string,
  fileUrl?: string
): Promise<StudyNote> {
  try {
    const { data, error } = await supabaseAdmin
      .from('study_notes')
      .insert({
        user_id: userId,
        title,
        content,
        file_url: fileUrl,
      })
      .select()
      .single();

    if (error) {
      logger.error('Supabase error creating note:', error);
      // Check for specific error types
      if (error.code === '23505') {
        throw new Error('A note with this title already exists');
      }
      throw new Error(`Failed to create note: ${error.message}`);
    }

    logger.info(`Note created for user ${userId}`);
    return data;
  } catch (error) {
    logger.error('Error creating note:', error);
    throw error;
  }
}

/**
 * Get all notes for a user
 */
export async function getNotes(userId: string): Promise<StudyNote[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('study_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting notes:', error);
    throw error;
  }
}

/**
 * Get a single note by ID
 */
export async function getNoteById(
  userId: string,
  noteId: string
): Promise<StudyNote> {
  try {
    const { data, error } = await supabaseAdmin
      .from('study_notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('Note not found');
    }

    return data;
  } catch (error) {
    logger.error('Error getting note:', error);
    throw error;
  }
}

/**
 * Update a note
 */
export async function updateNote(
  userId: string,
  noteId: string,
  title?: string,
  content?: string
): Promise<StudyNote> {
  try {
    const updates: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;

    const { data, error } = await supabaseAdmin
      .from('study_notes')
      .update(updates)
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Note not found');
    }

    logger.info(`Note updated: ${noteId}`);
    return data;
  } catch (error) {
    logger.error('Error updating note:', error);
    throw error;
  }
}

/**
 * Delete a note
 */
export async function deleteNote(
  userId: string,
  noteId: string
): Promise<void> {
  try {
    const { data: note, error: fetchError } = await supabaseAdmin
      .from('study_notes')
      .select('file_url')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !note) {
      throw new Error('Note not found');
    }

    if (note.file_url) {
      try {
        await deleteStoredFile(note.file_url);
      } catch (error) {
        logger.warn(`File storage cleanup failed for note ${noteId}:`, error);
      }
    }

    const { error } = await supabaseAdmin
      .from('study_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) throw error;

    logger.info(`Note deleted: ${noteId}`);
  } catch (error) {
    logger.error('Error deleting note:', error);
    throw error;
  }
}

/**
 * Get a single public note by ID (bypasses RLS / userId check for public sharing)
 */
export async function getPublicNoteById(noteId: string): Promise<StudyNote> {
  try {
    const { data, error } = await supabaseAdmin
      .from('study_notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (error || !data) {
      throw new Error('Note not found');
    }

    return data;
  } catch (error) {
    logger.error('Error getting public note:', error);
    throw error;
  }
}

