import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/endpoints';
import StatusBadge from '../../components/shared/StatusBadge';
import { getSlaInfo } from '../../utils/sla';
import { FiSearch, FiPlus, FiClock } from 'react-icons/fi';

const CATEGORIES = ['', 'mess', 'classroom', 'hostel', 'campus', 'ground', 'medical_aid_centre'];
const STATUSES = ['', 'pending', 'in_progress', 'resolved', 'rejected'];

const ComplaintsList = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '', category: '' });

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      delete params.search; // rename
      if (filters.search) params.search = filters.search;
      const { data } = await complaintService.getAll(params);
      setComplaints(data.data || []);
      setTotalPages(data.pages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line
  }, [page, filters]);

  const handleFilterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">
          {user?.role === 'student' ? 'My Complaints' : 'All Complaints'}
        </h1>
        {user?.role === 'student' && (
          <Link to="/complaints/new" className="btn btn--primary">
            <FiPlus /> New Complaint
          </Link>
        )}
      </div>

      <div className="filters-bar">
        <div className="filters-bar__search">
          <FiSearch className="filters-bar__search-icon" />
          <input
            type="text"
            className="form-input filters-bar__input"
            placeholder="Search complaints..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <select
          className="form-input filters-bar__select"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All Statuses'}</option>
          ))}
        </select>
        <select
          className="form-input filters-bar__select"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c ? c.replace('_', ' ') : 'All Categories'}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : complaints.length === 0 ? (
          <p className="empty-msg">No complaints found.</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Subject</th>
                    {(user?.role === 'admin' || user?.role === 'staff') && <th>Student</th>}
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>SLA</th>
                    <th>Assigned To</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c, i) => (
                    <tr key={c._id}>
                      <td>{(page - 1) * 10 + i + 1}</td>
                      <td>{c.subject}</td>
                      {(user?.role === 'admin' || user?.role === 'staff') && (
                        <td>
                          {c.isAnonymous
                            ? <span className="anon-badge">Anonymous</span>
                            : c.student?.name}
                        </td>
                      )}
                      <td className="capitalize">{c.category.replace('_', ' ')}</td>
                      <td>
                        <span className={`priority-badge priority-badge--${c.priority}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>
                        {(() => {
                          const sla = getSlaInfo(c);
                          if (!sla) return <span className="text-muted">—</span>;
                          return (
                            <span className={`sla-badge sla-badge--sm ${sla.overdue ? 'sla-badge--overdue' : 'sla-badge--ok'}`}>
                              <FiClock style={{ marginRight: 3 }} />
                              {sla.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td>{c.assignedTo?.name || '—'}</td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/complaints/${c._id}`} className="btn btn--sm btn--outline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                className="btn btn--sm btn--outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="pagination__info">Page {page} of {totalPages}</span>
              <button
                className="btn btn--sm btn--outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ComplaintsList;
