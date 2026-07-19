import { useState, useMemo, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useSendCalls, useCallsStatus } from 'wagmi';
import { parseUnits, encodeFunctionData, erc20Abi } from 'viem';
import { Loader2, Check, Wallet, RefreshCcw } from 'lucide-react';

const DUSTR_CONTRACT = '0x9999999999999999999999999999999999999999';

const dustrAbi = [
  {
    name: 'sweepDust',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokens', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'minOut', type: 'uint256' }
    ],
    outputs: []
  }
];

type Token = {
  tokenAddress: string;
  symbol: string;
  balance: string;
  usdValue: number;
  decimals: number;
};

// Mock API Call
const fetchUserTokens = async (address: string): Promise<Token[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { tokenAddress: '0x1111111111111111111111111111111111111111', symbol: 'SHIB', balance: '1000000', usdValue: 2.50, decimals: 18 },
        { tokenAddress: '0x2222222222222222222222222222222222222222', symbol: 'PEPE', balance: '500000', usdValue: 4.20, decimals: 18 },
        { tokenAddress: '0x3333333333333333333333333333333333333333', symbol: 'LINK', balance: '2.5', usdValue: 35.00, decimals: 18 },
        { tokenAddress: '0x4444444444444444444444444444444444444444', symbol: 'DOGE', balance: '15', usdValue: 1.20, decimals: 18 },
        { tokenAddress: '0x5555555555555555555555555555555555555555', symbol: 'FLOKI', balance: '0', usdValue: 0.00, decimals: 18 },
      ]);
    }, 1000);
  });
};

export function TokenList() {
  const { address, isConnected } = useAccount();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { sendCalls, data: callsData, isPending: isSendingCalls } = useSendCalls();
  const callsId = (typeof callsData === 'string' ? callsData : (callsData as any)?.id) as string | undefined;

  const { data: callsStatus } = useCallsStatus({
    id: callsId || '',
    query: {
      enabled: !!callsId,
      refetchInterval: (data) => (data?.state.data?.status === 'pending' ? 2000 : false),
    },
  });

  const loadTokens = async () => {
    if (!address) return;
    setIsLoading(true);
    setSuccessMsg('');
    const data = await fetchUserTokens(address);
    // Filter tokens worth less than $1.00 and balance > 0
    const dustTokens = data.filter(t => t.usdValue < 1.00 && parseFloat(t.balance) > 0);
    setTokens(dustTokens);
    // Select all by default
    setSelectedAddresses(new Set(dustTokens.map(t => t.tokenAddress)));
    setIsLoading(false);
  };

  useEffect(() => {
    if (isConnected) {
      loadTokens();
    } else {
      setTokens([]);
      setSelectedAddresses(new Set());
    }
  }, [isConnected, address]);

  const toggleSelection = (tokenAddress: string) => {
    const newSet = new Set(selectedAddresses);
    if (newSet.has(tokenAddress)) {
      newSet.delete(tokenAddress);
    } else {
      newSet.add(tokenAddress);
    }
    setSelectedAddresses(newSet);
  };

  const handleSweep = () => {
    if (selectedAddresses.size === 0) return;

    const selectedTokens = tokens.filter(t => selectedAddresses.has(t.tokenAddress));
    
    // Construct batch of transactions
    const calls = selectedTokens.flatMap(token => {
      return {
        to: token.tokenAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [DUSTR_CONTRACT, parseUnits(token.balance, token.decimals)]
        }),
        value: 0n
      };
    });

    const sweepCall = {
      to: DUSTR_CONTRACT as `0x${string}`,
      data: encodeFunctionData({
        abi: dustrAbi,
        functionName: 'sweepDust',
        args: [
          selectedTokens.map(t => t.tokenAddress as `0x${string}`),
          selectedTokens.map(t => parseUnits(t.balance, t.decimals)),
          0n
        ]
      }),
      value: 0n
    };

    calls.push(sweepCall);

    sendCalls({ calls });
  };

  // Watch for transaction completion
  useEffect(() => {
    if (callsStatus?.status === 'success') {
      const sweptCount = selectedAddresses.size;
      setSuccessMsg(`Swept ${sweptCount} useless tokens into USDC!`);
      // Re-fetch after 3 seconds to let backend catch up
      setTimeout(loadTokens, 3000);
    }
  }, [callsStatus?.status]);

  const isSweeping = isSendingCalls || callsStatus?.status === 'pending';
  const totalValue = tokens.filter(t => selectedAddresses.has(t.tokenAddress)).reduce((sum, t) => sum + t.usdValue, 0);

  const { connectors, connect } = useConnect();
  const connector = connectors[0];

  if (!isConnected) {
    return (
      <div className="flex justify-center w-full px-4 sm:px-0">
        <button
          onClick={() => connect({ connector })}
          className="flex items-center justify-center w-full sm:w-auto px-6 py-4 sm:px-8 sm:py-4 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-full text-sm sm:text-base font-medium hover:scale-105 transition-transform shadow-sm"
        >
          <Wallet className="w-5 h-5 mr-3" />
          Connect wallet to view dust
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-[#0a0a0a] rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-900 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-5 sm:p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-900/50 bg-zinc-50/50 dark:bg-[#080808]">
        <div>
          <h2 className="text-lg sm:text-xl font-display font-medium text-zinc-950 dark:text-zinc-50 tracking-tight">Your Dust</h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Tokens valued under $1.00</p>
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

      {tokens.length === 0 && !isLoading ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 dark:text-zinc-500 text-sm">No dust tokens found. Your wallet is clean.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-900/50">
            {tokens.map((token) => {
              const isSelected = selectedAddresses.has(token.tokenAddress);
              return (
                <div 
                  key={token.tokenAddress}
                  onClick={() => toggleSelection(token.tokenAddress)}
                  className={`flex items-center p-4 md:px-8 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-[#0c0c0c] ${isSelected ? 'bg-zinc-50/50 dark:bg-[#080808]' : ''}`}
                >
                  <div className="mr-6 flex-shrink-0">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-zinc-950 border-zinc-950 dark:bg-white dark:border-white text-white dark:text-black' : 'border-zinc-300 dark:border-zinc-700'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-zinc-950 dark:text-zinc-50 truncate">{token.symbol}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 font-mono mt-0.5">{token.balance} {token.symbol}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-medium text-zinc-950 dark:text-zinc-50 font-mono">$\{token.usdValue.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 md:p-8 border-t border-zinc-100 dark:border-zinc-900/50 bg-zinc-50/50 dark:bg-[#080808]">
            <div className="flex justify-between items-end mb-8">
              <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Selected Value</span>
              <span className="text-2xl font-display font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">$\{(totalValue).toFixed(2)}</span>
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
                  Sweep {selectedAddresses.size} Token{selectedAddresses.size !== 1 ? 's' : ''}
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
