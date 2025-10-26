import Image from "next/image";

interface TokenLogoProps {
  symbol: 'USDC' | 'PYUSD';
  size?: number;
}

export function TokenLogo({ symbol, size = 20 }: TokenLogoProps) {
  if (symbol === 'USDC') {
    return (
      <Image
        src="/usdc-logo.png"
        alt="USDC logo"
        width={size}
        height={size}
        className="rounded-full"
      />
    );
  }

  // PayPal PYUSD logo
  return (
    <Image
      src="/paypal-icon.svg"
      alt="PYUSD logo"
      width={size}
      height={size}
      className="rounded-full"
    />
  );
}
