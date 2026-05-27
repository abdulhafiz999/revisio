import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/AuthContext';
import {
  GraduationCap,
  FileText,
  Sparkles,
  BarChart3,
  BookOpen,
  Target,
  ArrowRight,
  CheckCircle2,
  Upload,
  Brain,
} from 'lucide-react';
import { useTheme } from 'next-themes';

const steps = [
  {
    step: '1',
    title: 'Create your account',
    description: 'Sign up free and sign in to your personal study workspace.',
    icon: GraduationCap,
  },
  {
    step: '2',
    title: 'Add your materials',
    description: 'Upload PDF study notes or practice questions to build your library.',
    icon: Upload,
  },
  {
    step: '3',
    title: 'Learn with AI',
    description: 'Summarize notes, generate quizzes from your content, and review explanations.',
    icon: Sparkles,
  },
  {
    step: '4',
    title: 'Track progress',
    description: 'See accuracy, streaks, and a 7-day activity view on your dashboard.',
    icon: BarChart3,
  },
];


const features = [
  {
    icon: FileText,
    title: 'Study Notes',
    description:
      'Upload PDFs and use AI to summarize content and create practice quizzes from your own materials.',
    color: 'primary',
  },
  {
    icon: BookOpen,
    title: 'Practice mode',
    description:
      'Work through questions with a learning-first flow — attempt answers before seeing explanations.',
    color: 'success',
  },
  {
    icon: Brain,
    title: 'Brilla AI',
    description:
      'Generate quizzes and summaries tuned to your notes, not generic exam dumps.',
    color: 'accent',
  },
  {
    icon: Target,
    title: 'Progress dashboard',
    description:
      'Monitor attempts, accuracy, study streaks, and weekly activity at a glance.',
    color: 'warning',
  },
];

const iconBg: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  accent: 'bg-accent/20 text-accent-foreground',
  warning: 'bg-warning/10 text-warning',
};

const Landing: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === 'dark' ? '/iconwhite.png' : '/iconwhite.png';


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary">
              <img src={logoSrc} alt="REVISIO" className="h-10 w-10" />
            </div>
            <span className="font-bold text-lg">REVISIO</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="bg-gradient-primary hover:opacity-90">
              <Link to="/register">
                Get started
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.07] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Learning-focused exam prep
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Study smarter with{' '}
              <span className="text-gradient-primary">your notes</span> and real progress
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Revisio helps you upload study materials, practice with AI-generated quizzes,
              and track what you actually understand — built for learning, not shortcuts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button size="lg" asChild className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 text-base px-8">
                <Link to="/register">
                  Get started — it&apos;s free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base px-8">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-4">
              {['Upload PDF notes', 'AI summaries & quizzes', 'Streaks & weekly stats'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Everything in one platform</h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              From your uploaded notes to daily practice and a clear dashboard — Revisio keeps your prep organized.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-8 sm:p-9 rounded-xl border bg-card hover:shadow-md transition-shadow"
              >
                <div
                  className={`inline-flex p-3 rounded-xl mb-6 ${iconBg[feature.color]}`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-4">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">How to use Revisio</h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Four simple steps from sign-up to measurable progress.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {steps.map((item) => (
              <div
                key={item.step}
                className="flex flex-col rounded-xl border bg-card p-8 sm:p-9 min-h-[220px]"
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    Step {item.step}
                  </span>
                  <div className="inline-flex p-3 rounded-xl bg-muted shrink-0">
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-4 leading-snug">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning reminder */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-warning/10 border border-warning/20 text-center">
            <p className="text-sm sm:text-base text-muted-foreground">
              <strong className="text-foreground">Learning mode is always on.</strong>{' '}
              You must attempt each question before viewing explanations — so you build real
              understanding, not just memorized answers.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to start your session?</h2>
          <p className="text-muted-foreground">
            Create an account in under a minute, or log in if you&apos;re already studying with Revisio.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 px-8">
              <Link to="/register">
                Get started
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto px-8">
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">REVISIO</span>
          </div>
          <p>Built for students who want to learn — not cheat.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
