function ActivityHeatmap({ title = 'Activity Heatmap', data = [] }) {
  const levelStyles = ['bg-slate-800', 'bg-sky-900', 'bg-sky-700', 'bg-cyan-500', 'bg-emerald-400'];

  return (
    <section className="glass-card p-4">
      <p className="panel-title">{title}</p>
      <div className="mt-4 grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1 max-sm:grid-cols-[repeat(7,minmax(0,1fr))]">
        {data.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date}: ${cell.calories || cell.value || 0}`}
            className={`aspect-square rounded ${levelStyles[cell.level] || levelStyles[0]} border border-slate-700/40`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>Low</span>
        <span>High</span>
      </div>
    </section>
  );
}

export default ActivityHeatmap;

