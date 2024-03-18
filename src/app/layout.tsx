import { Footer } from "@/components/Footer";
import "@/styles/globals.css";
import Link from "next/link";
import PlausibleProvider from "next-plausible";
import { env } from "@/env.js";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "WPRS Forecast",
  description:
    "Enables you to forecast the potential world ranking points for paragliding competitions.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <PlausibleProvider
          domain="wprs-forecast.org"
          selfHosted={true}
          customDomain={env.NEXT_PUBLIC_PLAUSIBLE_URL}
        />
      </head>
      <body className={`font-sans ${inter.variable}`}>
        <div className="flex min-h-screen flex-col bg-gradient-to-r from-green-400 to-blue-500 pb-4">
          <div className="flex flex-col items-center justify-center space-y-8 px-0 py-4 md:px-4">
            <Link href="/">
              <h1 className="mt-6 text-6xl font-bold text-white sm:text-center sm:text-[5rem] sm:leading-tight">
                WPRS
                <span className="block text-green-300 sm:inline">Forecast</span>
                <span className="block text-right text-sm tracking-normal sm:inline sm:text-left">
                  beta
                </span>
              </h1>
            </Link>
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
