import { useEffect, useState } from 'react';
import { adminService } from '../../services/endpoints';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch } from 'react-icons/fi';

const ROLES = ['', 'student', 'admin', 'staff', 'parent', 'warden', 'caretaker', 'hod', 'bsa', 'bca', 'security', 'others'];

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', role: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'staff', department: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getUsers({ page, limit: 15, ...filters });
      setUsers(data.data || []);
      setTotalPages(data.pages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); /* eslint-disable-next-line */ }, [page, filters]);

  const handleToggle = async (id) => {
    try {
      await adminService.toggleUser(id);
      toast.success('User status updated');
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    try {
      await adminService.createUser(newUser);
      toast.success('User created!');
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'staff', department: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">User Management</h1>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Add User
        </button>
      </div>

      <div className="filters-bar">
        <div className="filters-bar__search">
          <FiSearch className="filters-bar__search-icon" />
          <input
            type="text" className="form-input filters-bar__input"
            placeholder="Search by name, email, roll number..."
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
          />
        </div>
        <select
          className="form-input filters-bar__select"
          value={filters.role}
          onChange={(e) => { setFilters((f) => ({ ...f, role: e.target.value })); setPage(1); }}
        >
          {ROLES.map((r) => <option key={r} value={r}>{r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All Roles'}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <p className="empty-msg">No users found.</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Roll No.</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id}>
                      <td>{(page - 1) * 15 + i + 1}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge role-badge--${u.role}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>{u.department || '—'}</td>
                      <td>{u.rollNumber || '—'}</td>
                      <td>
                        <span className={`status-dot ${u.isActive ? 'status-dot--active' : 'status-dot--inactive'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn--sm ${u.isActive ? 'btn--danger' : 'btn--outline'}`}
                          onClick={() => handleToggle(u._id)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button className="btn btn--sm btn--outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              <span className="pagination__info">Page {page} of {totalPages}</span>
              <button className="btn btn--sm btn--outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Create New User</h3>
              <button className="modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" className="form-input" value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required minLength={6} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="parent">Parent</option>
                    <option value="warden">Warden</option>
                    <option value="caretaker">Caretaker</option>
                    <option value="hod">HOD</option>
                    <option value="bsa">BSA</option>
                    <option value="bca">BCA</option>
                    <option value="security">Security</option>
                    <option value="others">Others</option>

                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input type="text" className="form-input" value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
