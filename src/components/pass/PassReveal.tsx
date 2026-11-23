import { useRef } from 'react';
import { Home, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { EventPass } from './EventPass.tsx';
import { PassDownload } from './PassDownload.tsx';
import type {
  EventSettings,
  RegistrationSubmitResponse,
} from '../../types/database.types.ts';

export function PassReveal({
  registration,
  settings,
  onViewPoster,
  onBackHome,
}: {
  registration: RegistrationSubmitResponse;
  settings: EventSettings;
  onViewPoster: () => void;
  onBackHome: () => void;
}) {
  const passRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-5 py-10 sm:px-8">
      <div
        style={{ perspective: 1400 }}
        className="flex w-full justify-center"
      >
        <motion.div
          initial={{ opacity: 0, rotateY: -55, scale: 0.94 }}
          animate={{ opacity: 1, rotateY: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex w-full max-w-[400px] justify-center"
        >
          <EventPass
            ref={passRef}
            data={registration}
            settings={settings}
          />
        </motion.div>
      </div>

      <div className="mt-7 w-full max-w-[400px] space-y-3.5">
        <PassDownload
          passRef={passRef}
          passNumber={registration.pass_number}
          eventName={settings.event_name}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onViewPoster}
            className="btn-craft-secondary inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold whitespace-nowrap"
          >
            <ImageIcon className="h-4 w-4 text-[#8e1b1b]" />
            <span>Back to Event Poster</span>
          </button>

          <button
            type="button"
            onClick={onBackHome}
            className="btn-craft-secondary inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold whitespace-nowrap"
          >
            <Home className="h-4 w-4 text-[#4a4642]" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
