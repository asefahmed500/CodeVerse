'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function Providers({ children }: { children: React.ReactNode }) {
  const themeProps: ThemeProviderProps = {
    attribute: 'class',
    defaultTheme: 'dark',
    enableSystem: false,
  };

  return (
    <SessionProvider>
      <ThemeProvider {...themeProps}>{children}</ThemeProvider>
    </SessionProvider>
  );
}
