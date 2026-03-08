import { motion } from 'framer-motion';

function StatCard({ label, value, hint, tone = 'blue', children }) {
  const toneMap = {
    blue: 'from-linear-500/25 to-linear-600/5 border-linear-500/30',
    emerald: 'from-emerald-500/25 to-emerald-600/5 border-emerald-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/30'
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card bg-gradient-to-br p-4 ${toneMap[tone] || toneMap.blue}`}
    >
      <p className="panel-title">{label}</p>
      <p className="mt-2 font-sans text-2xl font-semibold text-slate-100">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </motion.article>
  );
}

export default StatCard;
