import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // 匹配带语言前缀的路径，排除根路径、静态文件和 API
  matcher: [
    '/(zh|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*|^/$).*)',
  ],
};
