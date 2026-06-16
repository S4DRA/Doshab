import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@livekit/components-styles";
import "./globals.css";
import {
  DEFAULT_DOSHAB_THEME_ID,
  DOSHAB_THEMES,
  DOSHAB_THEME_STORAGE_KEY,
} from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        url: "/val-logo-social.jpg",
        width: 4096,
        height: 4096,
        alt: "VAL whale logo on a light background",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "VAL",
    description: valDescription,
    images: ["/val-logo-social.jpg"],
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
        url: "/val-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/val-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/val-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: ["/val-icon-192.png"],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#08090b",
};

const DARK_CHROME_COLOR = "#08090b";
const LIGHT_CHROME_COLOR = "#f7f7f5";

const themeBootScript = `try{var allowed=${JSON.stringify(
  DOSHAB_THEMES.map((theme) => theme.id),
)};var theme=localStorage.getItem("${DOSHAB_THEME_STORAGE_KEY}");var resolved=allowed.includes(theme)?theme:"${DEFAULT_DOSHAB_THEME_ID}";if(theme!==resolved){localStorage.setItem("${DOSHAB_THEME_STORAGE_KEY}",resolved)}document.documentElement.dataset.theme=resolved;var meta=document.querySelector('meta[name="theme-color"]');if(meta){meta.setAttribute("content",resolved==="light"?"${LIGHT_CHROME_COLOR}":"${DARK_CHROME_COLOR}")}}catch{document.documentElement.dataset.theme="${DEFAULT_DOSHAB_THEME_ID}";var meta=document.querySelector('meta[name="theme-color"]');if(meta){meta.setAttribute("content","${DARK_CHROME_COLOR}")}}`;

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
      data-theme={DEFAULT_DOSHAB_THEME_ID}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootScript,
          }}
        />
      </head>
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
