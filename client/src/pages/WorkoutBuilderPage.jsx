import { useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import ChartCard from '../components/ui/ChartCard';
import StatCard from '../components/ui/StatCard';

function WorkoutBuilderPage() {
  const { insights, dashboard, actions } = useWorkspace();
  const [loading, setLoading] = useState(false);

  const workout = insights?.workout;

  const logWorkout = async () => {
    if (!workout) return;
    setLoading(true);
    try {
      await actions.createWorkout({
        title: workout.title,
        level: dashboard?.profile?.fitnessLevel || 'beginner',
        duration: workout.duration,
        intensity: workout.intensity,
        focus: workout.focus,
        exercises: workout.exercises
      });
    } finally {
      setLoading(false);
    }
  };

  const consistency = (() => {
    const recent = (dashboard?.recentWorkouts || []).slice(0, 7);
    if (!recent.length) return 0;
    return Math.round((recent.filter((w) => w.completed).length / recent.length) * 100);
  })();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Focus" value={workout?.focus || 'full-body'} hint="Auto-selected by AI" tone="blue" />
        <StatCard label="Duration" value={`${workout?.duration || 0} min`} hint="Session length" tone="emerald" />
        <StatCard label="Consistency" value={`${consistency}%`} hint="Last 7 workouts" tone="amber" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Dynamic Workout Builder"
          subtitle={workout?.reason}
          action={
            <button className="btn-primary" type="button" onClick={logWorkout} disabled={loading}>
              {loading ? 'Logging...' : 'Log Suggested Workout'}
            </button>
          }
        >
          <div className="space-y-3">
            {(workout?.exercises || []).map((exercise) => (
              <div key={exercise.name} className="rounded-xl border border-slate-700 bg-panel-950/50 p-3">
                <p className="font-medium text-slate-100">{exercise.name}</p>
                <p className="text-xs text-slate-400">
                  {exercise.sets} sets x {exercise.reps} reps
                </p>
              </div>
            ))}
          </div>
        </ChartCard>

        <section className="glass-card p-4">
          <p className="panel-title">Recent Workout Logs</p>
          <div className="mt-3 space-y-2">
            {(dashboard?.recentWorkouts || []).slice(0, 8).map((log) => (
              <div key={log._id} className="rounded-xl border border-slate-700 bg-panel-950/50 p-3">
                <p className="text-sm font-medium text-slate-100">{log.title}</p>
                <p className="text-xs text-slate-400">
                  {log.duration} min | {log.level} | Intensity {log.intensity}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

export default WorkoutBuilderPage;
