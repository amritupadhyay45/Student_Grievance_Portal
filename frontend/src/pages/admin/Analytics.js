import { useEffect, useState } from 'react';
import { complaintService } from '../../services/endpoints';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#10b981',
  rejected: '#ef4444',
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintService.getAnalytics()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!data) return <p className="empty-msg">Failed to load analytics.</p>;

  const statusChartData = {
    labels: data.statusStats.map((s) => s._id?.replace('_', ' ').toUpperCase()),
    datasets: [{
      data: data.statusStats.map((s) => s.count),
      backgroundColor: data.statusStats.map((s) => STATUS_COLORS[s._id] || '#6b7280'),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  const categoryChartData = {
    labels: data.categoryStats.map((c) => c._id?.replace('_', ' ')),
    datasets: [{
      label: 'Complaints',
      data: data.categoryStats.map((c) => c.count),
      backgroundColor: '#1a56db',
      borderRadius: 6,
    }],
  };

  const monthlyLabels = [...data.monthlyStats].reverse().map(
    (m) => `${m._id.year}-${String(m._id.month).padStart(2, '0')}`
  );

  const monthlyChartData = {
    labels: monthlyLabels,
    datasets: [{
      label: 'Complaints per Month',
      data: [...data.monthlyStats].reverse().map((m) => m.count),
      backgroundColor: '#7c3aed',
      borderRadius: 6,
    }],
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Analytics Dashboard</h1>
        <p className="page__subtitle">Complaint statistics and trends</p>
      </div>

      <div className="analytics-grid">
        <div className="card">
          <h3 className="card__title">Status Distribution</h3>
          <div className="chart-container">
            {data.statusStats.length > 0 ? (
              <Pie data={statusChartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
            ) : <p className="empty-msg">No data yet.</p>}
          </div>
        </div>

        <div className="card">
          <h3 className="card__title">Complaints by Category</h3>
          <div className="chart-container">
            {data.categoryStats.length > 0 ? (
              <Bar data={categoryChartData} options={{
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }} />
            ) : <p className="empty-msg">No data yet.</p>}
          </div>
        </div>

        <div className="card analytics-grid__wide">
          <h3 className="card__title">Monthly Trend (Last 12 Months)</h3>
          <div className="chart-container">
            {data.monthlyStats.length > 0 ? (
              <Bar data={monthlyChartData} options={{
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }} />
            ) : <p className="empty-msg">No data yet.</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card__title">Summary</h3>
        <div className="analytics-summary">
          <div className="analytics-item">
            <strong>Total Complaints</strong>
            <span>{data.totalComplaints}</span>
          </div>
          {data.statusStats.map((s) => (
            <div key={s._id} className="analytics-item">
              <strong className="capitalize">{s._id?.replace('_', ' ')}</strong>
              <span>{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
