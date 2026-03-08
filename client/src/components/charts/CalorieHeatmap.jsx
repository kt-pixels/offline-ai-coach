function CalorieHeatmap({ data = [] }) {
  return (
    <section className="panel heatmap-panel">
      <div className="panel-head">
        <h3>Calorie Heatmap (28 Days)</h3>
      </div>
      <div className="heatmap-grid">
        {data.map((item) => (
          <div key={item.date} className={`heat-cell lvl-${item.level}`} title={`${item.date}: ${item.calories} kcal`} />
        ))}
      </div>
      <div className="legend-row">
        <span>Low</span>
        <div className="legend-ramp">
          <i className="lvl-0" />
          <i className="lvl-1" />
          <i className="lvl-2" />
          <i className="lvl-3" />
          <i className="lvl-4" />
        </div>
        <span>On Target</span>
      </div>
    </section>
  );
}

export default CalorieHeatmap;
