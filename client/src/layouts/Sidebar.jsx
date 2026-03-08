import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { label: "Dashboard", path: "/app/dashboard", icon: "DB" },
  { label: "Weight", path: "/app/weight", icon: "WT" },
  { label: "Diet", path: "/app/diet", icon: "DT" },
  { label: "Grocery", path: "/app/grocery-planner", icon: "GR" },
  { label: "Budget Meals", path: "/app/budget-meal-planner", icon: "BM" },
  { label: "Body Analytics", path: "/app/body-analytics", icon: "BA" },
  { label: "Routine", path: "/app/routine-planner", icon: "RT" },
  { label: "Workouts", path: "/app/workouts", icon: "WK" },
  { label: "Habits", path: "/app/habits", icon: "HB" },
  { label: "Tasks", path: "/app/tasks", icon: "TS" },
  { label: "AI Coach", path: "/app/coach", icon: "AI" },
  { label: "Analytics", path: "/app/analytics", icon: "AN" },
  { label: "Simulation", path: "/app/simulation", icon: "FS" },
  { label: "Settings", path: "/app/settings", icon: "ST" },
];

function Sidebar({ collapsed, mobileOpen, onCollapse, onCloseMobile }) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 
        w-64 sm:w-72 
        border-r border-slate-800 
        bg-panel-900/95 backdrop-blur 
        p-4 sm:p-5 
        transition-all duration-300 ease-in-out
        overflow-y-auto
        md:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        ${collapsed ? "md:w-20 lg:w-24" : "md:w-64 lg:w-72"}
        `}
      >
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-start justify-between gap-2">
          <div className={`${collapsed ? "hidden" : "block"} leading-tight`}>
            <p className="panel-title text-xs sm:text-sm tracking-wide">
              Aegis Performance OS
            </p>
            <h1 className="font-sans text-sm sm:text-base lg:text-lg font-semibold text-slate-100">
              Health and Discipline SaaS
            </h1>
          </div>

          <button
            className="btn-subtle flex h-8 w-8 items-center justify-center rounded-md"
            type="button"
            onClick={onCollapse}
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 sm:space-y-2">
          {navItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <NavLink
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `${isActive ? "nav-link nav-link-active" : "nav-link"}
                  flex items-center gap-3
                  rounded-lg
                  px-2 py-2.5
                  text-sm
                  transition-colors
                  `
                }
              >
                <span
                  className="
                  flex-shrink-0
                  inline-flex h-8 w-8
                  items-center justify-center
                  rounded-lg
                  border border-slate-700
                  bg-panel-950
                  text-[11px]
                  font-semibold
                  text-slate-300
                  "
                >
                  {item.icon}
                </span>

                {!collapsed ? (
                  <span className="truncate text-sm sm:text-[15px]">
                    {item.label}
                  </span>
                ) : null}
              </NavLink>
            </motion.div>
          ))}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      ) : null}
    </>
  );
}

export default Sidebar;
