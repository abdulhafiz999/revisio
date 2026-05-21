import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Lightbulb,
  GraduationCap,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api.client';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';

interface MainLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/notes', label: 'Study Notes', icon: FileText },
  { path: '/practice', label: 'Practice', icon: BookOpen },
  { path: '/recommendations', label: 'AI Recommendations', icon: Lightbulb },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const logoSrc = resolvedTheme === 'dark' ? '/iconwhite.png' : '/iconblack.png';

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      navigate('/login');
    } catch (error) {
      // Even if API call fails, clear local auth
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-card">
        {/* Logo */}
        <Link to="/dashboard" className="flex h-16 items-center gap-2 px-6 border-b hover:bg-muted/50 transition-colors">
          <img src={logoSrc} alt="REVISIO" className="h-10 w-10" />
          <span className="font-bold text-lg">REVISIO</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              className="flex-1 justify-start gap-3"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          
          {/* Reminder */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              🎯 Remember: This tool is for <strong>learning</strong>, not shortcuts. 
              Always attempt questions before viewing explanations!
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-full items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logoSrc} alt="REVISIO" className="h-9 w-9" />
            <span className="font-bold">REVISIO</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="fixed top-16 left-0 right-0 bg-card border-b shadow-lg animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              <div className="pt-4 mt-4 border-t flex items-center justify-between gap-2 px-4">
                <span className="text-sm text-muted-foreground">Appearance</span>
                <ThemeToggle />
              </div>

              {/* Mobile Logout Button */}
              <div className="pt-2 border-t mx-4">
                <div className="flex items-center gap-3 px-4 py-2 mb-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
