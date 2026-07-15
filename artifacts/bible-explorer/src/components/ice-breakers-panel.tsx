import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Users, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIceBreakersPanelStore } from '@/hooks/use-icebreakers-panel';

interface IceBreakerItem {
  id: string;
  title: string;
  summary: string;
  instructions: string[];
  notes?: string;
}

const ICE_BREAKERS: IceBreakerItem[] = [
  {
    id: 'bible-iceberg',
    title: 'Bible Iceberg',
    summary: 'Share a surprising Bible story and ask others to name the character.',
    instructions: [
      'Choose a lesser-known Bible story or character.',
      'Share a short description without giving the name away.',
      'Ask the group to guess who or what the story is about.',
      'Reveal the full story and invite others to share their own favorites.',
    ],
    notes: 'Great for small groups and youth gatherings.',
  },
  {
    id: 'verse-pair',
    title: 'Verse Pair',
    summary: 'Pair up and compare your favorite verses on the same theme.',
    instructions: [
      'Ask participants to think of a verse about hope, love, or courage.',
      'Pair people up and have them share their selections with each other.',
      'Discuss why the verse stood out and how it applies to life today.',
    ],
    notes: 'Encourages personal sharing and scripture connection.',
  },
  {
    id: 'prayer-prompt',
    title: 'Prayer Prompt',
    summary: 'Offer three quick prayer topics and let the group choose one.',
    instructions: [
      'Write down three brief prayer ideas related to gratitude, guidance, or courage.',
      'Invite the group to choose one topic together.',
      'Pray briefly over the chosen topic or encourage personal prayer time.',
    ],
    notes: 'Light and respectful for faith-based gatherings.',
  },
  {
    id: 'faith-fact',
    title: 'Faith Fact',
    summary: 'Share a small piece of Bible history and ask others if they knew it.',
    instructions: [
      'Pick a short, interesting fact from scripture or church history.',
      'Share it in a conversational way.',
      'Ask others if they were aware of it or if it reminds them of another story.',
    ],
    notes: 'Helps people learn together without pressure.',
  },
  {
    id: 'gratitude-round',
    title: 'Gratitude Round',
    summary: 'Ask each person to name one thing they are grateful for today.',
    instructions: [
      'Begin by sharing your own gratitude moment.',
      'Invite others to respond in one sentence.',
      'If desired, close with a short group blessing or prayer.',
    ],
    notes: 'A gentle way to get everyone talking and reflecting.',
  },
  {
    id: 'share-a-prayer',
    title: 'Share a Prayer',
    summary: 'Invite someone to quietly share a short prayer request with the group.',
    instructions: [
      'Explain that prayer requests are optional and respected.',
      'Give people time to think of a need or praise to share.',
      'Allow one or two volunteers to speak and offer a brief prayer response.',
    ],
    notes: 'Good for building trust in a faith-based group.',
  },
  {
    id: 'story-spotlight',
    title: 'Story Spotlight',
    summary: 'Tell a short story from the Bible and ask what lesson it teaches.',
    instructions: [
      'Choose a familiar story and summarize it in one or two sentences.',
      'Ask the group to identify the lesson or main message.',
      'Discuss how that lesson applies to daily life.',
    ],
    notes: 'Works well for mixed-age groups.',
  },
  {
    id: 'two-truths',
    title: 'Two Truths',
    summary: 'Share two real Bible facts and one fiction, then let others identify the fiction.',
    instructions: [
      'Prepare two true Bible facts and one false statement.',
      'Read them aloud and invite guesses on which one is false.',
      'Explain the correct answer and encourage others to try a set.',
    ],
    notes: 'A playful way to talk about scripture knowledge.',
  },
  {
    id: 'group-verse',
    title: 'Group Verse',
    summary: 'Choose a verse together and read it aloud as a group.',
    instructions: [
      'Offer a theme and suggest a few verses that fit.',
      'Let the group vote on which verse to read.',
      'Read the verse together and briefly discuss its meaning.',
    ],
    notes: 'Builds participation and shared reflection.',
  },
  {
    id: 'bible-bingo',
    title: 'Bible Bingo',
    summary: 'Create a small bingo list of Bible words or themes to spot in conversation.',
    instructions: [
      'Choose 5–7 common Bible-related words or themes.',
      'Ask participants to listen for them during the discussion.',
      'Enjoy a light celebration when someone spots a word or theme.',
    ],
    notes: 'Great for informal fellowship and active listening.',
  },
  {
    id: 'verse-math',
    title: 'Verse Math',
    summary: 'Match a Bible verse reference to its short theme or passage.',
    instructions: [
      'List several verse references and a set of themes.',
      'Ask the group to match each reference with the correct theme.',
      'Reveal the matches and explain why each verse fits.',
    ],
    notes: 'A gentle way to think about scripture together.',
  },
  {
    id: 'gift-of-faith',
    title: 'Gift of Faith',
    summary: 'Ask each person to name a small way their faith has helped them recently.',
    instructions: [
      'Share a quick example first to model the idea.',
      'Give each person a chance to answer if they want.',
      'Highlight how small acts of faith can change daily life.',
    ],
    notes: 'Encourages gratitude and personal sharing.',
  },
  {
    id: 'scripture-match',
    title: 'Scripture Match',
    summary: 'Match a short Bible quote with the correct book or speaker.',
    instructions: [
      'Choose a few recognizable verse snippets.',
      'Ask the group to guess where each quote comes from.',
      'Discuss the context briefly after revealing the answers.',
    ],
    notes: 'A fun way to review familiar scripture passages.',
  },
  {
    id: 'thank-you-note',
    title: 'Thank-You Note',
    summary: 'Invite people to write a short thank-you prayer or message.',
    instructions: [
      'Give everyone a moment to write one sentence of thanks.',
      'Encourage sharing it aloud if comfortable.',
      'Collect the messages and use them as a closing blessing.',
    ],
    notes: 'Touches hearts and promotes gratitude.',
  },
  {
    id: 'question-circle',
    title: 'Question Circle',
    summary: 'Pose a gentle faith question and let people share their answers.',
    instructions: [
      'Ask a question like "What brings you hope today?".',
      'Let each person answer briefly if they want.',
      'Encourage listening without interrupting.',
    ],
    notes: 'Builds connection through thoughtful sharing.',
  },
  {
    id: 'prayer-pair',
    title: 'Prayer Pair',
    summary: 'Pair people to pray silently for each other for one minute.',
    instructions: [
      'Ask pairs to quietly think of a prayer for the other person.',
      'After one minute, invite them to share a simple encouragement.',
      'Remind everyone to respect privacy and keep it brief.',
    ],
    notes: 'A reflective activity for smaller groups.',
  },
  {
    id: 'hope-notes',
    title: 'Hope Notes',
    summary: 'Have each person write a short note of encouragement for someone else.',
    instructions: [
      'Provide a few note cards or paper pieces.',
      'Ask people to write one encouraging sentence.',
      'Collect and share the notes anonymously or personally.',
    ],
    notes: 'Encourages kindness and supportive conversation.',
  },
  {
    id: 'faith-favorites',
    title: 'Faith Favorites',
    summary: 'Share your favorite hymn, verse, or story in one sentence.',
    instructions: [
      'Ask each person to name one favorite faith-related thing.',
      'Encourage a sentence about why it matters.',
      'Keep the pace gentle and positive.',
    ],
    notes: 'Helps people learn common ground quickly.',
  },
  {
    id: 'walk-and-pray',
    title: 'Walk and Pray',
    summary: 'Take a short walk together and pray for the day ahead.',
    instructions: [
      'Suggest a 5-minute walk in a nearby indoor or outdoor space.',
      'Invite quiet prayer or silent gratitude during the walk.',
      'Return and share one word that describes the experience.',
    ],
    notes: 'Great when you want a simple, movement-based activity.',
  },
  {
    id: 'blessing-chain',
    title: 'Blessing Chain',
    summary: 'Pass a blessing around the circle with one sentence each.',
    instructions: [
      'Start by offering a short blessing or kind wish.',
      'Have the next person continue with their own blessing.',
      'Continue until everyone has contributed once.',
    ],
    notes: 'Creates a warm group atmosphere quickly.',
  },
  {
    id: 'gratitude-list',
    title: 'Gratitude List',
    summary: 'Create a shared list of things you are grateful for today.',
    instructions: [
      'Begin with one item you are thankful for.',
      'Ask others to add their own items to the list.',
      'Read the list aloud together at the end.',
    ],
    notes: 'A reflective exercise that works well for any group size.',
  },
  {
    id: 'verse-guess',
    title: 'Verse Guess',
    summary: 'Give a short paraphrase and let the group guess the verse.',
    instructions: [
      'Paraphrase a verse in simple words.',
      'Invite the group to guess which verse it is.',
      'Share the exact verse and why you chose it.',
    ],
    notes: 'Fun for those familiar with familiar Bible passages.',
  },
  {
    id: 'listening-game',
    title: 'Listening Game',
    summary: 'Have one person read a verse and others listen for a theme.',
    instructions: [
      'Select a short verse or passage to read aloud.',
      'Ask people to listen for the main theme or message.',
      'Discuss the theme after reading.',
    ],
    notes: 'Builds listening skills and thoughtful reflection.',
  },
  {
    id: 'shared-prayer',
    title: 'Shared Prayer',
    summary: 'Create a group prayer by adding one sentence each.',
    instructions: [
      'Start with a simple opening sentence of prayer.',
      'Go around and let each person add one sentence.',
      'Finish by thanking God or offering a closing blessing.',
    ],
    notes: 'Helps quieter groups participate in prayer together.',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    summary: 'Match short Biblical concepts with the right verse or character.',
    instructions: [
      'Choose a few concepts like "faith," "hope," or "courage".',
      'Ask the group to name a verse or character that matches each concept.',
      'Share answers and encourage brief discussion.',
    ],
    notes: 'A gentle memory exercise for conversation starters.',
  },
  {
    id: 'post-it-prAYER',
    title: 'Post-it Prayer',
    summary: 'Write a prayer topic on a note and collect them for group prayer.',
    instructions: [
      'Give everyone a sticky note or paper slip.',
      'Ask them to write one short prayer topic.',
      'Collect the notes and pray over them together or later.',
    ],
    notes: 'Works well for larger groups seeking shared focus.',
  },
  {
    id: 'question-box',
    title: 'Question Box',
    summary: 'Let the group anonymously submit a faith question to discuss later.',
    instructions: [
      'Provide a box or bowl and blank paper.',
      'Invite people to write one question anonymously.',
      'Read the questions aloud and discuss the most helpful ones.',
    ],
    notes: 'A safe way to surface spiritual curiosity and discussion topics.',
  },
  {
    id: 'role-model-story',
    title: 'Role Model Story',
    summary: 'Share a Bible role model and how their story inspires you.',
    instructions: [
      'Pick a Bible character who inspires you.',
      'Briefly tell their story and why it matters.',
      'Ask others to share a character they admire.',
    ],
    notes: 'Encourages positive role-model discussion grounded in scripture.',
  },
  {
    id: 'light-bulb',
    title: 'Light Bulb',
    summary: 'Share a quick idea of how faith helped you solve a problem.',
    instructions: [
      'Give a short example from your own experience.',
      'Invite others to share one similar moment.',
      'Encourage listening for practical faith applications.',
    ],
    notes: 'Helps people connect faith to everyday life.',
  },
  {
    id: 'word-of-the-day',
    title: 'Word of the Day',
    summary: 'Choose one word that describes your faith today and explain it.',
    instructions: [
      'Ask each person to pick one word (e.g. hope, peace, trust).',
      'Invite them to explain the word in one sentence.',
      'Celebrate the variety of responses and perspectives.',
    ],
    notes: 'A simple way to begin a faith-centered discussion.',
  },
];

