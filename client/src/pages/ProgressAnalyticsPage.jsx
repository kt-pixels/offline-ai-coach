import { useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { ensureChartsRegistered } from '../components/data/chartSetup';
import { useWorkspace } from '../hooks/useWorkspace';
import ChartCard from '../components/ui/ChartCard';
import ActivityHeatmap from '../components/ui/ActivityHeatmap';
import HabitTimeline from '../components/ui/HabitTimeline';
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

function ProgressAnalyticsPage() {
  const { nutritionAnalytics, nutritionDashboard } = useWorkspace();
  const dailyCalories = nutritionAnalytics?.dailyCalories || [];
  const weeklyIntake = nutritionAnalytics?.weeklyIntake || [];
  const weightProgress = nutritionAnalytics?.weightProgress || [];
  const disciplineTrend = nutritionAnalytics?.disciplineTrend || [];
  const heatmapData = nutritionAnalytics?.calorieHeatmap || [];
  const habitTimeline = nutritionAnalytics?.habitTimeline || [];

  const calorieChart = useMemo(
    () => ({
      labels: dailyCalories.map((row) => row.date),
      datasets: [
        {
          label: 'Consumed',
          data: dailyCalories.map((row) => row.consumed),
          borderColor: '#4f8dff',
          backgroundColor: 'rgba(79,141,255,0.16)',
          fill: true,
          tension: 0.35,
        },
        {
          label: 'Target',
          data: dailyCalories.map((row) => row.target),
          borderColor: '#28d8c4',
          borderDash: [6, 5],
          pointRadius: 0,
          tension: 0.15,
        },
      ],
    }),
    [dailyCalories],
  );

  const weightChart = useMemo(
    () => ({
      labels: weightProgress.map((row) => row.date),
      datasets: [
        {
          label: 'Bodyweight (kg)',
          data: weightProgress.map((row) => row.weight),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.16)',
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [weightProgress],
  );

  const disciplineChart = useMemo(
    () => ({
      labels: disciplineTrend.map((row) => row.date),
      datasets: [
        {
          label: 'Discipline Score',
          data: disciplineTrend.map((row) => row.score),
          borderColor: '#e879f9',
          backgroundColor: 'rgba(232,121,249,0.14)',
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [disciplineTrend],
  );

  const weeklyChart = useMemo(
    () => ({
      labels: weeklyIntake.map((row) => row.week),
      datasets: [
        {
          label: 'Weekly Intake',
          data: weeklyIntake.map((row) => row.calories),
          backgroundColor: 'rgba(40,216,196,0.55)',
          borderRadius: 8,
        },
        {
          label: 'Weekly Target',
          data: weeklyIntake.map((row) => row.target),
          backgroundColor: 'rgba(79,141,255,0.35)',
          borderRadius: 8,
        },
      ],
    }),
    [weeklyIntake],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Calorie Target" value={`${nutritionDashboard?.today?.calorieTarget || 0} kcal`} hint="Personalized via onboarding" tone="blue" />
        <StatCard label="Discipline Score" value={`${nutritionDashboard?.discipline?.score || 0}/100`} hint={nutritionDashboard?.discipline?.label || 'local discipline engine'} tone="emerald" />
        <StatCard label="Projected Week 12" value={`${nutritionDashboard?.growthPrediction?.finalWeightKg || 0} kg`} hint={nutritionDashboard?.growthPrediction?.summary || 'future bodyweight model'} tone="amber" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Weight Growth Chart" subtitle="Logged bodyweight over time">
          <div className="h-80">
            <Line data={weightChart} options={chartOptions} />
          </div>
        </ChartCard>

        <ChartCard title="Discipline Score Trend" subtitle="30-day discipline signal">
          <div className="h-80">
            <Line data={disciplineChart} options={chartOptions} />
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Daily Calories" subtitle="Consumption versus target">
          <div className="h-80">
            <Line data={calorieChart} options={chartOptions} />
          </div>
        </ChartCard>

        <ActivityHeatmap title="Calorie Heatmap" data={heatmapData} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ChartCard title="Weekly Intake" subtitle="Total weekly adherence">
          <div className="h-80">
            <Bar data={weeklyChart} options={chartOptions} />
          </div>
        </ChartCard>

        <HabitTimeline items={habitTimeline} />
      </section>
    </div>
  );
}

export default ProgressAnalyticsPage;
