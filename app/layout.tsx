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
        url: "/val-logo-social.png",
        width: 1600,
        height: 1600,
        alt: "VAL whale logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "VAL",
    description: valDescription,
    images: ["/val-logo-social.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VAL",
  },
  applicationName: "VAL",
  icons: {
    icon: "/val-icon-512.png",
    apple: "/val-icon-512.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#000080",
};

const themeBootScript = `try{var theme=localStorage.getItem("${DOSHAB_THEME_STORAGE_KEY}");document.documentElement.dataset.theme=${JSON.stringify(
  DOSHAB_THEMES.map((theme) => theme.id),
)}.includes(theme)?theme:"${DEFAULT_DOSHAB_THEME_ID}"}catch{document.documentElement.dataset.theme="${DEFAULT_DOSHAB_THEME_ID}"}`;

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
      <body className="h-screen overflow-hidden bg-background text-foreground">
        <div className="h-screen overflow-hidden">
          <main className="h-screen overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
