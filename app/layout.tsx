import type { ReactNode } from 'react';

// 根布局 - 由中间件处理重定向，这里只返回 null
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
