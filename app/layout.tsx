import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VidNote - Extract Actionable Insights from YouTube Videos",
  description: "Transform YouTube videos into actionable todo lists. Extract key takeaways, action items, and insights using AI.",
  keywords: ["YouTube", "video notes", "actionable insights", "AI", "productivity", "learning"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="gradient-bg">{children}</body>
    </html>
  );
}
