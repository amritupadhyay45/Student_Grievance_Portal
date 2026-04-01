import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/endpoints';
import { toast } from 'react-toastify';

const CATEGORIES = [
  { value: 'mess', label: 'Mess' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'campus', label: 'Campus' },
  { value: 'ground', label: 'Ground' },
  { value: 'medical_aid_centre', label: 'Medical Aid Centre' },
];

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: '', subject: '', description: '', priority: 'medium',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.subject || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    files.forEach((f) => formData.append('attachments', f));

    try {
      await complaintService.create(formData);
      toast.success('Complaint submitted successfully!');
      navigate('/complaints');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit complaint';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--narrow">
      <div className="page__header">
        <h1 className="page__title">Submit Complaint</h1>
        <p className="page__subtitle">Describe your issue and we'll look into it promptly</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select name="category" className="form-input" value={form.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select name="priority" className="form-input" value={form.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input
              type="text" name="subject" className="form-input"
              placeholder="Brief title of your complaint" value={form.subject}
              onChange={handleChange} required maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description" className="form-input form-textarea"
              placeholder="Describe the issue in detail..." value={form.description}
              onChange={handleChange} required rows={5} maxLength={2000}
            />
            <span className="form-hint">{form.description.length}/2000 characters</span>
          </div>

          <div className="form-group">
            <label className="form-label">Attachments (optional, max 3 files, 5MB each)</label>
            <input
              type="file" className="form-input" multiple accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 3))}
            />
            {files.length > 0 && (
              <ul className="file-list">
                {files.map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--outline" onClick={() => navigate('/complaints')}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;
