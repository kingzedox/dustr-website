import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseUnits, encodeFunctionData, erc20Abi, formatUnits } from 'viem';
import { Loader2, Check, Wallet, RefreshCcw } from 'lucide-react';
import {
  getContractAddresses,
  dustSweeperAbi,
  quoterV2Abi,
  erc20ReadAbi,
  getKnownTokens,
  EXCLUDED_SYMBOLS,
} from '../config/contract';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Token = {
  address: `0x${string}`;
  symbol: string;
  balance: bigint;
  formattedBalance: string;
  usdValue: number;
  decimals: number;
};

// Dust threshold in USD — tokens worth less than this are shown.
const DUST_THRESHOLD_USD = 1.0;

// USDC has 6 decimals
const USDC_DECIMALS = 6;

// Uniswap V3 fee tier for price quotes (0.30%)
const QUOTE_FEE = 3000;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TokenList() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSweeping, setIsSweeping] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const { DUST_SWEEPER_ADDRESS, USDC_ADDRESS, QUOTER_V2_ADDRESS } = getContractAddresses(publicClient?.chain?.id);

  // ─── Fetch real token balances + USD values via multicall ──────────────

  const loadTokens = useCallback(async () => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      let tokensWithBalance: {
        address: `0x${string}`;
        symbol: string;
        decimals: number;
        balance: bigint;
      }[] = [];

      // Try BlockVision API if API key is provided
      const blockVisionKey = import.meta.env.VITE_BLOCKVISION_API_KEY;
      const isTestnet = publicClient.chain?.id === 10143;
      const bvNetwork = isTestnet ? 'monad-testnet' : 'monad';
      
      let usingBlockVision = false;

      if (blockVisionKey) {
        try {
          const res = await fetch(`/api/blockvision?address=${address}`);
          
          if (res.ok) {
            const data = await res.json();
            if (data.code === 0 && data.result?.data) {
              usingBlockVision = true;
              tokensWithBalance = data.result.data
                .filter((t: any) => !t.isLpToken && parseFloat(t.balance) > 0 && !EXCLUDED_SYMBOLS.has(t.symbol))
                .map((t: any) => ({
                  address: t.contractAddress as `0x${string}`,
                  symbol: t.symbol,
                  decimals: t.decimal,
                  balance: parseUnits(Number(t.balance).toFixed(t.decimal), t.decimal)
                }));
            }
          }
        } catch (e) {
          console.warn('BlockVision fetch failed, falling back to static multicall', e);
        }
      }

      // Fallback: Multicall known tokens if BlockVision wasn't used or failed
      if (!usingBlockVision) {
        const knownTokens = getKnownTokens(publicClient?.chain?.id);
        const balanceCalls = knownTokens.map((token) => ({
          address: token.address,
          abi: erc20ReadAbi,
          functionName: 'balanceOf' as const,
          args: [address] as const,
        }));

        const balanceResults = await publicClient.multicall({
          contracts: balanceCalls,
        } as any);

        for (let i = 0; i < knownTokens.length; i++) {
          const token = knownTokens[i];
          const result = balanceResults[i];

          if (result.status === 'success' && result.result && (result.result as bigint) > 0n) {
            if (!EXCLUDED_SYMBOLS.has(token.symbol)) {
              tokensWithBalance.push({
                ...token,
                balance: result.result as bigint,
              });
            }
          }
        }
      }

      if (tokensWithBalance.length === 0) {
        setTokens([]);
        setSelectedAddresses(new Set());
        setIsLoading(false);
        return;
      }

      // Get USD values via QuoterV2 (simulate token → USDC swaps)
      // Note: If Quoter fails (e.g. no pool), USD value is 0.
      const quoteCalls = tokensWithBalance.map((token) => ({
        address: QUOTER_V2_ADDRESS,
        abi: quoterV2Abi,
        functionName: 'quoteExactInputSingle' as const,
        args: [
          {
            tokenIn: token.address,
            tokenOut: USDC_ADDRESS,
            amountIn: token.balance,
            fee: QUOTE_FEE,
            sqrtPriceLimitX96: 0n,
          },
        ] as const,
      }));

      let quoteResults: any[] = [];
      try {
        quoteResults = await publicClient.multicall({
          contracts: quoteCalls,
        } as any);
      } catch (e) {
        console.warn('Quoter multicall failed', e);
      }

      // ─── DexScreener Pricing ──────────────────────────────────────────────────
      const chunkedAddresses = [];
      for (let i = 0; i < tokensWithBalance.length; i += 30) {
        chunkedAddresses.push(tokensWithBalance.slice(i, i + 30).map(t => t.address).join(','));
      }

      const dexPrices: Record<string, number> = {};
      try {
        for (const chunk of chunkedAddresses) {
          const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${chunk}`);
          if (res.ok) {
            const data = await res.json();
            if (data.pairs) {
              data.pairs.forEach((pair: any) => {
                if (pair.baseToken?.address) {
                  const addr = pair.baseToken.address.toLowerCase();
                  if (!dexPrices[addr] && pair.priceUsd) {
                    dexPrices[addr] = parseFloat(pair.priceUsd);
                  }
                }
              });
            }
          }
        }
      } catch (e) {
        console.warn("Dexscreener fetch failed", e);
      }
      // ──────────────────────────────────────────────────────────────────────────

      // Build the final token list with USD values
      const dustTokens: Token[] = [];

      for (let i = 0; i < tokensWithBalance.length; i++) {
        const token = tokensWithBalance[i];
        const quoteResult = quoteResults[i] || { status: 'failure' };

        let usdValue = 0;
        const dexPrice = dexPrices[token.address.toLowerCase()];
        
        if (dexPrice) {
          const numTokens = Number(formatUnits(token.balance, token.decimals));
          usdValue = numTokens * dexPrice;
        } else if (quoteResult.status === 'success' && quoteResult.result) {
          const amountOut = (quoteResult.result as any)[0] as bigint;
          usdValue = Number(formatUnits(amountOut, USDC_DECIMALS));
        }

        // Only show tokens worth less than the dust threshold
        if (usdValue < DUST_THRESHOLD_USD && usdValue >= 0) {
          dustTokens.push({
            address: token.address,
            symbol: token.symbol,
            balance: token.balance,
            formattedBalance: formatUnits(token.balance, token.decimals),
            usdValue,
            decimals: token.decimals,
          });
        }
      }

      // Sort by USD value descending (most valuable dust first)
      dustTokens.sort((a, b) => b.usdValue - a.usdValue);

      setTokens(dustTokens);
      // Select all dust tokens by default
      setSelectedAddresses(new Set(dustTokens.map((t) => t.address)));
    } catch (err) {
      console.error('Failed to load tokens:', err);
      setErrorMsg('Failed to load tokens. Check your wallet connection.');
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    if (isConnected) {
      loadTokens();
    } else {
      setTokens([]);
      setSelectedAddresses(new Set());
    }
  }, [isConnected, address, loadTokens]);

  // ─── Selection ─────────────────────────────────────────────────────────

  const toggleSelection = (tokenAddress: string) => {
    const newSet = new Set(selectedAddresses);
    if (newSet.has(tokenAddress)) {
      newSet.delete(tokenAddress);
    } else {
      newSet.add(tokenAddress);
    }
    setSelectedAddresses(newSet);
  };

  // ─── Sweep handler — batch approve + sweepDust via EIP-5792 ────────────

  const handleSweep = async () => {
    if (selectedAddresses.size === 0) return;

    const selectedTokens = tokens.filter((t) => selectedAddresses.has(t.address));
    setIsSweeping(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Approve all tokens one by one
      for (const token of selectedTokens) {
        await writeContractAsync({
          address: token.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [DUST_SWEEPER_ADDRESS, token.balance],
        });
      }

      // 2. Call sweepDust
      await writeContractAsync({
        address: DUST_SWEEPER_ADDRESS as `0x${string}`,
        abi: dustSweeperAbi,
        functionName: 'sweepDust',
        args: [
          selectedTokens.map((t) => t.address),
          selectedTokens.map((t) => t.balance),
          0n, // minAmountOut — 0 for hackathon demo
        ],
      });

      const sweptCount = selectedAddresses.size;
      setSuccessMsg(`Swept ${sweptCount} useless token${sweptCount !== 1 ? 's' : ''} into USDC!`);
      setTimeout(loadTokens, 3000);
    } catch (err: any) {
      console.error('Sweep failed:', err);
      if (err.message && !err.message.includes('User rejected')) {
        setErrorMsg('Transaction failed. Check console for details.');
      }
    } finally {
      setIsSweeping(false);
    }
  };
  const totalValue = tokens
    .filter((t) => selectedAddresses.has(t.address))
    .reduce((sum, t) => sum + t.usdValue, 0);

  // ─── Not connected state ──────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex justify-center w-full px-4 sm:px-0">
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="py-3 px-6 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-full font-medium text-sm transition-transform transform active:scale-95 flex items-center"
            >
              <Wallet className="w-5 h-5 mr-3" />
              Connect wallet to view dust
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    );
  }

  // ─── Connected state ──────────────────────────────────────────────────

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-[#0a0a0a] rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-900 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-5 sm:p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-900/50 bg-zinc-50/50 dark:bg-[#080808]">
        <div>
          <h2 className="text-lg sm:text-xl font-display font-medium text-zinc-950 dark:text-zinc-50 tracking-tight">Your Dust</h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Tokens valued under ${DUST_THRESHOLD_USD.toFixed(2)}</p>
        </div>
        <button 
          onClick={loadTokens} 
          disabled={isLoading || isSweeping}
          className="p-2.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors disabled:opacity-50 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Refresh List"
        >
          <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {successMsg && (
        <div className="m-6 p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center text-zinc-950 dark:text-zinc-50 text-sm font-medium">
          <Check className="w-4 h-4 mr-3" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="m-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center text-red-700 dark:text-red-400 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-zinc-400" />
          <p className="text-zinc-500 dark:text-zinc-500 text-sm">Scanning wallet for dust tokens...</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 dark:text-zinc-500 text-sm">No dust tokens found. Your wallet is clean.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-900/50">
            {tokens.map((token) => {
              const isSelected = selectedAddresses.has(token.address);
              // Format balance to a readable number
              const displayBalance = Number(token.formattedBalance) < 0.001
                ? '<0.001'
                : Number(token.formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 4 });

              return (
                <div 
                  key={token.address}
                  onClick={() => toggleSelection(token.address)}
                  className={`flex items-center p-4 md:px-8 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-[#0c0c0c] ${isSelected ? 'bg-zinc-50/50 dark:bg-[#080808]' : ''}`}
                >
                  <div className="mr-6 flex-shrink-0">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-zinc-950 border-zinc-950 dark:bg-white dark:border-white text-white dark:text-black' : 'border-zinc-300 dark:border-zinc-700'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-zinc-950 dark:text-zinc-50 truncate">{token.symbol}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 font-mono mt-0.5">{displayBalance} {token.symbol}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-medium text-zinc-950 dark:text-zinc-50 font-mono">
                      {token.usdValue > 0 ? `$${token.usdValue.toFixed(4)}` : '$0.00'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 md:p-8 border-t border-zinc-100 dark:border-zinc-900/50 bg-zinc-50/50 dark:bg-[#080808]">
            <div className="flex justify-between items-end mb-8">
              <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Selected Value</span>
              <span className="text-2xl font-display font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">${totalValue.toFixed(4)}</span>
            </div>
            
            <button
              onClick={handleSweep}
              disabled={selectedAddresses.size === 0 || isSweeping}
              className="relative w-full py-4 px-6 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-full font-medium text-base transition-transform transform active:scale-[0.99] disabled:opacity-30 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center group"
            >
              {isSweeping ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Sweeping Dust...
                </>
              ) : (
                <>
                  Sweep {selectedAddresses.size} Token{selectedAddresses.size !== 1 ? 's' : ''} → USDC
                </>
              )}
            </button>
            {callsStatus?.status === 'pending' && (
              <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-4 animate-pulse font-mono uppercase tracking-widest">
                Processing via EIP-5792...
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
