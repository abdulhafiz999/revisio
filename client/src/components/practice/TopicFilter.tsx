import React from 'react';
import { Topic } from '@/services/api.client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

interface TopicFilterProps {
  topics: Topic[];
  selectedTopic: string | null;
  onSelectTopic: (topicId: string | null) => void;
  selectedDifficulty: string | null;
  onSelectDifficulty: (difficulty: string | null) => void;
}

const difficulties = ['easy', 'medium', 'hard'];

const TopicFilter: React.FC<TopicFilterProps> = ({
  topics,
  selectedTopic,
  onSelectTopic,
  selectedDifficulty,
  onSelectDifficulty
}) => {
  return (
    <div className="bg-card rounded-xl border p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filters
      </div>

      {/* Topics */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Topic</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedTopic === null ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectTopic(null)}
            className={cn(
              "text-xs",
              selectedTopic === null && "bg-primary"
            )}
          >
            All Topics
          </Button>
          {topics.map(topic => (
            <Button
              key={topic.id}
              variant={selectedTopic === topic.id ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectTopic(topic.id)}
              className={cn(
                "text-xs",
                selectedTopic === topic.id && "bg-primary"
              )}
            >
              {topic.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Difficulty</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedDifficulty === null ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectDifficulty(null)}
            className={cn(
              "text-xs",
              selectedDifficulty === null && "bg-primary"
            )}
          >
            All Levels
          </Button>
          {difficulties.map(diff => (
            <Button
              key={diff}
              variant={selectedDifficulty === diff ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectDifficulty(diff)}
              className={cn(
                "text-xs capitalize",
                selectedDifficulty === diff && "bg-primary"
              )}
            >
              {diff}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicFilter;
