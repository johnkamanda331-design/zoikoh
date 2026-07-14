import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DifficultySelectorProps {
  selected: 'easy' | 'medium' | 'hard' | 'mixed';
  onChange: (difficulty: 'easy' | 'medium' | 'hard' | 'mixed') => void;
  compact?: boolean;
}

const DIFFICULTIES = [
  {
    value: 'easy' as const,
    label: 'Easy',
    icon: Target,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    description: 'Perfect for beginners',
  },
  {
    value: 'medium' as const,
    label: 'Medium',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    description: 'Balanced challenge',
  },
  {
    value: 'hard' as const,
    label: 'Hard',
    icon: Brain,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    description: 'Expert level',
  },
  {
    value: 'mixed' as const,
    label: 'Mixed',
    icon: Zap,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    description: 'All difficulties',
  },
];

export function DifficultySelector({ selected, onChange, compact }: DifficultySelectorProps) {
  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {DIFFICULTIES.map((diff) => {
          const Icon = diff.icon;
          const isSelected = selected === diff.value;
          return (
            <motion.button
              key={diff.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(diff.value)}
              className={`
                px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5
                ${isSelected 
                  ? `${diff.bg} ${diff.border} border-2` 
                  : 'bg-secondary/40 border border-border/50 hover:border-border'}
              `}
            >
              <Icon className={`w-4 h-4 ${isSelected ? diff.color : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${isSelected ? diff.color : 'text-muted-foreground'}`}>
                {diff.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {DIFFICULTIES.map((diff) => {
        const Icon = diff.icon;
        const isSelected = selected === diff.value;
        return (
          <motion.button
            key={diff.value}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(diff.value)}
            className={`
              p-4 rounded-xl border-2 transition-all text-center
              ${isSelected 
                ? `${diff.bg} ${diff.border} border-2 ring-2 ring-offset-2 ring-offset-card` 
                : 'bg-card border-border/50 hover:border-border hover:bg-secondary/50'}
            `}
          >
            <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? diff.color : 'text-muted-foreground'}`} />
            <p className="font-heading font-bold text-sm">{diff.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{diff.description}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
