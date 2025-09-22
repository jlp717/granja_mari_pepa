'use client';

import { useScrollToTop } from '@/hooks/use-scroll-to-top';

export const ScrollToTopProvider = () => {
  useScrollToTop();
  return null;
};