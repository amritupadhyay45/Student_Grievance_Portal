import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const DEPARTMENTS = [
  'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical',
  'Physics', 'Mathematics', 'Administration', 'Other',
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'student', phone: '', department: '', rollNumber: '', linkedStudentEmail: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email, and password are required');
      return false;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { confirmPassword, ...payload } = form;
    try {
      await register(payload);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-card__header">
          <div className="auth-card__logo">SGP</div>
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">Join the grievance portal</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text" name="name" className="form-input"
                placeholder="John Doe" value={form.name} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select name="role" className="form-input" value={form.role} onChange={handleChange}>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email" name="email" className="form-input"
              placeholder="you@example.com" value={form.email} onChange={handleChange} required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password" name="password" className="form-input"
                placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type="password" name="confirmPassword" className="form-input"
                placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel" name="phone" className="form-input"
                placeholder="+91 99999 99999" value={form.phone} onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select name="department" className="form-input" value={form.department} onChange={handleChange}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {form.role === 'student' && (
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input
                type="text" name="rollNumber" className="form-input"
                placeholder="CS2024001" value={form.rollNumber} onChange={handleChange}
              />
            </div>
          )}

          {form.role === 'parent' && (
            <div className="form-group">
              <label className="form-label">Student Email (to link)</label>
              <input
                type="email" name="linkedStudentEmail" className="form-input"
                placeholder="student@example.com" value={form.linkedStudentEmail} onChange={handleChange}
              />
            </div>
          )}

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-card__link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
