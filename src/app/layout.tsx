import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // Choose the weights you need
  variable: '--font-poppins',   // Define a custom CSS variable
});

export const metadata = {
  title: 'My App',
  description: 'Find and display the most listened tags for a Last.fm user.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}