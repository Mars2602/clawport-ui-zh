import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // 支持的语言列表
  locales: ['en', 'zh'],
  // 默认语言
  defaultLocale: 'zh',
  // 只在需要时添加 locale 前缀（非默认语言）
  localePrefix: 'as-needed',
});

// 轻量级的导航组件
export const { Link, redirect, usePathname, useRouter, getPathname } = 
  createNavigation(routing);
