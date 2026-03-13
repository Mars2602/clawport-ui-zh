import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-lg opacity-70 mb-6">Page not found</p>
      <Link
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
      >
        {t('back')}
      </Link>
    </div>
  );
}
