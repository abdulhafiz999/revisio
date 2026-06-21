import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '@/services/api.client';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
}

const colorStyles = {
  primary: 'from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40',
  accent: 'from-accent/10 to-accent/5 border-accent/30 hover:border-accent/50',
  success: 'from-success/10 to-success/5 border-success/20 hover:border-success/40',
  warning: 'from-warning/10 to-warning/5 border-warning/20 hover:border-warning/40',
};

const iconBgStyles = {
  primary: 'bg-primary/10',
  accent: 'bg-accent/20',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
};

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const color = course.color as keyof typeof colorStyles;

  const total = course.total_questions || 0;
  const attempted = course.attempted_questions || 0;
  const accuracy = course.accuracy_percentage || 0;
  
  const completionPercentage = total > 0 ? Math.round((attempted / total) * 100) : 0;

  return (
    <Link 
      to={`/practice/${course.id}`}
      className={cn(
        "block p-6 rounded-xl border-2 bg-gradient-to-br transition-all duration-300 hover:shadow-lg group relative overflow-hidden",
        colorStyles[color] || colorStyles.primary
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className={cn(
            "inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl",
            iconBgStyles[color] || iconBgStyles.primary
          )}>
            {course.icon}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {course.code}
            </p>
            <h3 className="text-lg font-semibold mt-1 group-hover:text-primary transition-colors">
              {course.name}
            </h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {attempted > 0 && (
            <span className={cn(
              "px-2.5 py-1 rounded-full text-xs font-bold border shrink-0",
              accuracy >= 80 
                ? "bg-success/15 border-success/30 text-success" 
                : accuracy >= 50 
                ? "bg-warning/15 border-warning/30 text-warning" 
                : "bg-destructive/15 border-destructive/30 text-destructive"
            )}>
              {accuracy}% Accuracy
            </span>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </div>
      
      {/* Progress section */}
      <div className="mt-5 pt-4 border-t border-border/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">
            {total > 0 ? `${attempted} of ${total} completed` : 'No questions yet'}
          </span>
          <span className="text-muted-foreground font-bold">{completionPercentage}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500" 
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
