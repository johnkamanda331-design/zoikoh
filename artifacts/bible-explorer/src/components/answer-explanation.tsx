import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, BookOpen, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnswerExplanationProps {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  book?: string;
  question: string;
  onDismiss: () => void;
}

export function AnswerExplanation({
  isCorrect,
  userAnswer,
  correctAnswer,
  explanation,
  book,
  question,
  onDismiss,
}: AnswerExplanationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="pointer-events-auto"
    >
      <Card className={`
        overflow-hidden border-2 rounded-2xl
        ${isCorrect 
          ? 'bg-gradient-to-br from-green-500/10 to-green-400/5 border-green-500/50' 
          : 'bg-gradient-to-br from-red-500/10 to-red-400/5 border-red-500/50'}
      `}>
        <CardContent className="p-6 space-y-4">
          {/* Header with icon */}
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
            </motion.div>
            <div>
              <h3 className={`font-heading font-bold text-lg ${
                isCorrect ? 'text-green-500' : 'text-red-500'
              }`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isCorrect ? 'Great job! You got it right.' : 'That\'s not quite right. Here\'s the answer:'}
              </p>
            </div>
          </div>

          {/* Question */}
          <div className="bg-secondary/60 rounded-lg p-3 border border-border/30">
            <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold mb-1">Question</p>
            <p className="text-sm font-medium leading-relaxed">{question}</p>
          </div>

          {/* Answers */}
          <div className="space-y-2">
            {!isCorrect && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Your Answer</p>
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-200">{userAnswer}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Correct Answer</p>
              <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-200">{correctAnswer}</p>
              </div>
            </div>
          </div>

          {/* Explanation */}
          {explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-secondary/40 rounded-lg p-3.5 border border-brand-purple/30 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-brand-purple/70 shrink-0" />
                <p className="text-xs font-semibold text-brand-purple/70 uppercase tracking-wide">Explanation</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">{explanation}</p>
            </motion.div>
          )}

          {/* Bible Reference */}
          {book && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg p-2.5"
            >
              <BookOpen className="w-4 h-4 shrink-0 text-brand-purple/60" />
              <span className="font-medium">{book}</span>
            </motion.div>
          )}

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDismiss}
            className={`
              w-full py-2.5 rounded-lg font-semibold transition-all
              ${isCorrect
                ? 'bg-gradient-to-r from-green-600 to-green-500 hover:opacity-90 text-white'
                : 'bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 text-white'}
            `}
          >
            {isCorrect ? 'Continue' : 'Try Again'}
          </motion.button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
