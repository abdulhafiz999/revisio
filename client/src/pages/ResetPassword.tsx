import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabaseClient';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === 'dark' ? '/iconwhite.png' : '/iconblack.png';

  // When user lands on this page via the reset email link, we need to detect the session
  // and show the password reset form.
  useEffect(() => {
    // Clear any existing auth tokens to prevent auto-login
    localStorage.removeItem('revisio_auth_token');
    localStorage.removeItem('revisio_user');

    // Check if there's a session (which would be present when coming from reset link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsReady(true);
      } else {
        // No session means invalid/expired link
        setIsReady(false);
      }
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // When user comes from reset link, there will be a session
      if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        setIsReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both password fields are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Your password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw new Error(error.message);
      }

      setIsDone(true);

      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password. Please try again.';
      toast({
        title: 'Password reset failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background relative">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <img src={logoSrc} alt="Revisio" className="h-8 w-8" />
          </div>
          <span className="text-2xl font-bold text-primary">Revisio</span>
        </div>

        {isDone ? (
          /* ── Success State ── */
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-5 rounded-full bg-green-500/10">
                <CheckCircle className="h-14 w-14 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Password updated!</h1>
            <p className="text-muted-foreground">
              Your password has been changed successfully. Redirecting you to login…
            </p>
          </div>
        ) : !isReady ? (
          /* ── Invalid / Expired Link State ── */
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Invalid or expired link</h1>
            <p className="text-muted-foreground">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Button
              className="w-full h-12 rounded-full text-base font-semibold"
              onClick={() => navigate('/forgot-password')}
            >
              Request New Reset Link
            </Button>
          </div>
        ) : (
          /* ── Reset Form ── */
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Set new password</h1>
              <p className="text-muted-foreground">
                Choose a strong password for your Revisio account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 rounded-full px-4 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 rounded-full px-4 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-full text-base font-semibold"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating password…</>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
