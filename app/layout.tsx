import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@livekit/components-styles";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Doshab",
  description: "A private meeting app foundation for spaces, chat, voice, and video.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Doshab",
  },
  applicationName: "Doshab",
  icons: {
    icon: "/Doshab_png.png",
    apple: "/Doshab_png.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#060807",
};

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
            __html: `try{var theme=localStorage.getItem("doshab-theme");document.documentElement.dataset.theme=theme==="light"?"light":"dark"}catch{document.documentElement.dataset.theme="dark"}`,
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
