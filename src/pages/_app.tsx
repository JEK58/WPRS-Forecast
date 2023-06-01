import { type AppType } from "next/dist/shared/lib/utils";

import { api } from "@/utils/api";

import "@/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  // TODO: Evaluate
  // @ts-expect-error There should be no error but somehow there is.
  return <Component {...pageProps} />;
};

export default api.withTRPC(MyApp);