export function IceBreakersPanel() {
  const { isOpen, close } = useIceBreakersPanelStore();
  const [selectedItem, setSelectedItem] = useState<IceBreakerItem | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[160] flex items-end justify-end pointer-events-none"
        >
          <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={close} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative w-full md:w-[75vw] md:max-w-[900px] h-[92dvh] md:h-[100dvh] pointer-events-auto flex flex-col shadow-2xl rounded-t-3xl md:rounded-none"
            style={{ background: 'hsl(var(--card))', borderLeft: '1px solid hsl(var(--border))' }}
          >
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 h-14 border-b" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-brand-purple" />
                <div>
                  <div className="text-base font-semibold">Ice-Breakers</div>
                  <p className="text-xs text-muted-foreground">Faith-based social activities and conversation starters.</p>
                </div>
              </div>
              <button onClick={close} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-secondary/70 transition-colors" title="Close">
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{ background: 'hsl(var(--background))' }}>
              <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-3xl border p-4 shadow-sm" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                  <div className="text-sm font-semibold mb-3">Choose an ice-breaker</div>
                  <div className="space-y-2">
                    {ICE_BREAKERS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`w-full text-left rounded-2xl p-3 transition-colors ${selectedItem?.id === item.id ? 'bg-brand-purple/10 border-brand-purple text-brand-purple' : 'bg-secondary/50 hover:bg-secondary'}`}
                        style={{ border: '1px solid transparent' }}
                      >
                        <div className="text-sm font-semibold">{item.title}</div>
                        <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border p-4 shadow-sm" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                  {selectedItem ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-lg font-semibold">{selectedItem.title}</div>
                          <p className="text-xs text-muted-foreground">{selectedItem.summary}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {selectedItem.instructions.map((step, index) => (
                          <div key={index} className="rounded-2xl border p-3" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--secondary))' }}>
                            <div className="text-sm font-semibold mb-1">Step {index + 1}</div>
                            <p className="text-sm leading-6 text-foreground">{step}</p>
                          </div>
                        ))}
                      </div>
                      {selectedItem.notes ? (
                        <div className="rounded-2xl border p-3" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--secondary))' }}>
                          <div className="text-sm font-semibold mb-1">Notes</div>
                          <p className="text-sm text-muted-foreground leading-6">{selectedItem.notes}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Lightbulb className="mx-auto mb-4 w-8 h-8 text-brand-purple" />
                      <p className="text-sm text-muted-foreground">Select an ice-breaker from the list to see instructions and tips.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
