import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useWorkspace } from "../hooks/useWorkspace";

function SaaSLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loading, error, refresh } = useWorkspace();

  const shellWidth = useMemo(
    () => (collapsed ? "md:pl-24" : "md:pl-72"),
    [collapsed],
  );

  return (
    <div className="min-h-screen bg-shell-gradient bg-panel-950">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed((prev) => !prev)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`min-h-screen transition-all duration-300 ease-in-out ${shellWidth}`}
      >
        <Topbar onOpenMobile={() => setMobileOpen(true)} />

        <main className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pb-8 sm:pb-10 md:pb-12 pt-6 sm:pt-7 md:pt-8 max-w-[1600px] mx-auto">
          {error ? (
            <div className="glass-card mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5">
              <p className="text-sm sm:text-base text-rose-300 leading-relaxed">
                {error}
              </p>

              <button
                className="btn-subtle w-full sm:w-auto"
                type="button"
                onClick={refresh}
              >
                Retry
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="glass-card p-5 sm:p-6 text-sm sm:text-base text-slate-300 rounded-xl">
              Refreshing performance telemetry...
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

export default SaaSLayout;
