import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import { UserProfile } from '../models/types';

export interface UpdateUserProfileInput {
  display_name?: string | null;
  program?: string | null;
}

async function ensureUserRow(userId: string, email: string): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabaseAdmin.from('users').insert({
    id: userId,
    email,
  });

  if (error) {
    logger.error('Failed to create user row:', error);
    throw new Error('Failed to initialize user profile');
  }
}

export async function getUserProfile(userId: string, email: string): Promise<UserProfile> {
  await ensureUserRow(userId, email);

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, program, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error('Error fetching user profile:', error);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return {
    id: data.id,
    email: data.email,
    display_name: data.display_name,
    program: data.program,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function updateUserProfile(
  userId: string,
  email: string,
  input: UpdateUserProfileInput
): Promise<UserProfile> {
  await ensureUserRow(userId, email);

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      display_name: input.display_name ?? null,
      program: input.program ?? null,
    })
    .eq('id', userId);

  if (error) {
    logger.error('Error updating user profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return getUserProfile(userId, email);
}
