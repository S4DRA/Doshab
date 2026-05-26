import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@livekit/components-styles";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { BottomNav } from "@/components/layout/bottom-nav";

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
  description: "A private meeting app foundation for groups, chat, voice, and video.",
  icons: {
    icon: "/doshab/Doshab_svg.svg",
    apple: "/doshab/Doshab_svg.svg",
  },
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
        <div className="min-h-full pb-28">
          <SiteHeader />
          <main className="pt-24">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
