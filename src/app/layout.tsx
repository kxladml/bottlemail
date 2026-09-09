import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'bottlemail — unsent letters drifting at sea',
  description: 'An Unsent Project clone directed to email addresses. Cast an anonymous letter or log in with your email to discover if any bottles washed ashore for you.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-black font-mono antialiased">
        {children}
      </body>
    </html>
  );
}
