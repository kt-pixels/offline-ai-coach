import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function TrendChart({ weightHistory = [], calorieHistory = [] }) {
  const labels = calorieHistory.map((point) => point.date);

  const data = {
    labels,
    datasets: [
      {
        label: 'Calories',
        data: calorieHistory.map((point) => point.calories),
        borderColor: '#3f8cff',
        backgroundColor: 'rgba(63,140,255,0.2)',
        yAxisID: 'y',
        tension: 0.3
      },
      {
        label: 'Target Calories',
        data: calorieHistory.map((point) => point.target),
        borderColor: '#3cf8d4',
        borderDash: [6, 6],
        pointRadius: 0,
        yAxisID: 'y',
        tension: 0.3
      },
      {
        label: 'Weight (kg)',
        data: labels.map((label) => {
          const match = weightHistory.find((point) => point.date === label);
          return match ? match.weight : null;
        }),
        borderColor: '#ffad33',
        backgroundColor: 'rgba(255,173,51,0.22)',
        yAxisID: 'y1',
        tension: 0.35
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        labels: {
          color: '#d7e8ff'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#9cb2cf' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        position: 'left',
        ticks: { color: '#9cb2cf' },
        grid: { color: 'rgba(255,255,255,0.06)' }
      },
      y1: {
        position: 'right',
        ticks: { color: '#ffcb7d' },
        grid: { drawOnChartArea: false }
      }
    }
  };

  return (
    <div className="chart-box">
      <Line data={data} options={options} />
    </div>
  );
}

export default TrendChart;
