import type { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Show } from '@clerk/react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Gates a page behind Clerk sign-in. Multiplayer/duel writes are
 * authenticated server-side, so any page that hosts, joins, or answers in a
 * session needs the user signed in first — otherwise they'd hit a 401 mid
 * flow with no explanation.
 */
export function AuthGate({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const [, setLocation] = useLocation();

  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <div className="p-6 max-w-lg mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center mb-5 shadow-lg shadow-brand-purple/30">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold mb-3">{title}</h1>
          <p className="text-muted-foreground text-lg mb-8">{description}</p>
          <div className="flex gap-3 justify-center">
            <Button size="lg" onClick={() => setLocation('/sign-in')} className="rounded-full px-8">
              Sign in
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation('/sign-up')} className="rounded-full px-8">
              Create account
            </Button>
          </div>
        </div>
      </Show>
    </>
  );
}
