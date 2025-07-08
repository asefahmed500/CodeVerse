'use client';

import { ThemeProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function Providers({ children }: { children: React.ReactNode }) {
  const themeProps: ThemeProviderProps = {
    attribute: 'class',
    defaultTheme: 'dark',
    enableSystem: false,
  };

  return (
      <ThemeProvider {...themeProps}>{children}</ThemeProvider>
  );
}
