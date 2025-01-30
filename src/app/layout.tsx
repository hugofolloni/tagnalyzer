'use client';

import { Barlow_Semi_Condensed } from 'next/font/google';
import './styles/main.scss';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import Header from './header';

const barlow = Barlow_Semi_Condensed({
  subsets: ['latin'],
  weight: ['400', '700'], // Adapte conforme necessário
  variable: '--font-barlow', // Define uma variável CSS para facilitar o uso
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={barlow.variable}>
      <body>
        <Provider store={store}>
          <Header/>
          {children}
          </Provider>
      </body>
    </html>
  );
}