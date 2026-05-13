import React from 'react';
import { WeakTopic, StrongTopic } from '@/services/api.client';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TopicStrengthProps {
  weakTopics: WeakTopic[];
  strongTopics: StrongTopic[];
}

const TopicStrength: React.FC<TopicStrengthProps> = ({ weakTopics, strongTopics }) => {
  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-6">Topic Analysis</h3>
      
      <div className="space-y-6">
        {/* Strong Topics */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-success" />
            <h4 className="text-sm font-medium text-success">Strong Topics</h4>
          </div>
          <div className="space-y-3">
            {strongTopics.length > 0 ? (
              strongTopics.slice(0, 3).map((topic) => (
                <div key={topic.topic_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{topic.topic_name}</span>
                    <span className="font-medium text-success">{Math.round(topic.accuracy_percentage)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill bg-gradient-success"
                      style={{ width: `${topic.accuracy_percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No strong topics yet. Keep practicing!</p>
            )}
          </div>
        </div>

        {/* Weak Topics */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-warning" />
            <h4 className="text-sm font-medium text-warning">Needs Improvement</h4>
          </div>
          <div className="space-y-3">
            {weakTopics.length > 0 ? (
              weakTopics.slice(0, 3).map((topic) => (
                <div key={topic.topic_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{topic.topic_name}</span>
                    <span className="font-medium text-warning">{Math.round(topic.accuracy_percentage)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill bg-warning"
                      style={{ width: `${topic.accuracy_percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No weak topics identified yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicStrength;
