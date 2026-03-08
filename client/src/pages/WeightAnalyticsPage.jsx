import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { ensureChartsRegistered } from "../components/data/chartSetup";
import { useWorkspace } from "../hooks/useWorkspace";
import StatCard from "../components/ui/StatCard";
import ChartCard from "../components/ui/ChartCard";

ensureChartsRegistered();

const chartOptions = {
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#cbd5e1" } } },
  scales: {
    x: {
      ticks: { color: "#94a3b8" },
      grid: { color: "rgba(148,163,184,0.08)" },
    },
    y: {
      ticks: { color: "#94a3b8" },
      grid: { color: "rgba(148,163,184,0.08)" },
    },
  },
};

function WeightAnalyticsPage() {
  const { nutritionDashboard } = useWorkspace();
  const growthPrediction = nutritionDashboard?.growthPrediction;
  const milestones = growthPrediction?.milestones || [];

  const chartData = useMemo(
    () => ({
      labels: [
        "Start",
        ...(growthPrediction?.projection || []).map((point) => point.label),
      ],
      datasets: [
        {
          label: "Projected Bodyweight (kg)",
          data: [
            nutritionDashboard?.today?.currentWeightKg || 0,
            ...(growthPrediction?.projection || []).map(
              (point) => point.weightKg,
            ),
          ],
          borderColor: "#4f8dff",
          backgroundColor: "rgba(79,141,255,0.18)",
          fill: true,
          tension: 0.35,
        },
        {
          label: "Target Weight",
          data: Array.from(
            { length: (growthPrediction?.projection?.length || 0) + 1 },
            () => nutritionDashboard?.today?.targetWeightKg || 0,
          ),
          borderColor: "#28d8c4",
          borderDash: [6, 5],
          pointRadius: 0,
        },
      ],
    }),
    [
      growthPrediction?.projection,
      nutritionDashboard?.today?.currentWeightKg,
      nutritionDashboard?.today?.targetWeightKg,
    ],
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8 xl:px-10">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Current Weight"
          value={`${nutritionDashboard?.today?.currentWeightKg || 0} kg`}
          hint="Latest tracked value"
          tone="blue"
        />
        <StatCard
          label="Target Weight"
          value={`${nutritionDashboard?.today?.targetWeightKg || 0} kg`}
          hint="Goal configuration"
          tone="emerald"
        />
        <StatCard
          label="Required Surplus"
          value={`${growthPrediction?.requiredDailySurplus || 0} kcal`}
          hint="To stay on goal pace"
          tone="amber"
        />
        <StatCard
          label="Projected Week 12"
          value={`${growthPrediction?.finalWeightKg || 0} kg`}
          hint={`${growthPrediction?.confidence || 0}% confidence`}
          tone="rose"
        />
      </section>

      <ChartCard
        title="Body Growth Prediction Engine"
        subtitle={
          growthPrediction?.summary ||
          "Projection updates with your daily calorie pacing"
        }
      >
        <div className="h-64 sm:h-72 md:h-80 lg:h-[380px] w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      </ChartCard>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {milestones.map((point) => (
          <div key={point.week} className="glass-card p-4 sm:p-5 h-full">
            <p className="panel-title">{point.label}</p>
            <p className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-100">
              {point.weightKg} kg
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Expected change {point.weeklyChangeKg} kg
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default WeightAnalyticsPage;
