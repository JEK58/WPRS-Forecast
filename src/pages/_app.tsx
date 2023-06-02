import { type AppType } from "next/dist/shared/lib/utils";

import { api } from "@/utils/api";

import "@/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  // @ts-expect-error TODO: Check why this error exists in first place…
  return <Component {...pageProps} />;
};

export default api.withTRPC(MyApp);
