import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService, complaintService, requestService } from '../../services/endpoints';
import StatCard from '../../components/shared/StatCard';
import StatusBadge from '../../components/shared/StatusBadge';
import { FiUsers, FiAlertCircle, FiCheckCircle, FiClock, FiFileText, FiUserCheck } from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, cRes, rRes] = await Promise.all([
          adminService.getStats(),
          complaintService.getAll({ limit: 5 }),
          requestService.getAll({ limit: 5 }),
        ]);
        setStats(statsRes.data.data || {});
        setRecentComplaints(cRes.data.data || []);
        setRecentRequests(rRes.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Admin Dashboard</h1>
        <p className="page__subtitle">Overview of the grievance portal</p>
      </div>

      <div className="stats-grid stats-grid--6">
        <StatCard icon={<FiUsers />} label="Students" value={stats.totalStudents || 0} color="#1a56db" />
        <StatCard icon={<FiUserCheck />} label="Staff" value={stats.totalStaff || 0} color="#7c3aed" />
        <StatCard icon={<FiAlertCircle />} label="Total Complaints" value={stats.totalComplaints || 0} color="#dc2626" />
        <StatCard icon={<FiClock />} label="Pending" value={stats.pendingComplaints || 0} color="#f59e0b" />
        <StatCard icon={<FiCheckCircle />} label="Resolved" value={stats.resolvedComplaints || 0} color="#10b981" />
        <StatCard icon={<FiFileText />} label="Pending Requests" value={stats.pendingRequests || 0} color="#0891b2" />
      </div>

      <div className="dashboard-actions">
        <Link to="/complaints?status=pending" className="btn btn--danger">View Pending Complaints</Link>
        <Link to="/users" className="btn btn--secondary">Manage Users</Link>
        <Link to="/analytics" className="btn btn--outline">View Analytics</Link>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Recent Complaints</h2>
            <Link to="/complaints" className="card__link">View all</Link>
          </div>
          {recentComplaints.length === 0 ? (
            <p className="empty-msg">No complaints yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map((c) => (
                    <tr key={c._id}>
                      <td>{c.student?.name}</td>
                      <td>
                        <Link to={`/complaints/${c._id}`} className="table__link">{c.subject}</Link>
                      </td>
                      <td className="capitalize">{c.category.replace('_', ' ')}</td>
                      <td><StatusBadge status={c.status} /></td>
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
          {recentRequests.length === 0 ? (
            <p className="empty-msg">No requests yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((r) => (
                    <tr key={r._id}>
                      <td>{r.student?.name}</td>
                      <td>
                        <Link to={`/requests/${r._id}`} className="table__link">{r.subject}</Link>
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

export default AdminDashboard;
