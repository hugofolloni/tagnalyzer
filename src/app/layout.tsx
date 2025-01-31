import { Barlow_Semi_Condensed } from 'next/font/google';
import './styles/main.scss';
import ClientLayout from './ClientLayout';
import { siteMetadata } from './metadata';

const barlow = Barlow_Semi_Condensed({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-barlow',
});

export const metadata = siteMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={barlow.variable}>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}