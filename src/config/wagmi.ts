import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { monadMainnet, monadTestnet } from './chains';
import { http } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'Dustr',
  appDescription: 'Helping you clean your wallet, instantly.',
  appUrl: 'https://dustr.app',
  appIcon: 'https://dustr.app/favicon.ico',
  projectId: 'YOUR_PROJECT_ID', // Replaced with WalletConnect Project ID if needed, but not strictly required unless using WC v2 cloud
  chains: [monadMainnet, monadTestnet],
  transports: {
    [monadMainnet.id]: http(),
    [monadTestnet.id]: http(),
  },
});
