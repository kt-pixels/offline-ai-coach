import { motion } from "framer-motion";

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-shell-gradient px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="
        glass-card
        w-full
        max-w-sm sm:max-w-md lg:max-w-lg
        p-6 sm:p-8
        rounded-2xl
        "
      >
        <p className="panel-title text-xs sm:text-sm tracking-wide">
          Aegis Coach OS
        </p>

        <h1 className="mt-1 font-sans text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-100 leading-tight">
          {title}
        </h1>

        <p className="mt-2 text-sm sm:text-base text-slate-400">{subtitle}</p>

        <div className="mt-6 sm:mt-8">{children}</div>
      </motion.div>
    </div>
  );
}

export default AuthLayout;
