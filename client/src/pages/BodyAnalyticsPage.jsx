import { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { ensureChartsRegistered } from '../components/data/chartSetup';
import { useWorkspace } from '../hooks/useWorkspace';
import ChartCard from '../components/ui/ChartCard';
import StatCard from '../components/ui/StatCard';

ensureChartsRegistered();

const chartOptions = {
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#cbd5e1' } } },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } },
  },
};

function BodyAnalyticsPage() {
  const { actions } = useWorkspace();
  const [bodyAnalytics, setBodyAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const data = await actions.getBodyAnalytics();
        if (active) setBodyAnalytics(data.bodyAnalytics);
      } catch (error) {
        if (active) setMessage(error?.response?.data?.message || 'Unable to load body analytics.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [actions]);

  const combinedWeightChart = useMemo(() => ({
    labels: [...(bodyAnalytics?.weightTimeline || []).map((point) => point.label), ...(bodyAnalytics?.predictionTimeline || []).map((point) => point.label)],
    datasets: [
      {
        label: 'Logged Weight',
        data: [...(bodyAnalytics?.weightTimeline || []).map((point) => point.weightKg), ...Array.from({ length: (bodyAnalytics?.predictionTimeline || []).length }, () => null)],
        borderColor: '#4f8dff',
        backgroundColor: 'rgba(79,141,255,0.18)',
        tension: 0.35,
      },
      {
        label: 'Predicted Weight',
        data: [...Array.from({ length: (bodyAnalytics?.weightTimeline || []).length }, () => null), ...(bodyAnalytics?.predictionTimeline || []).map((point) => point.weightKg)],
        borderColor: '#28d8c4',
        backgroundColor: 'rgba(40,216,196,0.18)',
        tension: 0.35,
      },
    ],
  }), [bodyAnalytics]);

  const predictionChart = useMemo(() => ({
    labels: (bodyAnalytics?.predictionTimeline || []).map((point) => point.label),
    datasets: [
      {
        label: 'Projection',
        data: (bodyAnalytics?.predictionTimeline || []).map((point) => point.weightKg),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.18)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Target Weight',
        data: Array.from({ length: (bodyAnalytics?.predictionTimeline || []).length }, () => bodyAnalytics?.stats?.targetWeightKg || 0),
        borderColor: '#e879f9',
        borderDash: [6, 5],
        pointRadius: 0,
      },
    ],
  }), [bodyAnalytics]);

  const balanceChart = useMemo(() => ({
    labels: (bodyAnalytics?.weeklyCalorieBalance || []).map((point) => point.label),
    datasets: [
      {
        label: 'Weekly Calorie Balance',
        data: (bodyAnalytics?.weeklyCalorieBalance || []).map((point) => point.balance),
        backgroundColor: (bodyAnalytics?.weeklyCalorieBalance || []).map((point) => (point.balance >= 0 ? 'rgba(40,216,196,0.6)' : 'rgba(244,63,94,0.55)')),
        borderRadius: 10,
      },
    ],
  }), [bodyAnalytics]);

  if (loading) {
    return <div className="glass-card p-6 text-sm text-slate-300">Loading body analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current Weight" value={`${bodyAnalytics?.stats?.currentWeightKg || 0} kg`} hint="Latest logged weight" tone="blue" />
        <StatCard label="Predicted Weight" value={`${bodyAnalytics?.stats?.predictedWeightKg || 0} kg`} hint={`${bodyAnalytics?.stats?.confidence || 0}% confidence`} tone="emerald" />
        <StatCard label="Goal Progress" value={`${bodyAnalytics?.stats?.progressPercent || 0}%`} hint={`Projected ${bodyAnalytics?.stats?.projectedProgressPercent || 0}%`} tone="amber" />
        <StatCard label="Weekly Balance" value={`${bodyAnalytics?.stats?.averageWeeklyCalorieBalance || 0} kcal`} hint="Average surplus / deficit" tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Body Progress Timeline" subtitle={bodyAnalytics?.summary || 'Weight timeline and prediction'}>
          <div className="h-80">
            <Line data={combinedWeightChart} options={chartOptions} />
          </div>
        </ChartCard>

        <ChartCard title="Weight Gain Prediction Chart" subtitle="Projected weight against target range">
          <div className="h-80">
            <Line data={predictionChart} options={chartOptions} />
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <ChartCard title="Weekly Calorie Balance Graph" subtitle="Track surplus and deficit across recent weeks">
          <div className="h-80">
            <Bar data={balanceChart} options={chartOptions} />
          </div>
        </ChartCard>

        <ChartCard title="Milestones" subtitle="Expected checkpoints from the prediction engine">
          <div className="space-y-3">
            {(bodyAnalytics?.milestones || []).map((point) => (
              <div key={point.label} className="rounded-2xl border border-slate-700 bg-panel-950/60 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-100">{point.label}</span>
                  <span>{point.weightKg} kg</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Weekly change {point.weeklyChangeKg} kg</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}

export default BodyAnalyticsPage;
