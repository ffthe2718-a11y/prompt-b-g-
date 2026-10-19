import { Outlet } from "react-router-dom";
import { Megaphone } from "lucide-react";
import PlatformNavbar from "@/components/platform/PlatformNavbar";
import PlatformFooter from "@/components/platform/PlatformFooter";
import { usePlatformConfig } from "@/context/PlatformConfigContext";

export default function PlatformLayout() {
  const { announcement } = usePlatformConfig();
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background">
      {announcement ? (
        <div className="border-b border-primary/20 bg-primary/[0.06] px-4 py-2 text-center">
          <p className="mx-auto flex max-w-4xl items-center justify-center gap-2 text-[10px] leading-relaxed text-primary">
            <Megaphone className="h-3 w-3 shrink-0" />
            {announcement}
          </p>
        </div>
      ) : null}
      <PlatformNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PlatformFooter />
    </div>
  );
}
