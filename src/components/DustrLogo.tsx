import { Sparkles } from 'lucide-react';

export function DustrLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-start select-none ${className}`}>
      <div className="relative inline-flex items-center font-display font-bold text-3xl tracking-tighter text-zinc-950 dark:text-zinc-50">
        <span className="relative z-10">Dustr</span>
        
        {/* Custom ligature joining 't' and 'r' */}
        <span 
          className="absolute bg-current z-0"
          style={{
            top: '44%',
            left: '73%',
            width: '16%',
            height: '11%',
            borderRadius: '2px'
          }}
        />
      </div>
      
      {/* Small sparkle accent */}
      <svg 
        className="w-4 h-4 ml-0.5 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
      </svg>
    </div>
  );
}

