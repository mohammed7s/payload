import { NetworkName, EVMGasType } from '@railgun-community/shared-models';

export const NETWORK_CONFIG = {
  // Ethereum Sepolia Testnet
  [NetworkName.EthereumSepolia]: {
    chain: {
      type: 0, // EVM
      id: 11155111,
    },
    name: NetworkName.EthereumSepolia,
    publicName: 'Ethereum Sepolia',
    shortPublicName: 'Sepolia',
    maxGasPrice: BigInt('0x10000000000'), // 1000 gwei
    supportsV3: true,
    isDevOnlyNetwork: true,
  },
};

export const GAS_ESTIMATE_CONFIG = {
  evmGasType: EVMGasType.Type2, // EIP-1559
  networkName: NetworkName.EthereumSepolia,
};

export const DB_PATH = './db';
export const ARTIFACTS_PATH = './artifacts';
