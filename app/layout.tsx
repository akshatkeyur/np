import type { Metadata } from "next";
import "./globals.css";
import EmotionRegistry from "./EmotionRegistry";

export const metadata: Metadata = {
  title: "API Stress Tester — Dashboard",
  description:
    "Test API endpoints with concurrent requests, live monitoring, and detailed logs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <EmotionRegistry>{children}</EmotionRegistry>
      </body>
    </html>
  );
}
