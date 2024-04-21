import { Footer } from "@/components/Footer";
import "@/styles/globals.css";
import Link from "next/link";
import PlausibleProvider from "next-plausible";
import { env } from "@/env.js";
import { Inter } from "next/font/google";
import { type Viewport } from "next";

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

export const viewport: Viewport = { themeColor: "#4ade80" };

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
              </h1>
            </Link>
             {/* Alert */}
             <div className="px-3 md:max-w-3xl">
              <div role="alert" className="alert alert-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 shrink-0 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>

                <span>
                  The forecast is already using the new WPRS formula valid from
                  1st of May. Calculations for events in April with less than
                  109 pilots will be to high.
                </span>
              </div>
            </div>
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
