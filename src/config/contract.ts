// ─────────────────────────────────────────────────────────────────────────────
// DustSweeper contract config — Monad Mainnet
// ─────────────────────────────────────────────────────────────────────────────

export const getContractAddresses = (chainId?: number) => {
  // Testnet
  if (chainId === 10143) {
    return {
      DUST_SWEEPER_ADDRESS: '0x2BaF31E8e9F6811521f7466d55588cA3B452C95a' as `0x${string}`,
      USDC_ADDRESS: '0x1af27907bcC2c5dF38EB302DA37851D2CC6D495d' as `0x${string}`,
      WMON_ADDRESS: '0x60f7A29918E191a6E407f30AFD066f96c7bd6FF8' as `0x${string}`,
      QUOTER_V2_ADDRESS: '0xe42C1B5B1F1e9BEdfd9824e9d39a96ebF654823F' as `0x${string}`,
    };
  }

  // Mainnet (default)
  return {
    DUST_SWEEPER_ADDRESS: '0x10a3017131670bfF89d7a28C484bD58c4b25e44e' as `0x${string}`, // TODO: Update after mainnet deploy
    USDC_ADDRESS: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603' as `0x${string}`,
    WMON_ADDRESS: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A' as `0x${string}`,
    QUOTER_V2_ADDRESS: '0x661e93cca42afacb172121ef892830ca3b70f08d' as `0x${string}`,
  };
};

/** DustSweeper ABI — only the functions the frontend needs. */
export const dustSweeperAbi = [
  {
    name: 'sweepDust',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokensIn', type: 'address[]' },
      { name: 'amountsIn', type: 'uint256[]' },
      { name: 'minAmountOut', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

/** QuoterV2 ABI — for estimating token→USDC prices. */
export const quoterV2Abi = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
] as const;

/** ERC-20 balanceOf + decimals ABI for multicall reads. */
export const erc20ReadAbi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Known Monad tokens — add more as the ecosystem grows.
// The contract addresses below are sourced from public aggregators.
// Always verify on monadscan.com before adding new tokens.
// ─────────────────────────────────────────────────────────────────────────────

export type KnownToken = {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
};

export const getKnownTokens = (chainId?: number): KnownToken[] => {
  if (chainId === 10143) {
    return [
      { address: '0x3E88edB0294147257a7f49cf26c0dEE7F587bA3c', symbol: 'PEPE', decimals: 18 },
      { address: '0xeFceaff1E848EE8Fcba6e55a40b2ca2c57E33Ab9', symbol: 'DOGE', decimals: 18 },
    ];
  }

  return [
    // ── Stablecoins / blue chips ──
    { address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603', symbol: 'USDC',   decimals: 6  },
    { address: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A', symbol: 'WMON',   decimals: 18 },

    // ── Monad community tokens ──
    { address: '0x350035555E10d9AfAF1566AaebfCeD5BA6C27777', symbol: 'CHOG',   decimals: 18 },
    { address: '0x29fF09Dcd83ec33CE5BE1E388AE98C7A7F9faB07', symbol: 'DAK',    decimals: 18 },
    { address: '0x43cf5407bda1400498B8064D50a7e17528d87777', symbol: 'JAMES',  decimals: 18 },
  ];
};

// Tokens we should never show as "dust" (user probably wants to keep these).
export const EXCLUDED_SYMBOLS = new Set(['USDC', 'WMON', 'MON']);
