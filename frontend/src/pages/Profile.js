import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/endpoints';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', department: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '', department: user.department || '' });
    }
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile(form);
      // Update local storage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: form.name }));
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = { student: 'Student', admin: 'Administrator', staff: 'Staff', parent: 'Parent' };

  return (
    <div className="page page--narrow">
      <div className="page__header">
        <h1 className="page__title">My Profile</h1>
      </div>

      <div className="card">
        <div className="profile-header">
          <div className="profile-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <h2 className="profile-name">{user?.name}</h2>
            <p className="profile-email">{user?.email}</p>
            <span className={`role-badge role-badge--${user?.role}`}>{roleLabel[user?.role]}</span>
          </div>
        </div>

        <div className="profile-info">
          {user?.rollNumber && (
            <div className="detail-field">
              <span className="detail-label">Roll Number</span>
              <span>{user.rollNumber}</span>
            </div>
          )}
          <div className="detail-field">
            <span className="detail-label">Member Since</span>
            <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card__title">Edit Profile</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="tel" name="phone" className="form-input" value={form.phone} onChange={handleChange} placeholder="+91 99999 99999" />
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input type="text" name="department" className="form-input" value={form.department} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
