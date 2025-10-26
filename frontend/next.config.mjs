/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Add WASM file loader
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    // Externals and fallbacks
    config.externals.push('pino-pretty', 'lokijs', 'encoding', 'fastfile', 'readline');

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        'fs': false,
        'net': false,
        'tls': false,
        'crypto': false,
        'readline': false,
        'fastfile': false,
      };
    }

    return config;
  },

  // Ensure proper handling of ESM modules from RAILGUN
  transpilePackages: [
    '@railgun-community/wallet',
    '@railgun-community/shared-models',
    '@railgun-community/poseidon-hash-wasm',
    '@railgun-community/curve25519-scalarmult-wasm',
  ],
};

export default nextConfig;
