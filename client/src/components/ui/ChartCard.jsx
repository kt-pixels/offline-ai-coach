function ChartCard({ title, subtitle, action, children }) {
  return (
    <section className="glass-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="panel-title">{title}</p>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export default ChartCard;
