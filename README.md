# Dustr Frontend

The frontend client for Dustr — allowing users to seamlessly sweep their wallet dust into USDC on Monad.

**⛓️ Smart Contract Repository:** [dustr](https://github.com/kingzedox/dustr)

## Features

- **Multi-Wallet Support:** Powered by RainbowKit for native support of MetaMask, Backpack, WalletConnect, and more.
- **Dynamic Token Indexing:** Automatically discovers all ERC-20 tokens (including degen and meme coins) in a user's wallet using the **BlockVision API**.
- **EIP-5792 Batching:** Approves all dust tokens and executes the sweep in a single, seamless transaction without annoying pop-ups for every token.
- **Network Support:** Native switching between Monad Mainnet and Monad Testnet for easy testing.
- **Dark Mode Native:** Beautiful UI that automatically syncs with your system preferences.

## Tech Stack

- **React + Vite** for blazing-fast rendering and build times.
- **Tailwind CSS** for modern, responsive styling.
- **Wagmi (v2) + Viem** for robust Web3 interactions.
- **RainbowKit** for wallet management.
- **Lucide React** for beautiful iconography.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root of the `dustr-website` directory:

```env
# Required: BlockVision API Key for indexing user tokens. Get yours at https://dashboard.blockvision.org/
VITE_BLOCKVISION_API_KEY=your_blockvision_api_key
```

### 3. Run Locally

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## How It Works Under The Hood

1. **Wallet connects** → Frontend queries BlockVision API to find all ERC-20 tokens owned by the user.
2. **USD Pricing** → The frontend uses Uniswap V3 `QuoterV2` to simulate token → USDC swaps to price the tokens accurately.
3. **Dust Filtering** → Tokens with a total value of `< $1.00` are presented to the user.
4. **Execution** → Using Wagmi's `useSendCalls` (EIP-5792), the frontend batches `N` token approvals plus `1` `sweepDust()` call to the DustSweeper contract.

## Deployment

The application is completely static and can be deployed to Vercel, Netlify, Render, or any standard web host simply by building the `dist` folder.

## 🛡️ Indexer-less Multicall Architecture

Because Monad Mainnet is a brand-new blockchain, traditional third-party indexers (like BlockVision or Alchemy) are often rate-limited, paywalled, or lagging behind real-time events. To guarantee a perfect, seamless user experience without requiring users to manually paste contract addresses, **Dustr employs an industry-standard Indexer-less Fallback Architecture**.

### How it Works (The Uniswap Approach)
1. **The Massive Token Dictionary**: Dustr bundles a highly optimized JSON dictionary (`monad_tokens.json`) containing the most liquid and verified tokens on Monad.
2. **Dynamic Chunked Multicall**: If the primary indexer fails or hits a paywall limit, Dustr automatically intercepts the failure and falls back to our Token Dictionary.
3. **Lightning Fast On-Chain Queries**: Dustr slices the massive token dictionary into chunks and fires concurrent on-chain `multicall` requests directly to the RPC node. This checks the user's balance for *hundreds of tokens simultaneously* in under a second.

This robust, decentralized architecture ensures Dustr is 100% free to operate, un-paywallable by centralized indexers, and provides a magical "ease of use" experience for finding dust tokens.

### 🤖 Automated Token Discovery (GitHub Actions)
To ensure the Token Dictionary stays perfectly up-to-date as the Monad ecosystem grows, this repository includes an autonomous **GitHub Actions Cron Job**.
- Every 6 hours, GitHub spins up a free cloud server and runs [`scripts/updateTokens.js`](https://github.com/kingzedox/dustr-website/blob/main/scripts/updateTokens.js).
- The script connects to the **GeckoTerminal API** and scrapes up to 50 pages of the newest, most active Monad liquidity pools.
- It extracts the token addresses, symbols, and decimals, deduplicates them, and safely merges them into [`src/config/monad_tokens.json`](https://github.com/kingzedox/dustr-website/blob/main/src/config/monad_tokens.json).
- If new tokens are found, GitHub automatically commits and pushes the updated dictionary, which instantly triggers a Vercel deployment of the live site.
- **Result:** The Dustr fallback indexer gets smarter and expands its token coverage every 6 hours without human intervention!

