import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { dismissAnnouncement } from '@/store/index.js';
import { TICKER_ITEMS } from '@/utils/constants.js';

export default function AnnouncementBar() {
  const dispatch = useDispatch();
  const dismissed = useSelector((s) => s.ui.announcementDismissed);
  if (dismissed) return null;

  return (
    <div className="relative bg-ink text-ivory overflow-hidden">
      <div className="flex items-center">
        <div className="flex-1 overflow-hidden">
          <div className="flex whitespace-nowrap ticker-scroll py-2.5 text-mono text-[0.7rem] uppercase tracking-[0.14em]">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="mx-6 flex items-center gap-6">
                <span className="opacity-70">{item}</span>
                <span className="text-ultra">·</span>
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => dispatch(dismissAnnouncement())}
          className="p-2.5 hover:bg-ivory/10 border-l border-ivory/10 transition-colors"
          aria-label="Dismiss announcement"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
