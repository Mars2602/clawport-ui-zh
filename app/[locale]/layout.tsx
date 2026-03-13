import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getMessages } from 'next-intl/server';
import '../globals.css';
import { ThemeProvider } from '../providers';
import { SettingsProvider } from '../settings-provider';
import { Sidebar } from '@/components/Sidebar';
import { DynamicFavicon } from '@/components/DynamicFavicon';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { LiveStreamWidget } from '@/components/LiveStreamWidget';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // 确保传入的 locale 是有效的
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // 获取当前语言的翻译消息
  const messages = await getMessages();

  return (
    <html lang={locale} data-theme="dark" suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <SettingsProvider>
              <DynamicFavicon />
              <OnboardingWizard />
              <LiveStreamWidget />
              <div
                className="flex h-screen overflow-hidden"
                style={{ background: 'var(--bg)' }}
              >
                {/* Client-side shell handles both desktop sidebar + mobile */}
                <Sidebar />

                {/* Main content */}
                <main className="flex-1 overflow-hidden relative">
                  {/* Mobile spacer for fixed header */}
                  <div className="md:hidden" style={{ height: '48px', flexShrink: 0 }} />
                  {children}
                </main>
              </div>
            </SettingsProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
