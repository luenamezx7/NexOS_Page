'use client';

import { ScrollFillHeadline } from '@/components/ui/scroll-fill-headline';
import { useLocale } from '@/lib/locale';

export function MiniSitesIntro() {
  const { t } = useLocale();
  return <ScrollFillHeadline id="mini-sites-intro" lines={[t('Um link na bio.'), t('Seu negócio por inteiro.')]} />;
}
