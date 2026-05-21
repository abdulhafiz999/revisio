import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { WeeklyActivityDay } from '@/services/api.client';
import { cn } from '@/lib/utils';

interface ProgressChartProps {
  data: WeeklyActivityDay[];
}

function getContributionLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (max <= 0) return 1;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const levelClasses: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-muted',
  1: 'bg-primary/25 hover:bg-primary/35',
  2: 'bg-primary/45 hover:bg-primary/55',
  3: 'bg-primary/65 hover:bg-primary/75',
  4: 'bg-primary hover:bg-primary/90',
};

const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const chartData = useMemo(
    () =>
      data.map((day) => ({
        ...day,
        shortLabel: day.label,
      })),
    [data]
  );

  const maxAttempted = useMemo(
    () => Math.max(...chartData.map((d) => d.attempted), 1),
    [chartData]
  );

  const weekTotal = useMemo(
    () => chartData.reduce((sum, d) => sum + d.attempted, 0),
    [chartData]
  );

  const hasActivity = weekTotal > 0;

  return (
    <div
      className={cn(
        'bg-card rounded-xl border p-6 transition-all duration-700 ease-out',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-semibold">Last 7 days</h3>
          <p className="text-sm text-muted-foreground">
            {hasActivity
              ? `${weekTotal} question${weekTotal === 1 ? '' : 's'} practiced this week`
              : 'Your activity grid fills in as you practice'}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Less → More</p>
      </div>

      {/* GitHub-style contribution row */}
      <div className="mb-6">
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {chartData.map((day, index) => {
            const level = getContributionLevel(day.attempted, maxAttempted);
            return (
              <div
                key={day.date}
                className="flex flex-col items-center gap-2"
                style={{
                  animationDelay: `${index * 70}ms`,
                }}
              >
                <div
                  className={cn(
                    'contrib-cell w-full aspect-square max-w-[52px] rounded-md border border-border/60 transition-colors cursor-default',
                    levelClasses[level],
                    mounted && 'contrib-cell-enter'
                  )}
                  title={`${day.label}: ${day.attempted} attempted, ${day.correct} correct`}
                />
                <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                  {day.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smooth curves */}
      <div className="h-56">
        {hasActivity ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillAttempted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillCorrect" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="shortLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as WeeklyActivityDay | undefined;
                  return row?.date ?? '';
                }}
              />
              <Area
                type="monotone"
                dataKey="attempted"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#fillAttempted)"
                name="Attempted"
                isAnimationActive={mounted}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="correct"
                stroke="hsl(var(--success))"
                strokeWidth={2.5}
                fill="url(#fillCorrect)"
                name="Correct"
                isAnimationActive={mounted}
                animationDuration={1400}
                animationBegin={150}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-4">
            No activity yet this week. Answer a question and your grid and chart will light up.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Attempted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Correct</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn('w-3 h-3 rounded-sm', levelClasses[level as 0 | 1 | 2 | 3 | 4])}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
