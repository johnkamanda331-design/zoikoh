import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookOpen, Users, Zap, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CategoryFilterProps {
  selected: number | null;
  onChange: (categoryId: number | null) => void;
  categories?: Array<{ id: number; name: string; description: string }>;
}

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'General', description: 'General Bible trivia', icon: Lightbulb },
  { id: 2, name: 'Old Testament', description: 'OT stories and characters', icon: BookOpen },
  { id: 3, name: 'New Testament', description: 'NT gospels and epistles', icon: BookOpen },
  { id: 4, name: 'Jesus & Gospels', description: 'Jesus\'s life and teachings', icon: Lightbulb },
  { id: 5, name: 'Characters', description: 'Biblical figures', icon: Users },
  { id: 6, name: 'Books of the Bible', description: 'Bible structure & authorship', icon: BookOpen },
  { id: 7, name: 'Psalms & Proverbs', description: 'Wisdom literature', icon: Lightbulb },
  { id: 8, name: 'Miracles & Prophecies', description: 'Supernatural events', icon: Zap },
];

export function CategoryFilter({ selected, onChange, categories }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cats = categories || DEFAULT_CATEGORIES;
  const selectedCategory = cats.find(c => c.id === selected);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full px-4 py-3 rounded-xl border border-border/50 bg-secondary/40
          hover:border-border transition-all flex items-center justify-between
          text-left font-medium
        "
      >
        <span className="flex items-center gap-2">
          {selectedCategory ? (
            <>
              <Badge variant="purple" className="rounded-md">{selectedCategory.name}</Badge>
              <span className="text-xs text-muted-foreground">{selectedCategory.description}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select a category...</span>
          )}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              absolute top-full left-0 right-0 mt-2 z-50
              bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden
            "
          >
            <div className="p-2 max-h-80 overflow-y-auto">
              <motion.button
                whileHover={{ backgroundColor: 'rgba(108, 58, 237, 0.1)' }}
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors hover:bg-secondary/60 text-sm ${selected == null ? 'bg-brand-purple/20 text-brand-purple' : 'text-foreground'}`}
              >
                All Categories
              </motion.button>

              {cats.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    onChange(category.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all text-sm
                    ${selected === category.id
                      ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30'
                      : 'hover:bg-secondary/60 text-foreground'}
                  `}
                >
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs text-muted-foreground">{category.description}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
