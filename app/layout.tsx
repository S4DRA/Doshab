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

export const metadata: Metadata = {
  metadataBase,
  title: "Doshab",
  description: "A private meeting app foundation for spaces, chat, voice, and video.",
  openGraph: {
    title: "Doshab",
    description: "A private meeting app foundation for spaces, chat, voice, and video.",
    images: [
      {
        url: "/doshab-logo-social.png",
        width: 1254,
        height: 1254,
        alt: "Doshab logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Doshab",
    description: "A private meeting app foundation for spaces, chat, voice, and video.",
    images: ["/doshab-logo-social.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Doshab",
  },
  applicationName: "Doshab",
  icons: {
    icon: "/doshab-icon-512.png",
    apple: "/doshab-apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#060807",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootScript,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <div className="min-h-full">
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
