# Dustr Frontend

The frontend client for Dustr — allowing users to seamlessly sweep their wallet dust into USDC on Monad.

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
