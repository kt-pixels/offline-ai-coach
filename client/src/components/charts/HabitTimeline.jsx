function HabitTimeline({ habits = [] }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>Habit Streak Timeline</h3>
      </div>

      <div className="habit-list">
        {habits.length === 0 ? <p className="muted">No habits yet.</p> : null}
        {habits.map((habit) => (
          <article key={habit.id || habit._id} className="habit-item">
            <div className="habit-top">
              <strong>{habit.name}</strong>
              <span>
                Streak {habit.streak} | Best {habit.longestStreak}
              </span>
            </div>
            <div className="habit-track">
              {(habit.series || []).map((point) => (
                <i key={`${habit.name}-${point.date}`} className={point.done ? 'on' : 'off'} title={point.date} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HabitTimeline;
