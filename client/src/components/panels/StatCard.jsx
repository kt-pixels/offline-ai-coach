import { motion } from 'framer-motion';

function StatCard({ title, value, hint, tone = 'blue' }) {
  return (
    <motion.article
      className={`stat-card ${tone}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="stat-title">{title}</p>
      <h3>{value}</h3>
      <p className="stat-hint">{hint}</p>
    </motion.article>
  );
}

export default StatCard;
