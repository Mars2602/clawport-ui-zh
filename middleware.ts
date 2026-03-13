import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // 匹配所有路径，除了静态文件和 API
  matcher: [
    '/',
    '/(zh|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
