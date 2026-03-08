import { motion } from 'framer-motion';

function CoachPanel({ insights, nudges }) {
  if (!insights) return null;

  return (
    <motion.section
      className="panel coach-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="panel-head">
        <h2>Adaptive AI Coach</h2>
        <span className="chip">{insights.motivation?.headline}</span>
      </div>

      <p className="lead-line">{insights.motivation?.line}</p>

      <ul className="coach-list">
        {(insights.suggestions || []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="mini-grid">
        <article>
          <h4>Action of the Day</h4>
          <p>{insights.motivation?.actionOfDay}</p>
        </article>
        <article>
          <h4>Progress Signal</h4>
          <p>{insights.motivation?.growthSignal}</p>
        </article>
      </div>

      <h4 className="subhead">UI Pattern Nudges</h4>
      <ul className="coach-list compact">
        {nudges.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </motion.section>
  );
}

export default CoachPanel;
