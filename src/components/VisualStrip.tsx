import { useMemo } from 'react';

export function VisualStrip() {
  const numBars = 180;
  
  const bars = useMemo(() => {
    return Array.from({ length: numBars }, () => {
      // Randomize whether the top bar is black or white
      const isBlack = Math.random() > 0.5;
      // Vary the width slightly for some visual texture
      const width = Math.random() > 0.85 ? 2 : 1;
      return { isBlack, width };
    });
  }, []);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">
      <div className="w-full h-16 sm:h-32 flex flex-col rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
        <div className="flex-1 flex w-full items-end gap-[1px] px-[1px] pt-[1px] bg-zinc-200 dark:bg-zinc-900">
          {bars.map((bar, i) => (
            <div 
              key={`top-${i}`} 
              className={`h-full transition-colors duration-500 ${bar.isBlack ? 'bg-zinc-950 dark:bg-zinc-100' : 'bg-white dark:bg-zinc-950'}`}
              style={{ flex: bar.width }}
            />
          ))}
        </div>
        <div className="w-full h-[1px] bg-zinc-200 dark:bg-zinc-900" />
        <div className="flex-1 flex w-full items-start gap-[1px] px-[1px] pb-[1px] bg-zinc-200 dark:bg-zinc-900">
          {bars.map((bar, i) => {
            // Usually invert the bottom bar color, but occasionally keep it the same for that glitchy look
            const isBlackBot = Math.random() > 0.2 ? !bar.isBlack : bar.isBlack;
            return (
              <div 
                key={`bot-${i}`} 
                className={`h-full transition-colors duration-500 ${isBlackBot ? 'bg-zinc-950 dark:bg-zinc-100' : 'bg-white dark:bg-zinc-950'}`}
                style={{ flex: bar.width }}
              />
            )
          })}
        </div>
      </div>
    </div>
  );
}
