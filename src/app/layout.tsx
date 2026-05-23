import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = "https://ssebprc.vercel.app";
const appName = "SSEBPRC";
const title = "SSEBPRC - Space Engineers Blueprint Resource Calculator";
const description =
  "Calculate Space Engineers blueprint block, component, and ingot requirements from bp.sbc files or zipped blueprints. Copy clean name and count lists for planning.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: appName,
  title: {
    default: title,
    template: `%s | ${appName}`,
  },
  description,
  keywords: [
    "SSEBPRC",
    "Space Engineers",
    "Space Engineers blueprint",
    "blueprint resource calculator",
    "Space Engineers components",
    "Space Engineers ingots",
    "bp.sbc",
  ],
  authors: [{ name: "Sami Kamara", url: "https://github.com/SamiKamara" }],
  creator: "Sami Kamara",
  publisher: "Sami Kamara",
  category: "tool",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: appName,
    title,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
