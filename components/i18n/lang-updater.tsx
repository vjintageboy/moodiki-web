'use client';

import { useEffect } from 'react';

/**
 * LangUpdater - Client Component
 * 
 * Synchronizes the <html> lang attribute with the current locale.
 * This is used to resolve the '<html> cannot be a child of <body>' error
 * when nesting layouts for next-intl.
 */
export function LangUpdater({ locale }: { locale: string }) {
  useEffect(() => {
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
