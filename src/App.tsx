import { useConnect, useDisconnect, useAccount } from 'wagmi';
import { TokenList } from './components/TokenList';
import { VisualStrip } from './components/VisualStrip';
import { DustrLogo } from './components/DustrLogo';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function App() {
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Pick the first available connector (usually injected/MetaMask)
  const connector = connectors[0];

  return (
    <div className="min-h-screen selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-black flex flex-col font-sans overflow-x-hidden">
      <header className="border-b border-zinc-200 dark:border-zinc-900 transition-colors duration-500 relative z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DustrLogo className="text-zinc-950 dark:text-zinc-50" />
            <span className="sr-only">DUSTR</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isConnected ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button 
                  onClick={() => disconnect()}
                  className="p-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector })}
                className="px-6 py-2.5 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-full text-sm font-medium hover:scale-105 transition-transform"
              >
                Connect Wallet
              </button>
            )}
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
