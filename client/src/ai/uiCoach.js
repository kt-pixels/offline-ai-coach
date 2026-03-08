export function generateUiNudges(dashboard, insights) {
  const nudges = [];
  const stats = dashboard?.stats || {};
  const behavior = insights?.behavior || {};

  if ((stats.todaySleep || 0) < 7) {
    nudges.push('Sleep debt detected. Target 7.5+ hours tonight to protect recovery.');
  }

  if ((stats.taskCompletionRate || 0) < 60) {
    nudges.push('Task execution is low. Reduce open tasks and finish top 3 before noon.');
  }

  if ((behavior.failureRisk || 0) > 70) {
    nudges.push('High failure risk pattern detected. Run the 20-minute reset protocol today.');
  }

  if (!nudges.length) {
    nudges.push('System stable. Push one extra growth action today.');
  }

  return nudges.slice(0, 3);
}
