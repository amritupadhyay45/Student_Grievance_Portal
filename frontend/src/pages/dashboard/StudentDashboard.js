import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintService, requestService } from '../../services/endpoints';
import StatCard from '../../components/shared/StatCard';
import StatusBadge from '../../components/shared/StatusBadge';
import { FiAlertCircle, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, rRes] = await Promise.all([
          complaintService.getAll({ limit: 5 }),
          requestService.getAll({ limit: 5 }),
        ]);
        setComplaints(cRes.data.data || []);
        setRequests(rRes.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    inProgress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Welcome, {user?.name}!</h1>
        <p className="page__subtitle">Track your complaints and requests below</p>
      </div>

      <div className="stats-grid">
        <StatCard icon={<FiAlertCircle />} label="Total Complaints" value={stats.total} color="#1a56db" />
        <StatCard icon={<FiClock />} label="Pending" value={stats.pending} color="#f59e0b" />
        <StatCard icon={<FiFileText />} label="In Progress" value={stats.inProgress} color="#3b82f6" />
        <StatCard icon={<FiCheckCircle />} label="Resolved" value={stats.resolved} color="#10b981" />
      </div>

      <div className="dashboard-actions">
        <Link to="/complaints/new" className="btn btn--primary">+ Submit Complaint</Link>
        <Link to="/requests/new" className="btn btn--secondary">+ New Request</Link>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Recent Complaints</h2>
            <Link to="/complaints" className="card__link">View all</Link>
          </div>
          {complaints.length === 0 ? (
            <p className="empty-msg">No complaints submitted yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <Link to={`/complaints/${c._id}`} className="table__link">
                          {c.subject}
                        </Link>
                      </td>
                      <td className="capitalize">{c.category.replace('_', ' ')}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Recent Requests</h2>
            <Link to="/requests" className="card__link">View all</Link>
          </div>
          {requests.length === 0 ? (
            <p className="empty-msg">No requests submitted yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <Link to={`/requests/${r._id}`} className="table__link">
                          {r.subject}
                        </Link>
                      </td>
                      <td className="capitalize">{r.type.replace(/_/g, ' ')}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
