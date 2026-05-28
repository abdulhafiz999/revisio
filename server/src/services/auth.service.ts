import { supabaseAnon, supabaseAdmin } from '../config/database';
import { AuthResponse, RegisterRequest, LoginRequest, ResetPasswordRequest } from '../models/types';
import { emailService } from './email.service';

/**
 * Authentication Service
 * Handles user authentication operations using Supabase Auth
 */
export class AuthService {
  /**
   * Register a new user with email and password
   * Sends verification email automatically
   * 
   * @throws Error if email already exists or registration fails
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Attempt to create new user
    const { data: authData, error } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.FRONTEND_URL || 'http://localhost:5173',
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        throw new Error('An account with this email already exists.');
      }
      if (error.message.includes('security purposes') || error.message.includes('after') || error.message.includes('seconds')) {
        throw new Error('Please wait a moment before trying again.');
      }
      throw new Error('Registration failed. Please try again.');
    }

    if (!authData.user) {
      throw new Error('Registration failed. Please try again.');
    }

    // Sync user to custom users table for additional profile data
    try {
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
        });
      
      if (insertError) {
        console.error('Failed to sync user to users table:', insertError);
        // Don't throw - auth user is created, this is just supplementary
      }
    } catch (syncError) {
      console.error('Error syncing user:', syncError);
    }

    // Send a welcome email to the new user (fire-and-forget – never blocks registration)
    emailService.sendWelcomeEmail(email).catch((mailErr) => {
      console.error('Failed to send welcome email:', mailErr);
    });

    // If no session, email confirmation is required
    // Return user info without session - frontend should show "check your email" message
    if (!authData.session) {
      return {
        user: {
          id: authData.user.id,
          email: authData.user.email || '',
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at || authData.user.created_at,
        },
        session: null,
        emailConfirmationRequired: true,
      };
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        created_at: authData.user.created_at,
        updated_at: authData.user.updated_at || authData.user.created_at,
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at || 0,
      },
      emailConfirmationRequired: false,
    };
  }

  /**
   * Authenticate user with email and password
   * Creates a new session valid for 7 days
   * 
   * @throws Error if credentials are invalid
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Attempt to sign in
    const { data: authData, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Return generic error for security (don't reveal if email exists)
      throw new Error('Invalid email or password');
    }

    if (!authData.user || !authData.session) {
      throw new Error('Login failed - no user or session returned');
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        created_at: authData.user.created_at,
        updated_at: authData.user.updated_at || authData.user.created_at,
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at || 0,
      },
    };
  }

  /**
   * Logout user by invalidating their session
   * 
   * @param accessToken - The user's current access token
   * @throws Error if logout fails
   */
  async logout(accessToken: string): Promise<void> {
    // Verify the token is valid first
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(accessToken);

    if (userError || !userData.user) {
      throw new Error('Invalid session');
    }

    // Set the session for the current user
    const { error: setSessionError } = await supabaseAnon.auth.setSession({
      access_token: accessToken,
      refresh_token: '', // Not needed for logout
    });

    if (setSessionError) {
      throw new Error('Failed to set session for logout');
    }

    // Sign out the user
    const { error } = await supabaseAnon.auth.signOut();

    if (error) {
      throw new Error('Logout failed');
    }
  }

  /**
   * Send password reset email to user
   * 
   * @throws Error if email not found or reset fails
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const { email } = data;

    // Send password reset email
    const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`,
    });

    if (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }

    return {
      message: 'Password reset email sent. Please check your inbox.',
    };
  }
}

export const authService = new AuthService();
