import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Share_Tech } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { getAccount } from "@/lib/hoyolab/service";
import "./globals.css";

const shareTech = Share_Tech({
  variable: "--font-share-tech",
  weight: "400",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Genshin Build Master",
  description: "Track the Genshin Impact characters you own and plan their builds.",
};

// Safari tints its status bar / toolbar with themeColor (must match --color-bg).
// viewport-fit=cover lets the navbar paint under the notch so content never shows above it.
export const viewport: Viewport = {
  themeColor: "#050000",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Who's signed in (Data Sync), for the navbar. Reads the session cookie, so every page
  // renders per request.
  const account = await getAccount();

  return (
    <html
      lang="en"
      className={`${shareTech.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteNav account={account} />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
