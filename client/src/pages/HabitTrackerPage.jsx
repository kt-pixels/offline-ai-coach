import { useMemo, useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import HabitTimeline from '../components/ui/HabitTimeline';
import StatCard from '../components/ui/StatCard';

function HabitTrackerPage() {
  const { dashboard, insights, actions } = useWorkspace();
  const [habitForm, setHabitForm] = useState({ name: '', category: 'discipline', targetPerDay: 1 });

  const habits = dashboard?.habits || [];

  const createHabit = async (event) => {
    event.preventDefault();
    if (!habitForm.name.trim()) return;
    await actions.createHabit(habitForm);
    setHabitForm({ name: '', category: 'discipline', targetPerDay: 1 });
  };

  const habitScore = useMemo(() => {
    if (!habits.length) return 0;
    const total = habits.reduce((sum, habit) => sum + habit.streak * 8 + habit.longestStreak * 2, 0);
    return Math.round(total / habits.length);
  }, [habits]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Habit Score" value={habitScore} hint="Streak-weighted score" tone="emerald" />
        <StatCard
          label="Discipline Score"
          value={`${insights?.behavior?.disciplineScore || 0}/100`}
          hint="From behavior engine"
          tone="blue"
        />
        <StatCard
          label="Missed Habits"
          value={insights?.behavior?.missedHabits?.length || 0}
          hint="Recent lapse detector"
          tone="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <form className="glass-card space-y-3 p-4" onSubmit={createHabit}>
          <p className="panel-title">Create Habit</p>
          <input
            className="input-base"
            placeholder="Habit name"
            value={habitForm.name}
            onChange={(e) => setHabitForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="input-base"
              value={habitForm.category}
              onChange={(e) => setHabitForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              <option value="discipline">Discipline</option>
              <option value="workout">Workout</option>
              <option value="nutrition">Nutrition</option>
              <option value="sleep">Sleep</option>
              <option value="productivity">Productivity</option>
            </select>
            <input
              className="input-base"
              type="number"
              min="1"
              value={habitForm.targetPerDay}
              onChange={(e) => setHabitForm((prev) => ({ ...prev, targetPerDay: Number(e.target.value || 1) }))}
            />
          </div>
          <button className="btn-primary" type="submit">
            Add Habit
          </button>
        </form>

        <section className="glass-card p-4">
          <p className="panel-title">Habit Engine</p>
          <div className="mt-3 space-y-2">
            {habits.map((habit) => (
              <div key={habit._id} className="rounded-xl border border-slate-700 bg-panel-950/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{habit.name}</p>
                    <p className="text-xs text-slate-400">
                      {habit.category} | streak {habit.streak} | best {habit.longestStreak}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-subtle" type="button" onClick={() => actions.toggleHabit(habit._id)}>
                      Mark Done
                    </button>
                    <button className="btn-subtle" type="button" onClick={() => actions.deleteHabit(habit._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <HabitTimeline items={dashboard?.charts?.habitTimeline || []} />
    </div>
  );
}

export default HabitTrackerPage;
