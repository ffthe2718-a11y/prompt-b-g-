import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { publicApi } from "@/lib/api";
import type { PlatformConfig } from "@/types/salon";

/**
 * Platform-wide public settings (name, support inbox, announcement, whether
 * sign-ups are open). Loaded once so marketing pages, the auth screen and the
 * footer all reflect what a super admin saved in Platform settings.
 */
const FALLBACK: PlatformConfig = {
  platformName: "Velvet Salon Studio",
  supportEmail: "hello@velvetstudio.app",
  announcement: "",
  signupsEnabled: true,
  directoryVisible: true,
  baseDomain: "",
  siteOrigin: "",
  maxUploadMb: 6,
};

const PlatformConfigContext = createContext<PlatformConfig>(FALLBACK);

export function PlatformConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PlatformConfig>(FALLBACK);

  useEffect(() => {
    let alive = true;
    publicApi
      .config()
      .then((data) => {
        if (alive) setConfig({ ...FALLBACK, ...data });
      })
      .catch(() => {
        /* the fallback keeps the marketing site usable */
      });
    return () => {
      alive = false;
    };
  }, []);

  return <PlatformConfigContext.Provider value={config}>{children}</PlatformConfigContext.Provider>;
}

export function usePlatformConfig() {
  return useContext(PlatformConfigContext);
}
