import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Gamepad2, Users, Trophy, Zap, BookOpen, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tips: string[];
  highlightPath?: string;
}

const TUTORIAL_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to ZOIKOH',
    description: 'Your ultimate Bible trivia adventure! Learn scripture while having fun with multiple game modes.',
    icon: BookOpen,
    tips: [
      '🎮 10+ game modes available',
      '📚 Learn from explanations',
      '🏆 Track your progress',
      '👥 Challenge friends',
    ],
  },
  {
    title: 'Solo Play Modes',
    description: 'Master your Bible knowledge with solo games like Q&A, Daily Challenge, and Speed Round.',
    icon: Gamepad2,
    tips: [
      '📋 Q&A: Classic multiple choice',
      '🎯 Daily Challenge: Earn streaks',
      '⚡ Speed Round: Race against time',
      '✨ AI Generation: Unique questions',
    ],
  },
  {
    title: 'Multiplayer Fun',
    description: 'Host sessions, join friends, or duel other players in real-time competitions.',
    icon: Users,
    tips: [
      '🎪 Host Quiz Sessions',
      '🚪 Join Lobbies',
      '⚔️ One-on-One Duels',
      '🌍 Live Leaderboards',
    ],
  },
  {
    title: 'Achievements & Progress',
    description: 'Unlock achievements, build streaks, and climb the leaderboards with your knowledge.',
    icon: Trophy,
    tips: [
      '🔥 Build daily streaks',
      '🏅 Unlock achievements',
      '⭐ Earn XP and levels',
      '📊 View detailed stats',
    ],
  },
  {
    title: 'Difficulty Levels',
    description: 'Choose your challenge: Easy for beginners, Hard for experts, or Mixed for variety.',
    icon: Zap,
    tips: [
      '🟢 Easy: Perfect for learning',
      '🟡 Medium: Balanced challenge',
      '🔴 Hard: Expert questions',
      '🎲 Mixed: Random difficulties',
    ],
  },
  {
    title: 'Smart Features',
    description: 'Learn from detailed explanations, customize your experience, and track your improvement.',
    icon: Settings,
    tips: [
      '💡 Read explanations after each answer',
      '🎨 Customize theme and difficulty',
      '📈 Monitor your accuracy rate',
      '🎯 Focus on weak areas',
    ],
  },
  {
    title: 'Ice-Breakers',
    description: 'Access faith-based ice-breaker activities next to the Bible reader for social gatherings.',
    icon: Sparkles,
    highlightPath: '#icebreakers-button',
    tips: [
      '🤝 30 faith-based social activities',
      '💬 Select an activity to see step-by-step guidance',
      '✨ Use it in groups, church events, or fellowship',
      '📌 Built for conversation and connection',
    ],
  },
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingTutorial({ isOpen, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    if (!step.highlightPath) {
      setHighlightRect(null);
      return;
    }

    const updateRect = () => {
      const target = document.querySelector<HTMLElement>(step.highlightPath);
      if (target) {
        setHighlightRect(target.getBoundingClientRect());
      } else {
        setHighlightRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [step.highlightPath, currentStep, isOpen]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
        >
          {highlightRect ? (
            <div className="pointer-events-none">
              <div
                className="absolute rounded-2xl border-2 border-brand-purple/80 shadow-[0_0_0_6px_rgba(124,58,237,0.12)] animate-pulse"
                style={{
                  top: highlightRect.top - 10,
                  left: highlightRect.left - 10,
                  width: highlightRect.width + 20,
                  height: highlightRect.height + 20,
                }}
              />
              <div
                className="absolute bg-brand-purple text-white text-[11px] font-semibold uppercase tracking-[0.2em] rounded-full px-2 py-1"
                style={{ top: highlightRect.top - 32, left: highlightRect.left }}
              >
                Ice-Breakers
              </div>
            </div>
          ) : null}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-2xl"
          >
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-0">
                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onComplete}
                  className="absolute top-4 right-4 z-10 p-2 hover:bg-secondary/60 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </motion.button>

                {/* Content */}
                <div className="p-8 text-center space-y-6">
                  {/* Step indicator */}
                  <div className="flex items-center justify-center gap-1.5">
                    {TUTORIAL_STEPS.map((_, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`
                          h-1.5 rounded-full transition-all
                          ${idx === currentStep ? 'w-8 bg-brand-purple' : 'w-2 bg-border/50'}
                        `}
                      />
                    ))}
                  </div>

                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 bg-gradient-to-br from-brand-purple/20 to-brand-blue/20 rounded-2xl flex items-center justify-center mx-auto"
                  >
                    <Icon className="w-10 h-10 text-brand-purple" />
                  </motion.div>

                  {/* Title & Description */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">{step.title}</h2>
                    <p className="text-muted-foreground text-base leading-relaxed">{step.description}</p>
                  </motion.div>

                  {/* Tips */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-secondary/50 rounded-xl p-4 text-left space-y-2"
                  >
                    {step.tips.map((tip, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        className="text-sm text-foreground/80 flex items-center gap-2.5"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                        {tip}
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Navigation */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3 justify-center"
                  >
                    <Button
                      variant="outline"
                      onClick={handlePrev}
                      disabled={currentStep === 0}
                      className="rounded-lg"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90"
                    >
                      {isLastStep ? 'Get Started' : 'Next'}
                      <ChevronRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </motion.div>

                  {/* Progress text */}
                  <p className="text-xs text-muted-foreground">
                    Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
