import { Outlet } from "react-router-dom";
import PlatformNavbar from "@/components/platform/PlatformNavbar";
import PlatformFooter from "@/components/platform/PlatformFooter";

export default function PlatformLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background">
      <PlatformNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PlatformFooter />
    </div>
  );
}
