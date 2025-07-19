'use client';

import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { MotionConfig } from "framer-motion"

export function Providers({ children }: { children: React.ReactNode }) {
  const themeProps: ThemeProviderProps = {
    attribute: 'class',
    defaultTheme: 'dark',
    enableSystem: false,
  };

  return (
    <SessionProvider>
      <ThemeProvider {...themeProps}>
        <MotionConfig reducedMotion="user">
            {children}
            <SonnerToaster />
        </MotionConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}
