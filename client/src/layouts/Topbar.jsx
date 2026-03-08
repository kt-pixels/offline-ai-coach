import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../hooks/useWorkspace";

function Topbar({ onOpenMobile }) {
  const { user, logout } = useAuth();
  const { nutritionDashboard } = useWorkspace();
  const navigate = useNavigate();

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
    [],
  );

  const calorieText = `${nutritionDashboard?.today?.caloriesConsumed || 0}/${nutritionDashboard?.today?.calorieTarget || 0} kcal`;
  const disciplineText = `${nutritionDashboard?.discipline?.score || 0}/100`;

  return (
    <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 border-b border-slate-800 bg-panel-950/85 px-4 sm:px-6 md:px-8 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3 lg:gap-4">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="btn-subtle md:hidden flex items-center justify-center px-3 py-1.5"
            type="button"
            onClick={onOpenMobile}
          >
            Menu
          </button>

          <div className="min-w-0">
            <p className="panel-title text-xs sm:text-sm truncate">
              AI Workspace
            </p>

            <h2 className="font-sans text-sm sm:text-base lg:text-lg font-semibold text-slate-100 leading-tight truncate">
              Fitness and Life Optimization System
            </h2>
          </div>
        </div>

        {/* METRICS */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-4">
          <div className="rounded-xl border border-slate-700 bg-panel-900/80 px-3 py-2 text-xs sm:text-sm text-slate-300 whitespace-nowrap">
            Today:
            <span className="ml-1 font-semibold text-slate-100">{today}</span>
          </div>

          <div className="rounded-xl border border-slate-700 bg-panel-900/80 px-3 py-2 text-xs sm:text-sm text-slate-300 whitespace-nowrap">
            Calories:
            <span className="ml-1 font-semibold text-emerald-300">
              {calorieText}
            </span>
          </div>

          <div className="rounded-xl border border-slate-700 bg-panel-900/80 px-3 py-2 text-xs sm:text-sm text-slate-300 whitespace-nowrap">
            Discipline:
            <span className="ml-1 font-semibold text-amber-300">
              {disciplineText}
            </span>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block rounded-xl border border-slate-700 bg-panel-900/80 px-3 py-2 text-xs sm:text-sm text-slate-200 whitespace-nowrap">
            {user?.name}
          </div>

          <button
            className="btn-subtle px-3 py-1.5 sm:px-4"
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
