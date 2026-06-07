import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { supabaseAnon } from '../config/database';

const mockUpdateUser = vi.fn();

// Mock the database module
vi.mock('../config/database', () => ({
  supabaseAnon: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      setSession: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn(),
    },
  },
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
  getSupabaseClientForUser: vi.fn(() => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  })),
}));


describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_at: 1234567890,
      };

      vi.mocked(supabaseAnon.auth.signUp).mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      } as any);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          created_at: mockUser.created_at,
          updated_at: mockUser.updated_at,
        },
        session: {
          access_token: mockSession.access_token,
          refresh_token: mockSession.refresh_token,
          expires_at: mockSession.expires_at,
        },
        emailConfirmationRequired: false,
      });
    });

    it('should throw error when email already exists', async () => {
      vi.mocked(supabaseAnon.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', name: 'AuthError', status: 400 },
      } as any);

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('An account with this email already exists.');
    });

    it('should throw error when registration fails', async () => {
      vi.mocked(supabaseAnon.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Registration error', name: 'AuthError', status: 500 },
      } as any);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Registration failed. Please try again.');
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_at: 1234567890,
      };

      vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      } as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          created_at: mockUser.created_at,
          updated_at: mockUser.updated_at,
        },
        session: {
          access_token: mockSession.access_token,
          refresh_token: mockSession.refresh_token,
          expires_at: mockSession.expires_at,
        },
      });
    });

    it('should throw error when credentials are invalid', async () => {
      vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', name: 'AuthError', status: 400 },
      } as any);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      vi.mocked(supabaseAnon.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      } as any);

      vi.mocked(supabaseAnon.auth.signOut).mockResolvedValue({
        error: null,
      } as any);

      await expect(authService.logout('valid-token')).resolves.not.toThrow();
    });

    it('should throw error when session is invalid', async () => {
      vi.mocked(supabaseAnon.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token', name: 'AuthError', status: 401 },
      } as any);

      await expect(authService.logout('invalid-token')).rejects.toThrow('Invalid session');
    });
  });

  describe('resetPassword', () => {
    it('should successfully send password reset email', async () => {
      vi.mocked(supabaseAnon.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      const result = await authService.resetPassword({
        email: 'test@example.com',
      });

      expect(result).toEqual({
        message: 'Password reset email sent. Please check your inbox.',
      });
    });

    it('should throw error when reset fails', async () => {
      vi.mocked(supabaseAnon.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: { message: 'Reset error', name: 'AuthError', status: 500 },
      } as any);

      await expect(
        authService.resetPassword({
          email: 'test@example.com',
        })
      ).rejects.toThrow('Password reset failed: Reset error');
    });
  });

  describe('updatePassword', () => {
    it('should successfully update user password', async () => {
      mockUpdateUser.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.updatePassword('token-123', 'newpassword123');

      expect(result).toEqual({
        message: 'Password has been successfully updated.',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' });
    });

    it('should throw error when update fails', async () => {
      mockUpdateUser.mockResolvedValue({
        data: {},
        error: { message: 'Update error', name: 'AuthError', status: 500 },
      });

      await expect(
        authService.updatePassword('token-123', 'newpassword123')
      ).rejects.toThrow('Password update failed: Update error');
    });
  });
});

