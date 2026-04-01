import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/endpoints';
import StatusBadge from '../../components/shared/StatusBadge';
import { FiSearch, FiPlus } from 'react-icons/fi';

const REQUEST_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'mess', label: 'Mess' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'ground', label: 'Ground' },
  { value: 'medical_aid_centre', label: 'Medical Aid Centre' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'campus', label: 'Campus' },
  { value: 'canteen', label: 'Canteen' },
  { value: 'others', label: 'Others' },
];

const RequestsList = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '', type: '' });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await requestService.getAll({ page, limit: 10, ...filters });
      setRequests(data.data || []);
      setTotalPages(data.pages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); /* eslint-disable-next-line */ }, [page, filters]);

  const handleFilterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">
          {user?.role === 'student' ? 'My Requests' : 'All Requests'}
        </h1>
        {user?.role === 'student' && (
          <Link to="/requests/new" className="btn btn--primary">
            <FiPlus /> New Request
          </Link>
        )}
      </div>

      <div className="filters-bar">
        <div className="filters-bar__search">
          <FiSearch className="filters-bar__search-icon" />
          <input
            type="text" className="form-input filters-bar__input"
            placeholder="Search requests..." value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <select
          className="form-input filters-bar__select" value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          className="form-input filters-bar__select" value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          {REQUEST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : requests.length === 0 ? (
          <p className="empty-msg">No requests found.</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Subject</th>
                    {(user?.role === 'admin' || user?.role === 'staff') && <th>Student</th>}
                    <th>Type</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => (
                    <tr key={r._id}>
                      <td>{(page - 1) * 10 + i + 1}</td>
                      <td>{r.subject}</td>
                      {(user?.role === 'admin' || user?.role === 'staff') && <td>{r.student?.name}</td>}
                      <td className="capitalize">{r.type.replace(/_/g, ' ')}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/requests/${r._id}`} className="btn btn--sm btn--outline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button className="btn btn--sm btn--outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </button>
              <span className="pagination__info">Page {page} of {totalPages}</span>
              <button className="btn btn--sm btn--outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestsList;
