'use client';

import { Inter } from 'next/font/google';
import './styles/main.scss';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import Header from './header';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Provider store={store}>
          <Header/>
          {children}
          </Provider>
      </body>
    </html>
  );
}