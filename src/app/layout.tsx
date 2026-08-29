import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Revenue Recovery Agent — Razorpay Hackathon (Track 03)',
  description: 'Closed-loop autonomous revenue recovery engine with Hinglish voice outreach, strict stopping rules, and immutable audit trails.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
