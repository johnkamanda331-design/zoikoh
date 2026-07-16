import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Zap, BookOpen } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useGetDailyContent } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';

export function SelfPractice() {
  const [, setLocation] = useLocation();
  const { data: dailyContent, isLoading, isError } = useGetDailyContent();
  const [journalEntry, setJournalEntry] = useState('');
  const [completed, setCompleted] = useState(false);

  const downloadJournalPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const title = dailyContent?.verseReference
      ? `Self-Practice Notes - ${dailyContent.verseReference}`
      : 'Self-Practice Notes';

    doc.setFontSize(18);
    doc.text(title, 40, 50);
    doc.setFontSize(12);
    doc.text(`Verse: ${dailyContent?.verseReference ?? 'N/A'}`, 40, 80);
    doc.text('Notes:', 40, 110);

    const lines = doc.splitTextToSize(journalEntry.trim() || 'No notes entered.', 520);
    doc.text(lines, 40, 140);

    const filename = `self-practice-notes-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  const prompt = dailyContent
    ? `Use ${dailyContent.verseReference} as your guided prompt: write a brief encouragement, pray with this verse in mind, or apply it in a simple, practical way.`
    : 'Use today’s verse as your reflective prompt: write a short encouragement, pray with it, or do one small practical action inspired by it.';

  const summary = dailyContent?.verse
    ? 'Take a moment to meditate on this verse and reflect on how it applies to your day.'
    : 'The verse shown above is your prompt for today’s practice.';

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => setLocation('/')} className="gap-2">
        Back
      </Button>

      <div className="rounded-3xl border border-border/50 bg-card p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue mb-6">
          <Zap className="w-4 h-4" /> Self Practice
        </div>

        <h1 className="text-4xl font-heading font-bold mb-4">Real-life reflection</h1>
        <p className="text-sm leading-7 text-muted-foreground mb-6">
          This is your guided activity for the day. Use the verse below to do something meaningful for yourself or someone else.
        </p>

        <div className="rounded-3xl border border-border/50 bg-secondary/70 p-6 mb-6">
          <p className="text-sm font-semibold text-foreground">Verse of the Day</p>
          <p className="mt-2 text-lg font-semibold text-brand-purple">{dailyContent?.verseReference ?? 'Verse of the Day'}</p>
          <blockquote className="mt-4 text-base leading-relaxed text-foreground">"{dailyContent?.verse ?? 'For God so loved the world…'}"</blockquote>
          <p className="mt-4 text-sm text-muted-foreground">{summary}</p>
        </div>

        <div className="rounded-3xl border border-border/50 bg-card p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-brand-blue" />
            <h2 className="text-lg font-semibold">Your guided prompt</h2>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your practice prompt…</p>
          ) : isError ? (
            <p className="text-sm text-red-600">Unable to load the prompt. Please try again later.</p>
          ) : (
            <p className="text-sm leading-7 text-foreground">{prompt}</p>
          )}
        </div>

        {completed ? (
          <div className="rounded-3xl border border-green-300 bg-green-50 p-6 text-center">
            <h2 className="text-2xl font-heading font-bold text-green-700">Well done!</h2>
            <p className="mt-3 text-sm text-green-900">You’ve completed today’s reflection. Keep this thought close as you move through your day.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full" onClick={downloadJournalPdf} disabled={!journalEntry.trim()}>
                Download your notes as PDF
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setCompleted(false)}>
                Practice again
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-border/50 bg-secondary/70 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">How to use it</h3>
              <ol className="space-y-3 text-sm leading-7 text-foreground list-decimal list-inside">
                <li>Read the verse slowly and let it speak to your day.</li>
                <li>Write one short reflection, prayer, or action idea below.</li>
                <li>Use it to encourage someone else or to guide a personal moment.</li>
              </ol>
            </div>

            <textarea
              value={journalEntry}
              onChange={(event) => setJournalEntry(event.target.value)}
              rows={8}
              placeholder="Write your reflection or action plan here..."
              className="w-full rounded-3xl border border-border/50 bg-background p-4 text-sm leading-6 outline-none"
            />

            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full" onClick={() => setCompleted(true)} disabled={!journalEntry.trim()}>
                Mark complete
              </Button>
              <Button variant="outline" size="lg" className="rounded-full" onClick={downloadJournalPdf} disabled={!journalEntry.trim()}>
                Download PDF
              </Button>
              <Button variant="outline" size="lg" className="rounded-full" onClick={() => setJournalEntry('')}>
                Reset
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
