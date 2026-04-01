import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestService } from '../../services/endpoints';
import { toast } from 'react-toastify';

const REQUEST_TYPES = [
  { value: 'mess', label: 'Mess' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'ground', label: 'Ground' },
  { value: 'medical_aid_centre', label: 'Medical Aid Centre' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'campus', label: 'Campus' },
  { value: 'canteen', label: 'Canteen' },
  { value: 'others', label: 'Others' },
];

const SubmitRequest = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: 'mess',
    subject: '',
    description: '',
    location: '',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.type || !form.subject || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const payload = new FormData();
    payload.append('type', form.type);
    payload.append('subject', form.subject);
    payload.append('description', form.description);
    if (form.location) payload.append('location', form.location);
    files.forEach((f) => payload.append('attachments', f));

    try {
      await requestService.create(payload);
      toast.success('Request submitted successfully!');
      navigate('/requests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--narrow">
      <div className="page__header">
        <h1 className="page__title">Submit Request</h1>
        <p className="page__subtitle">Fill in the form to submit your request</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Request Type *</label>
            <select name="type" className="form-input" value={form.type} onChange={handleChange} required>
              {REQUEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location / Area (optional)</label>
            <input
              type="text" name="location" className="form-input"
              placeholder="e.g., Block A Room 101, Canteen Counter 2"
              value={form.location} onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input
              type="text" name="subject" className="form-input"
              placeholder="Brief subject of your request" value={form.subject}
              onChange={handleChange} required maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description" className="form-input form-textarea" rows={5}
              placeholder="Provide additional details..." value={form.description}
              onChange={handleChange} required maxLength={2000}
            />
            <small className="form-hint">{form.description.length}/2000</small>
          </div>

          <div className="form-group">
            <label className="form-label">Attachments (optional, max 3)</label>
            <input
              type="file" className="form-input" multiple accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 3))}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--outline" onClick={() => navigate('/requests')}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitRequest;
