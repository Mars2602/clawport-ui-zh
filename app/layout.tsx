import { redirect } from 'next/navigation';

// 根布局重定向到默认语言
export default function RootLayout() {
  redirect('/zh');
}
