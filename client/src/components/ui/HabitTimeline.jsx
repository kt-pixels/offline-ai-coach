function HabitTimeline({ items = [] }) {
  return (
    <section className="glass-card p-4">
      <p className="panel-title">Habit Timeline</p>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-500">No habit history yet.</p> : null}
        {items.map((habit) => (
          <article key={habit.id || habit._id} className="rounded-xl border border-slate-700/70 bg-panel-950/40 p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-200">{habit.name}</span>
              <span>
                Streak {habit.streak} | Best {habit.longestStreak}
              </span>
            </div>
            <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1 max-sm:grid-cols-[repeat(7,minmax(0,1fr))]">
              {(habit.series || []).map((point) => (
                <i
                  key={`${habit.name}-${point.date}`}
                  className={`aspect-square rounded ${point.done ? 'bg-emerald-400' : 'bg-slate-800'} border border-slate-700/50`}
                  title={point.date}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HabitTimeline;

