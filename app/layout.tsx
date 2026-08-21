import type { Metadata } from "next";
import "../src/styles.css";

export const metadata: Metadata = {
  title: "Crawler Command Interface",
  description: "A live interactive dungeon crawler command interface prototype.",
  other: {
    "codex-preview": "development",
  },
  openGraph: {
    title: "Crawler Command Interface",
    description: "Survival is optional.",
    images: [{ url: "/og.png", width: 1792, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crawler Command Interface",
    description: "Survival is optional.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
