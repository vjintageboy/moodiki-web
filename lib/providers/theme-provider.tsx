'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider wrapper for next-themes
 * Provides dark/light mode switching with system preference detection
 * Theme persists across page refreshes using localStorage
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="theme-preference"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
