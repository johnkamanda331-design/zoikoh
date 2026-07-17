import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Moon, Sun, Settings as SettingsIcon,
  Type, Eye, Zap, RotateCcw, BellRing,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DifficultySelector } from '@/components/difficulty-selector';
import { loadPreferences, savePreferences, type UserPreferences } from '@/lib/preferences';
import { TRANSLATIONS } from '@/lib/bible';
import { toast } from 'sonner';

export function PreferencesPanel() {
  const [prefs, setPrefs] = useState<UserPreferences>(loadPreferences());

  const updatePref = (key: keyof UserPreferences, value: any) => {
    const updated = savePreferences({ ...prefs, [key]: value });
    setPrefs(updated);
  };

  const resetToDefaults = () => {
    const defaults: UserPreferences = {
      theme: 'light',
      difficulty: 'medium',
      adaptiveDifficulty: false,
      dailyReminder: true,
      tutorialCompleted: false,
      showExplanations: true,
      fontSize: 'medium',
      highContrast: false,
      language: 'en',
      translation: 'ESV',
      readingDensity: 'comfortable',
      lineSpacing: 'comfortable',
      reducedMotion: false,
    };
    const updated = savePreferences(defaults);
    setPrefs(updated);
    toast.success('Preferences reset to defaults');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
          <TabsTrigger value="appearance" className="gap-2">
            <Sun className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="gameplay" className="gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Gameplay</span>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="gap-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Access</span>
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Theme</CardTitle>
              <CardDescription>Choose your preferred color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {(['dark', 'light', 'auto'] as const).map((theme) => (
                  <motion.button
                    key={theme}
                    whileHover={{ y: -2 }}
                    onClick={() => updatePref('theme', theme)}
                    className={`
                      p-3 rounded-xl border-2 transition-all
                      ${prefs.theme === theme
                        ? 'border-brand-purple bg-brand-purple/10'
                        : 'border-border/50 bg-secondary/40 hover:border-border'}
                    `}
                  >
                    {theme === 'dark' && <Moon className="w-5 h-5 mx-auto mb-1" />}
                    {theme === 'light' && <Sun className="w-5 h-5 mx-auto mb-1" />}
                    {theme === 'auto' && <SettingsIcon className="w-5 h-5 mx-auto mb-1" />}
                    <p className="text-xs font-semibold capitalize">{theme}</p>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Font Size</CardTitle>
              <CardDescription>Adjust text size for comfort</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <motion.button
                    key={size}
                    whileHover={{ y: -2 }}
                    onClick={() => updatePref('fontSize', size)}
                    className={`
                      p-3 rounded-xl border-2 transition-all
                      ${prefs.fontSize === size
                        ? 'border-brand-purple bg-brand-purple/10'
                        : 'border-border/50 bg-secondary/40 hover:border-border'}
                    `}
                  >
                    <Type className="w-5 h-5 mx-auto mb-1" />
                    <p className={`font-semibold capitalize ${
                      size === 'small' ? 'text-xs' :
                      size === 'medium' ? 'text-sm' :
                      'text-base'
                    }`}>
                      {size}
                    </p>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gameplay Tab */}
        <TabsContent value="gameplay" className="space-y-4">
          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Default Difficulty</CardTitle>
              <CardDescription>Your preferred starting difficulty</CardDescription>
            </CardHeader>
            <CardContent>
              <DifficultySelector
                selected={prefs.difficulty}
                onChange={(d) => updatePref('difficulty', d)}
                compact
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Adaptive Difficulty</CardTitle>
              <CardDescription>Automatically adjust trivia difficulty as you improve</CardDescription>
            </CardHeader>
            <CardContent>
              <motion.button
                onClick={() => updatePref('adaptiveDifficulty', !prefs.adaptiveDifficulty)}
                className={`
                  relative inline-flex h-6 w-11 rounded-full transition-colors
                  ${prefs.adaptiveDifficulty ? 'bg-brand-purple' : 'bg-secondary'}
                `}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  layout
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md"
                  animate={{ x: prefs.adaptiveDifficulty ? 20 : 2 }}
                />
              </motion.button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Answer Explanations</CardTitle>
              <CardDescription>Show explanations after each question</CardDescription>
            </CardHeader>
            <CardContent>
              <motion.button
                onClick={() => updatePref('showExplanations', !prefs.showExplanations)}
                className={`
                  relative inline-flex h-6 w-11 rounded-full transition-colors
                  ${prefs.showExplanations ? 'bg-brand-purple' : 'bg-secondary'}
                `}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  layout
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md"
                  animate={{ x: prefs.showExplanations ? 20 : 2 }}
                />
              </motion.button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Daily Reminders</CardTitle>
              <CardDescription>Get a gentle nudge to keep your practice streak alive</CardDescription>
            </CardHeader>
            <CardContent>
              <motion.button
                onClick={() => updatePref('dailyReminder', !prefs.dailyReminder)}
                className={`
                  relative inline-flex h-6 w-11 rounded-full transition-colors
                  ${prefs.dailyReminder ? 'bg-brand-purple' : 'bg-secondary'}
                `}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  layout
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md"
                  animate={{ x: prefs.dailyReminder ? 20 : 2 }}
                />
              </motion.button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accessibility Tab */}
        <TabsContent value="accessibility" className="space-y-4">
          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">High Contrast Mode</CardTitle>
              <CardDescription>Enhance visibility with stronger color contrast</CardDescription>
            </CardHeader>
            <CardContent>
              <motion.button
                onClick={() => updatePref('highContrast', !prefs.highContrast)}
                className={`
                  relative inline-flex h-6 w-11 rounded-full transition-colors
                  ${prefs.highContrast ? 'bg-brand-purple' : 'bg-secondary'}
                `}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  layout
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md"
                  animate={{ x: prefs.highContrast ? 20 : 2 }}
                />
              </motion.button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Reduced Motion</CardTitle>
              <CardDescription>Disable non-essential animations for accessibility</CardDescription>
            </CardHeader>
            <CardContent>
              <motion.button
                onClick={() => updatePref('reducedMotion', !prefs.reducedMotion)}
                className={`
                  relative inline-flex h-6 w-11 rounded-full transition-colors
                  ${prefs.reducedMotion ? 'bg-brand-purple' : 'bg-secondary'}
                `}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  layout
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md"
                  animate={{ x: prefs.reducedMotion ? 20 : 2 }}
                />
              </motion.button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Bible Translation</CardTitle>
              <CardDescription>Choose the verse source for the Bible panel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {TRANSLATIONS.map((translation) => (
                  <motion.button
                    key={translation.code}
                    whileHover={{ y: -2 }}
                    onClick={() => updatePref('translation', translation.code)}
                    aria-pressed={prefs.translation === translation.code}
                    className={`
                      p-3 rounded-xl border-2 transition-all text-sm font-semibold
                      ${prefs.translation === translation.code
                        ? 'border-brand-purple bg-brand-purple/10 text-foreground'
                        : 'border-border/50 bg-secondary/40 text-muted-foreground hover:border-border'}`
                    }
                  >
                    {translation.code}
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Button */}
      <Card className="rounded-2xl border-border/50 bg-secondary/30">
        <CardContent className="p-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetToDefaults}
            className="
              w-full px-4 py-2.5 rounded-lg border border-dashed border-muted-foreground/50
              hover:border-brand-purple/50 transition-colors flex items-center justify-center gap-2
              text-muted-foreground hover:text-brand-purple text-sm font-medium
            "
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </motion.button>
        </CardContent>
      </Card>
    </div>
  );
}
