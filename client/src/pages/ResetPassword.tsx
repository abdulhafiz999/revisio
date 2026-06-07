import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, BookOpen, Lock, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';

const ResetPassword: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === 'dark' ? '/iconwhite.png' : '/iconblack.png';

  // Check client-side validation when inputs change
  useEffect(() => {
    if (password && password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
    } else if (password && confirmPassword && password !== confirmPassword) {
      setValidationError('Passwords do not match');
    } else {
      setValidationError(null);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsResetting(false);

    if (!updateError) {
      toast({
        title: 'Password Updated',
        description: 'Your password has been reset successfully. Please log in with your new password.',
      });
      
      // Clean up recovery session
      logout();
      
      navigate('/login');
    } else {
      toast({
        title: 'Reset Failed',
        description: updateError.message || 'Failed to update your password.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Check if session token exists in localStorage (since Supabase automatically sets it on recovery redirect)
  const hasToken = !!localStorage.getItem('revisio_auth_token');
  const canReset = isAuthenticated || hasToken;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background relative overflow-hidden">
      {/* Dynamic visual backdrop details */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <div className="absolute -top-[30%] -left-[20%] w-[70%] h-[70%] rounded-full bg-primary blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-primary blur-[120px]" />
      </div>

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo and Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <div className="p-2 rounded-xl bg-primary/10">
              <img src={logoSrc} alt="REVISIO" className="h-10 w-10" onError={(e) => {
                // Fallback to lucide icon if custom assets not found
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const icon = document.createElement('div');
                  icon.className = 'text-primary font-bold text-xl';
                  icon.innerText = 'R';
                  parent.appendChild(icon);
                }
              }} />
            </div>
            <span className="text-2xl font-bold text-primary">Revisio</span>
          </div>

          <h1 className="text-3xl font-bold text-center">Reset your password</h1>
          <p className="text-muted-foreground text-center">
            {canReset 
              ? 'Please enter your new password below to secure your account.'
              : 'The password reset session is invalid or has expired.'}
          </p>
        </div>

        {canReset ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border/50 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
            <div className="space-y-4">
              {/* New Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-full px-4 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 rounded-full px-4 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {validationError && (
              <p className="text-sm text-destructive flex items-center gap-1.5 px-1">
                <AlertTriangle className="h-4 w-4" />
                {validationError}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 rounded-full text-base font-semibold"
              size="lg"
              disabled={isResetting || !!validationError}
            >
              {isResetting ? 'Updating Password...' : 'Save New Password'}
            </Button>
          </form>
        ) : (
          <div className="space-y-6 bg-card border border-border/50 p-8 rounded-2xl shadow-xl text-center">
            <div className="flex justify-center mb-2">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Invalid Session</h3>
              <p className="text-sm text-muted-foreground">
                Your password reset link is invalid, expired, or was already used. Please request a new link.
              </p>
            </div>

            <Link to="/forgot-password" className="block">
              <Button
                type="button"
                className="w-full h-12 rounded-full text-base font-semibold"
              >
                Request New Link
              </Button>
            </Link>

            <Link to="/login" className="block">
              <Button
                type="button"
                variant="ghost"
                className="w-full h-12 rounded-full text-base font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
