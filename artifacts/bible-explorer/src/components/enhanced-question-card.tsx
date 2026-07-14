import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { recordAnswer } from '@/lib/progress';
import { trackEvent } from '@/lib/analytics';

interface EnhancedQuestionCardProps {
  question: {
    id: number;
    text: string;
    options: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    categoryId?: number;
    book?: string;
    explanation?: string;
  };
  currentIndex: number;
  total: number;
  onSelectAnswer: (answer: string) => void;
  selectedAnswer?: string;
  isAnswered?: boolean;
  correctAnswer?: string;
}

const DIFFICULTY_CONFIG = {
  easy: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Easy' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Medium' },
  hard: { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Hard' },
};

const CATEGORY_NAMES: Record<number, string> = {
  1: 'General',
  2: 'Old Testament',
  3: 'New Testament',
  4: 'Jesus & Gospels',
  5: 'Characters',
  6: 'Books of the Bible',
  7: 'Psalms & Proverbs',
  8: 'Miracles & Prophecies',
};

export function EnhancedQuestionCard({
  question,
  currentIndex,
  total,
  onSelectAnswer,
  selectedAnswer,
  isAnswered,
  correctAnswer,
}: EnhancedQuestionCardProps) {
  const difficulty = question.difficulty || 'medium';
  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const categoryName = question.categoryId ? CATEGORY_NAMES[question.categoryId] : 'General';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      {/* Progress and metadata */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
            Question {currentIndex + 1} of {total}
          </span>
          <div className="flex items-center gap-2">
            {question.book && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <BookOpen className="w-3 h-3" />
                {question.book}
              </Badge>
            )}
            {question.difficulty && (
              <Badge
                className={`text-xs border ${diffConfig.bg} ${diffConfig.border} ${diffConfig.color}`}
                variant="outline"
              >
                {diffConfig.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="h-1 bg-secondary rounded-full overflow-hidden origin-left"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: (currentIndex + 1) / total }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="h-full bg-gradient-to-r from-brand-purple to-brand-blue"
          />
        </motion.div>
      </div>

      {/* Question text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
          <h2 className="text-xl md:text-2xl font-heading font-bold leading-relaxed">
            {question.text}
          </h2>
        </div>

        {/* Category tag */}
        {question.categoryId && (
          <Badge variant="outline" className="w-fit text-xs rounded-lg">
            {categoryName}
          </Badge>
        )}
      </motion.div>

      {/* Answer options */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-2.5"
      >
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = correctAnswer === option;
          const isWrong = isSelected && selectedAnswer !== correctAnswer;
          function handleSelect() {
            if (isAnswered) return;
            const wasCorrect = option === correctAnswer;
            try {
              recordAnswer(question.id, wasCorrect, { category: String(question.categoryId ?? 'unknown'), difficulty: question.difficulty });
            } catch {}
            try {
              trackEvent('question_answered', { questionId: question.id, selected: option, correct: wasCorrect, difficulty: question.difficulty, categoryId: question.categoryId });
            } catch {}
            onSelectAnswer(option);
          }

          return (
            <motion.button
              key={idx}
              whileHover={isAnswered ? {} : { x: 4 }}
              whileTap={isAnswered ? {} : { scale: 0.98 }}
              onClick={() => handleSelect()}
              disabled={isAnswered}
              className={`
                w-full p-4 rounded-xl border-2 transition-all text-left font-medium
                ${isAnswered
                  ? isCorrect
                    ? 'bg-green-500/10 border-green-500/50 text-green-200'
                    : isWrong
                    ? 'bg-red-500/10 border-red-500/50 text-red-200'
                    : 'bg-secondary/40 border-border/50 text-foreground/60 cursor-not-allowed'
                  : isSelected
                  ? 'bg-brand-purple/20 border-brand-purple/50 text-foreground'
                  : 'bg-secondary/50 border-border/50 hover:border-brand-purple/30 text-foreground'}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base">{option}</span>
                {isAnswered && (
                  <span className="text-xs font-semibold">
                    {isCorrect && '✓'}
                    {isWrong && '✗'}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Explanation (shown when answered) */}
      {isAnswered && question.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Explanation</p>
          </div>
          <p className="text-sm leading-relaxed text-blue-100/90">{question.explanation}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
