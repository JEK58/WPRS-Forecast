import { Footer } from "@/components/Footer";
import "@/styles/globals.css";
import Link from "next/link";
import PlausibleProvider from "next-plausible";
import { env } from "@/env.js";
import localFont from "next/font/local";
import { type Viewport } from "next";

const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  display: "swap",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata = {
  title: "WPRS Forecast",
  description:
    "Enables you to forecast the potential world ranking points for paragliding competitions.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = { themeColor: "#4ade80" };

const shouldEnablePlausible = Boolean(env.NEXT_PUBLIC_PLAUSIBLE_SRC);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const page = (
    <div className="flex min-h-screen flex-col bg-linear-to-r from-green-400 to-blue-500 pb-4 text-slate-950 dark:text-slate-100">
      <div className="flex flex-col items-center justify-center space-y-6 px-3 py-6 md:px-4 md:py-8">
        <h1 className="mt-2 text-center text-5xl leading-none font-extrabold tracking-tight text-white drop-shadow-sm sm:text-7xl">
          <Link
            href="/"
            className="inline-block rounded-lg px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            WPRS{" "}
            <span className="block text-green-200 sm:ml-3 sm:inline">
              Forecast
            </span>
          </Link>
        </h1>
        {/* Alert */}
        {/* <div className="px-3 md:max-w-3xl">
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
              The forecast is already using the new WPRS formula valid
              from 1st of May. Calculations for events in April with less
              than 109 pilots will be to high.
            </span>
          </div>
        </div> */}
        {children}
      </div>
      <Footer />
    </div>
  );

  return (
    <html lang="en">
      <body className={`font-sans antialiased ${inter.variable}`}>
        {shouldEnablePlausible ? (
          <PlausibleProvider>{page}</PlausibleProvider>
        ) : (
          page
        )}
      </body>
    </html>
  );
}
