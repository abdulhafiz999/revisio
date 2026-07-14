import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, BookOpen, Sparkles, Award, Zap } from 'lucide-react';
import { apiClient } from '@/services/api.client';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const { loading, error, execute } = useApi(apiClient.register);
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === 'dark' ? '/iconwhite.png' : '/iconblack.png';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match!',
        variant: 'destructive',
      });
      return;
    }
    
    const result = await execute(formData.email, formData.password);
    
    if (result) {
      if (result.emailConfirmationRequired || !result.session) {
        // Email confirmation required - show message, don't log in yet
        toast({
          title: 'Check your email!',
          description: 'We sent a confirmation link to ' + formData.email + '. Please confirm your email to continue.',
        });
        navigate('/login');
      } else {
        // Auto-login after registration (email confirmation disabled)
        login(result.user, result.session.access_token, result.session.refresh_token);
        toast({
          title: 'Registration successful',
          description: 'Welcome to Revisio!',
        });
        navigate('/dashboard');
      }
    } else if (error) {
      toast({
        title: 'Registration failed',
        description: error,
        variant: 'destructive',
      });
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: 'Google Sign Up failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex relative">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Left Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <img src={logoSrc} alt="REVISIO" className="h-10 w-10" />
              </div>
              <span className="text-2xl font-bold text-primary">Revisio</span>
            </div>
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="text-muted-foreground">
              Join thousands of students improving their exam performance with{' '}
              <span className="font-semibold text-foreground">Revisio</span>.
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-12 rounded-full px-4"
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-12 rounded-full px-4"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
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
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={8}
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

            {/* Terms and Conditions */}
            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full h-12 rounded-full text-base font-semibold"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or continue with
                </span>
              </div>
            </div>

            {/* Google Sign Up */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              className="w-full h-12 rounded-full text-base font-medium"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Illustration */}
       <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-background">
        <div className="max-w-lg w-full flex flex-col items-center gap-8">
          <div
            className="relative w-full"
            style={{
              perspective: '1200px',
            }}
          >
            {/* Glow behind image */}
            <div
              className="absolute inset-0 rounded-3xl blur-3xl opacity-30"
              style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary)), transparent 70%)' }}
            />
            <img
              src="/3dimage.png"
              alt="Revisio Dashboard"
              className="relative w-full rounded-3xl shadow-2xl"
              style={{
                transform: 'rotateY(-8deg) rotateX(4deg) scale(1.02)',
                transformStyle: 'preserve-3d',
                boxShadow: '0 40px 80px -20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
                transition: 'transform 0.4s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLImageElement).style.transform = 'rotateY(-4deg) rotateX(2deg) scale(1.04)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLImageElement).style.transform = 'rotateY(-8deg) rotateX(4deg) scale(1.02)';
              }}
            />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Make your exam prep easier and organized</h2>
            <p className="text-muted-foreground">with <span className="font-bold text-primary">Revisio</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
