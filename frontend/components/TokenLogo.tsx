interface TokenLogoProps {
  symbol: 'USDC' | 'PYUSD';
  size?: number;
}

export function TokenLogo({ symbol, size = 20 }: TokenLogoProps) {
  if (symbol === 'USDC') {
    // Circle USDC logo
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#2775CA"/>
        <path d="M20.5 18.75C20.5 21.65 18.65 22.5 15.75 22.5C12.85 22.5 11 21.65 11 18.75V13.25C11 10.35 12.85 9.5 15.75 9.5C18.65 9.5 20.5 10.35 20.5 13.25V18.75Z" fill="white"/>
        <path d="M15.75 19.5C17.68 19.5 18.5 18.93 18.5 17.25V14.75C18.5 13.07 17.68 12.5 15.75 12.5C13.82 12.5 13 13.07 13 14.75V17.25C13 18.93 13.82 19.5 15.75 19.5Z" fill="#2775CA"/>
      </svg>
    );
  }

  // PayPal PYUSD logo
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#003087"/>
      <path d="M13.5 10H18.5C20.43 10 22 11.57 22 13.5C22 15.43 20.43 17 18.5 17H16L15 22H12L13.5 10Z" fill="#009CDE"/>
      <path d="M11.5 13H16.5C18.43 13 20 14.57 20 16.5C20 18.43 18.43 20 16.5 20H14L13 25H10L11.5 13Z" fill="#012169"/>
    </svg>
  );
}
