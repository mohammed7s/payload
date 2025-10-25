import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo'
    }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
});
