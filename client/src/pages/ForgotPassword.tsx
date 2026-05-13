import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement password reset logic with API
    console.log('Password reset for:', email);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-primary">Revisio</span>
          </div>

          {!isSubmitted ? (
            <>
              <h1 className="text-3xl font-bold">Forgot your password?</h1>
              <p className="text-muted-foreground">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-success/10">
                  <Mail className="h-12 w-12 text-success" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center">Check your email</h1>
              <p className="text-muted-foreground text-center">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </>
          )}
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-full px-4"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 rounded-full text-base font-semibold"
              size="lg"
            >
              Send Reset Link
            </Button>

            {/* Back to Login */}
            <Link to="/login">
              <Button
                type="button"
                variant="ghost"
                className="w-full h-12 rounded-full text-base font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-muted/50 border">
              <p className="text-sm text-muted-foreground text-center">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  try again
                </button>
              </p>
            </div>

            <Link to="/login">
              <Button
                type="button"
                variant="outline"
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

export default ForgotPassword;
