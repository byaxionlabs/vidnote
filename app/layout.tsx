import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VidNote - Transform YouTube Videos Into Actionable Insights",
  description: "Paste any YouTube URL and let AI extract key takeaways, action items, and insights. Never miss an important point from your favorite videos again.",
  keywords: ["YouTube", "video notes", "actionable insights", "AI", "productivity", "learning", "Gemini AI", "video summarizer"],
  authors: [{ name: "VidNote" }],
  openGraph: {
    title: "VidNote - Transform YouTube Videos Into Actionable Insights",
    description: "Paste any YouTube URL and let AI extract key takeaways, action items, and insights.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VidNote - Transform YouTube Videos Into Actionable Insights",
    description: "Paste any YouTube URL and let AI extract key takeaways, action items, and insights.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <meta name="theme-color" content="#07080c" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="gradient-bg">{children}</body>
    </html>
  );
}
