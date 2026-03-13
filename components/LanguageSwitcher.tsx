'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
];

export function LanguageSwitcher() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm opacity-70">{t('language')}</span>
      <div className="flex gap-1">
        {languages.map((lang) => (
          <Button
            key={lang.code}
            variant="ghost"
            size="sm"
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              'px-3 py-1 text-sm rounded-md transition-colors',
              locale === lang.code
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            {lang.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
