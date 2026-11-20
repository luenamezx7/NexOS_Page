'use client';

import { ChevronDown, Check } from 'lucide-react';
import Image from 'next/image';
import { NavigationGlass } from './NavigationGlass';
import { useLocale, type Locale } from '@/lib/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import styles from './LanguageSwitch.module.css';

const languages: { code: Locale; name: string; flag: string }[] = [
  { code: 'pt', name: 'Português', flag: '/flags/br.svg' },
  { code: 'en', name: 'English', flag: '/flags/us.svg' },
  { code: 'es', name: 'Español', flag: '/flags/es.svg' },
];

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  const current = languages.find(language => language.code === locale)!;

  return <DropdownMenu>
    <DropdownMenuTrigger className={styles.switch} data-navigation-glass="control" aria-label={`${locale === 'en' ? 'Select language' : locale === 'es' ? 'Seleccionar idioma' : 'Selecionar idioma'}: ${current.name}`}>
      <NavigationGlass />
      <Image src={current.flag} alt="" width={22} height={16} unoptimized className={styles.flag} />
      <span>{current.code.toUpperCase()}</span>
      <ChevronDown size={13} aria-hidden="true" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className={styles.menu} data-navigation-glass="panel">
      <NavigationGlass variant="panel" />
      <DropdownMenuGroup>
        {languages.map(language => <DropdownMenuItem key={language.code} className={styles.option} onClick={() => setLocale(language.code)} aria-current={locale === language.code ? 'true' : undefined}>
          <Image src={language.flag} alt="" width={22} height={16} unoptimized className={styles.flag} />
          <span>{language.name}</span>
          {locale === language.code && <Check size={15} aria-hidden="true" className={styles.check} />}
        </DropdownMenuItem>)}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
