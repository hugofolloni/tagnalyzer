'use client';

import { Poppins } from 'next/font/google';
import './styles/main.scss';
import { Provider } from 'react-redux';
import { store } from '../store/store';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <Provider store={store}>{children}</Provider>
      </body>
    </html>
  );
}