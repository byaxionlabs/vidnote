import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Theo Notes - Actionable Insights from Theo's Videos",
  description: "Extract key takeaways, action items, and insights from Theo's YouTube videos (@t3dotgg). Never miss an important point again.",
  keywords: ["Theo", "t3dotgg", "video notes", "actionable insights", "AI", "productivity", "learning", "Gemini AI", "YouTube"],
  authors: [{ name: "Theo-Notes" }],
  openGraph: {
    title: "Theo-Notes - Actionable Insights from Theo's Videos",
    description: "Extract key takeaways, action items, and insights from Theo's YouTube videos.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Theo-Notes - Actionable Insights from Theo's Videos",
    description: "Extract key takeaways, action items, and insights from Theo's YouTube videos.",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              toastOptions={{
                style: {
                  fontFamily: "var(--font-sans)",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
