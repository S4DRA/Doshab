import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  DEFAULT_DOSHAB_PALETTE_ID,
  DEFAULT_DOSHAB_THEME_ID,
  DEFAULT_DOSHAB_THEME_MODE,
} from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const metadataBase = new URL(
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
);

const valDescription =
  "VAL is a Virtual Architecture Layer for private communities, real-time voice rooms, and structured digital spaces.";

export const metadata: Metadata = {
  metadataBase,
  title: "VAL",
  description: valDescription,
  openGraph: {
    title: "VAL",
    description: valDescription,
    images: [
      {
        url: "/brand/val-echo-dark.png",
        width: 1254,
        height: 1254,
        alt: "VAL Echo Sonar logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "VAL",
    description: valDescription,
    images: ["/brand/val-echo-dark.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VAL",
  },
  applicationName: "VAL",
  icons: {
    icon: [
      {
        url: "/brand/val-echo-icon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/brand/val-echo-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/brand/val-echo-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/brand/val-echo-apple-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/brand/val-echo-icon-32.png"],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#08090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-screen antialiased overflow-hidden`}
      data-scroll-behavior="smooth"
      data-mode={DEFAULT_DOSHAB_THEME_MODE}
      data-palette={DEFAULT_DOSHAB_PALETTE_ID}
      data-theme={DEFAULT_DOSHAB_THEME_ID}
      suppressHydrationWarning
    >
      <body
        className="h-screen overflow-hidden bg-background text-foreground"
        suppressHydrationWarning
      >
        <div className="h-screen overflow-hidden">
          <main className="h-screen overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
