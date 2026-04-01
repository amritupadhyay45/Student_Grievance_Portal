import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestService, adminService } from '../../services/endpoints';
import StatusBadge from '../../components/shared/StatusBadge';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiUpload, FiStar } from 'react-icons/fi';

const StarRating = ({ value, onChange, readonly }) => (
  <div className="star-rating">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s} type="button"
        className={`star-btn ${s <= value ? 'star-btn--active' : ''}`}
        onClick={() => !readonly && onChange(s)}
        disabled={readonly}
      >
        <FiStar />
      </button>
    ))}
  </div>
);

const RequestDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const reload = async () => {
    const { data } = await requestService.getById(id);
    setRequest(data.data);
    setStatusForm({ status: data.data.status, note: '' });
  };

  useEffect(() => {
    const load = async () => {
      try {
        await reload();
        if (user?.role === 'admin') {
          const staffRes = await adminService.getStaff();
          setStaffList(staffRes.data.data || []);
        }
      } catch {
        toast.error('Failed to load request');
        navigate('/requests');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('status', statusForm.status);
      fd.append('note', statusForm.note);
      if (evidenceFile) fd.append('evidenceFile', evidenceFile);
      if (evidenceText) fd.append('evidenceText', evidenceText);
      await requestService.updateStatus(id, fd);
      toast.success('Status updated!');
      setEvidenceFile(null);
      setEvidenceText('');
      await reload();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignStaffId) { toast.error('Select a staff member'); return; }
    try {
      await requestService.assign(id, { staffId: assignStaffId });
      toast.success('Request assigned!');
      await reload();
    } catch {
      toast.error('Failed to assign');
    }
  };

  const handleRate = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a rating'); return; }
    setRatingSubmitting(true);
    try {
      await requestService.rate(id, { score: rating, feedback: ratingFeedback });
      toast.success('Thank you for your rating!');
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!request) return null;

  const canManage = ['admin', 'staff', 'warden', 'caretaker'].includes(user?.role);
  const canRate = user?.role === 'student' &&
    request.status === 'resolved' && !request.rating?.score;

  return (
    <div className="page page--narrow">
      <button className="btn-back" onClick={() => navigate('/requests')}>
        <FiArrowLeft /> Back to Requests
      </button>

      <div className="card">
        <div className="detail-header">
          <div>
            <h2 className="detail-header__title">{request.subject}</h2>
            <p className="detail-header__meta">
              Type: <strong className="capitalize">{request.type.replace(/_/g, ' ')}</strong>
              &nbsp;·&nbsp; Submitted: <strong>{new Date(request.createdAt).toLocaleDateString()}</strong>
            </p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-label">Student</span>
            <span>{request.student?.name}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Email</span>
            <span>{request.student?.email}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Assigned To</span>
            <span>{request.assignedTo?.name || 'Not assigned'}</span>
          </div>
          {request.location && (
            <div className="detail-field">
              <span className="detail-label">Location</span>
              <span>{request.location}</span>
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <label className="form-label">Description</label>
          <p className="detail-desc">{request.description}</p>
        </div>

        {request.attachments?.length > 0 && (
          <div className="form-group">
            <label className="form-label">Attachments</label>
            <ul className="file-list">
              {request.attachments.map((a, i) => (
                <li key={i}>
                  <a href={`http://localhost:5000/${a.path}`} target="_blank" rel="noreferrer">{a.filename}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {request.response?.note && (
          <div className="resolution-box">
            <h4>Response / Resolution Note</h4>
            <p>{request.response.note}</p>
            <small>
              Responded by {request.response.respondedBy?.name} on{' '}
              {new Date(request.response.respondedAt).toLocaleDateString()}
            </small>
          </div>
        )}

        {/* Evidence box */}
        {request.evidence && (request.evidence.text || request.evidence.filename) && (
          <div className="evidence-box">
            <h4><FiUpload style={{ marginRight: 6 }} />Resolution Evidence</h4>
            {request.evidence.text && <p>{request.evidence.text}</p>}
            {request.evidence.filename && (
              <a href={`http://localhost:5000/${request.evidence.path}`} target="_blank" rel="noreferrer" className="btn btn--sm btn--outline">
                View Proof File
              </a>
            )}
            <small>Uploaded on {new Date(request.evidence.uploadedAt).toLocaleDateString()}</small>
          </div>
        )}

        {/* Rating display */}
        {request.rating?.score && (
          <div className="rating-display">
            <h4>Student Rating</h4>
            <StarRating value={request.rating.score} readonly />
            {request.rating.feedback && <p className="rating-feedback">"{request.rating.feedback}"</p>}
          </div>
        )}
      </div>

      {/* Student: Rate after resolution */}
      {canRate && (
        <div className="card">
          <h3 className="card__title">⭐ Rate Your Experience</h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Your request has been resolved. Please rate your experience.</p>
          <form onSubmit={handleRate}>
            <div className="form-group">
              <label className="form-label">Rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div className="form-group">
              <label className="form-label">Feedback (optional)</label>
              <textarea
                className="form-input form-textarea" rows={2}
                placeholder="Any comments about how your request was handled..."
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={ratingSubmitting || !rating}>
              {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </form>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="card">
          <h3 className="card__title">Assign to Staff</h3>
          <form onSubmit={handleAssign} className="form-row">
            <select className="form-input" value={assignStaffId} onChange={(e) => setAssignStaffId(e.target.value)}>
              <option value="">Select Staff Member</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>{s.name} — {s.role} {s.department ? `(${s.department})` : ''}</option>
              ))}
            </select>
            <button type="submit" className="btn btn--primary">Assign</button>
          </form>
        </div>
      )}

      {canManage && (
        <div className="card">
          <h3 className="card__title">Update Status</h3>
          <form onSubmit={handleStatusUpdate}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {statusForm.status === 'resolved' && (
              <>
                <div className="form-group">
                  <label className="form-label">Response Note</label>
                  <textarea
                    className="form-input form-textarea" rows={3}
                    value={statusForm.note}
                    onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                    placeholder="Notes about how this was handled..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Evidence — Proof of Resolution (required)</label>
                  <textarea
                    className="form-input form-textarea" rows={2}
                    placeholder="Describe what was done as proof of resolution..."
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Evidence File (optional — image/PDF)</label>
                  <input
                    type="file" className="form-input"
                    accept="image/*,.pdf"
                    onChange={(e) => setEvidenceFile(e.target.files[0] || null)}
                  />
                </div>
              </>
            )}
            <button type="submit" className="btn btn--primary">Update Status</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default RequestDetail;
