import { type AppType } from "next/dist/shared/lib/utils";
import { env } from "@/env.mjs";
import { api } from "@/utils/api";
import PlausibleProvider from "next-plausible";

import "@/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <PlausibleProvider
      domain="wprs-forecast.org"
      selfHosted={true}
      customDomain={env.NEXT_PUBLIC_PLAUSIBLE_URL}
    >
      <Component {...pageProps} />
    </PlausibleProvider>
  );
};

export default api.withTRPC(MyApp);
