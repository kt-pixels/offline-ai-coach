function pickFallback(insights) {
  return insights?.suggestions?.[0] || 'Focus on consistency today: one high-priority task, one workout, one calorie-dense meal.';
}

export function buildCoachReply(input, insights, dashboard) {
  const q = input.toLowerCase();

  if (q.includes('calorie') || q.includes('diet') || q.includes('food')) {
    const deficits = insights?.diet?.deficits || {};
    const foods = insights?.diet?.recommendedFoods?.slice(0, 3) || [];
    const foodText = foods.map((item) => item.name).join(', ');
    return `You are short by about ${Math.round(deficits.calories || 0)} kcal. Prioritize ${foodText || 'oats, rice, and peanut butter'} in your next two meals.`;
  }

  if (q.includes('workout') || q.includes('train') || q.includes('exercise')) {
    const workout = insights?.workout;
    if (!workout) return 'No workout recommendation is available yet. Log one session and retry.';
    return `Run ${workout.title} for ${workout.duration} minutes. Start with ${workout.exercises?.[0]?.name || 'compound moves'} and finish the full set list.`;
  }

  if (q.includes('habit') || q.includes('discipline') || q.includes('streak')) {
    const behavior = insights?.behavior || {};
    return `Discipline score is ${behavior.disciplineScore || 0}/100 with failure risk at ${behavior.failureRisk || 0}%. Tighten morning routine and close one habit before noon.`;
  }

  if (q.includes('plan') || q.includes('today')) {
    const s = insights?.suggestions || [];
    return `Today plan: 1) ${s[0] || 'Hit calorie target'}. 2) ${s[1] || 'Complete key workout'}. 3) ${s[2] || 'Finish top task block'}.`;
  }

  if (q.includes('task') || q.includes('productivity')) {
    const openTasks = (dashboard?.tasks || []).filter((task) => !task.completed).length;
    return `You have ${openTasks} open tasks. Execute the top 3 in 2 focused blocks and avoid context switching.`;
  }

  return pickFallback(insights);
}
