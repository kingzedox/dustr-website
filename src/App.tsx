import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { TokenList } from './components/TokenList';
import { VisualStrip } from './components/VisualStrip';
import { DustrLogo } from './components/DustrLogo';
import { Moon, Sun, Github, Twitter } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function App() {
  const { isConnected } = useAccount();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);


  return (
    <div className="min-h-screen selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-black flex flex-col font-sans overflow-x-hidden">
      <header className="border-b border-zinc-200 dark:border-zinc-900 transition-colors duration-500 relative z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DustrLogo className="text-zinc-950 dark:text-zinc-50" />
            <span className="sr-only">DUSTR</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <span>Open sourced at</span>
              <a href="https://github.com/your-username/dustr" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                <Github className="w-4 h-4" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="https://x.com/your_twitter_handle" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                <Twitter className="w-4 h-4" />
                <span className="sr-only">X (Twitter)</span>
              </a>
            </div>
            
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-16 w-full relative z-10 flex flex-col items-center justify-center">
        <div className="text-center mb-8 md:mb-16 relative w-full">
          {/* Abstract graphic lines behind title */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent -z-10 hidden md:block"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-[300px] bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-800 to-transparent -z-10 hidden md:block"></div>
          
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-medium tracking-tighter mb-3 md:mb-8 leading-[1.1] bg-zinc-50 dark:bg-[#050505] inline-block relative z-10 px-4 md:px-8">
            Helping you clean <br className="hidden sm:block"/> your wallet, instantly
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto text-sm sm:text-lg leading-relaxed px-2">
            Dustr's platform finds tokens worth less than $1 and batches their swap approvals into a single, seamless click.
          </p>
        </div>

        <div className="w-full">
          <TokenList />
        </div>
      </main>

      <VisualStrip />
      
      <footer className="text-center py-8 text-zinc-400 dark:text-zinc-600 text-xs mt-auto font-mono uppercase tracking-widest">
        <p>DUSTR • Built for Spark Hackathon</p>
      </footer>
    </div>
  );
}
