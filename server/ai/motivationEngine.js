// Motivation engine that maps risk state to actionable messaging.
const HIGH_RISK_LINES = [
  'Your system does not need perfect days. It needs a controlled comeback today.',
  'Discipline starts with one completed action. Execute your first task now.',
  'You are one focused hour away from rebuilding momentum.'
];

const STABLE_LINES = [
  'Consistency is compounding. Protect this rhythm.',
  'Your execution trend is strong. Add one stretch goal today.',
  'Momentum is your edge. Keep your standards high.'
];

function generateMotivation({ behavior, progress }) {
  const isHighRisk = behavior.failureRisk >= 70;
  const pool = isHighRisk ? HIGH_RISK_LINES : STABLE_LINES;

  const line = pool[Math.floor(Math.random() * pool.length)];

  const actionOfDay = isHighRisk
    ? 'Complete a 20-minute workout + finish your top priority task before noon.'
    : 'Add one extra growth action: 300 calories and one high-focus sprint.';

  const growthSignal =
    progress.status === 'under-target'
      ? 'Weight trend is below target. Food timing and consistency are the bottleneck.'
      : progress.status === 'too-fast'
      ? 'Weight is rising quickly. Prioritize protein quality and training quality.'
      : 'Body and discipline trends are aligned. Keep repeating the process.';

  return {
    headline: isHighRisk ? 'Recovery Mode Active' : 'Momentum Mode Active',
    line,
    actionOfDay,
    growthSignal
  };
}

module.exports = {
  generateMotivation
};

