import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintService, adminService } from '../../services/endpoints';
import StatusBadge from '../../components/shared/StatusBadge';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiSend, FiUpload, FiStar } from 'react-icons/fi';

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

const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const reload = async () => {
    const { data } = await complaintService.getById(id);
    setComplaint(data.data);
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
      } catch (err) {
        toast.error('Failed to load complaint');
        navigate('/complaints');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line
  }, [id, navigate, user]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('status', statusForm.status);
      fd.append('note', statusForm.note);
      if (evidenceFile) fd.append('evidenceFile', evidenceFile);
      if (evidenceText) fd.append('evidenceText', evidenceText);
      await complaintService.updateStatus(id, fd);
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
    if (!assignStaffId) {
      toast.error('Please select a staff member');
      return;
    }
    try {
      await complaintService.assign(id, { staffId: assignStaffId });
      toast.success('Complaint assigned!');
      await reload();
    } catch {
      toast.error('Failed to assign complaint');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await complaintService.addComment(id, { text: commentText });
      setCommentText('');
      await reload();
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleRate = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a rating'); return; }
    setRatingSubmitting(true);
    try {
      await complaintService.rate(id, { score: rating, feedback: ratingFeedback });
      toast.success('Thank you for your rating!');
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!complaint) return null;

  const canManage = ['admin', 'staff', 'warden', 'caretaker'].includes(user?.role);
  const canRate = user?.role === 'student' &&
    complaint.status === 'resolved' && !complaint.rating?.score;

  return (
    <div className="page page--narrow">
      <button className="btn-back" onClick={() => navigate('/complaints')}>
        <FiArrowLeft /> Back to Complaints
      </button>

      <div className="card">
        <div className="detail-header">
          <div>
            <h2 className="detail-header__title">{complaint.subject}</h2>
            <p className="detail-header__meta">
              Category: <strong className="capitalize">{complaint.category.replace('_', ' ')}</strong>
              &nbsp;·&nbsp; Submitted: <strong>{new Date(complaint.createdAt).toLocaleDateString()}</strong>
            </p>
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-label">Student</span>
            <span>{complaint.student?.name} ({complaint.student?.rollNumber || 'N/A'})</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Email</span>
            <span>{complaint.student?.email}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Department</span>
            <span>{complaint.student?.department || 'N/A'}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Priority</span>
            <span className={`priority-badge priority-badge--${complaint.priority}`}>
              {complaint.priority}
            </span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Assigned To</span>
            <span>{complaint.assignedTo?.name || 'Not assigned'}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Last Updated</span>
            <span>{new Date(complaint.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <label className="form-label">Description</label>
          <p className="detail-desc">{complaint.description}</p>
        </div>

        {complaint.attachments?.length > 0 && (
          <div className="form-group">
            <label className="form-label">Attachments</label>
            <ul className="file-list">
              {complaint.attachments.map((a, i) => (
                <li key={i}>
                  <a href={`http://localhost:5000/${a.path}`} target="_blank" rel="noreferrer">
                    {a.filename}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {complaint.resolution?.note && (
          <div className="resolution-box">
            <h4>Resolution Note</h4>
            <p>{complaint.resolution.note}</p>
            <small>
              Resolved by {complaint.resolution.resolvedBy?.name} on{' '}
              {new Date(complaint.resolution.resolvedAt).toLocaleDateString()}
            </small>
          </div>
        )}

        {/* Evidence uploaded by staff */}
        {complaint.evidence && (complaint.evidence.text || complaint.evidence.filename) && (
          <div className="evidence-box">
            <h4><FiUpload style={{ marginRight: 6 }} />Resolution Evidence</h4>
            {complaint.evidence.text && <p>{complaint.evidence.text}</p>}
            {complaint.evidence.filename && (
              <a href={`http://localhost:5000/${complaint.evidence.path}`} target="_blank" rel="noreferrer" className="btn btn--sm btn--outline">
                View Proof File
              </a>
            )}
            <small>Uploaded on {new Date(complaint.evidence.uploadedAt).toLocaleDateString()}</small>
          </div>
        )}

        {/* Rating display (visible to all) */}
        {complaint.rating?.score && (
          <div className="rating-display">
            <h4>Student Rating</h4>
            <StarRating value={complaint.rating.score} readonly />
            {complaint.rating.feedback && <p className="rating-feedback">"{complaint.rating.feedback}"</p>}
          </div>
        )}
      </div>

      {/* Student: Rate after resolution */}
      {canRate && (
        <div className="card">
          <h3 className="card__title">⭐ Rate Your Experience</h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Your complaint has been resolved. Please rate your experience.</p>
          <form onSubmit={handleRate}>
            <div className="form-group">
              <label className="form-label">Rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div className="form-group">
              <label className="form-label">Feedback (optional)</label>
              <textarea
                className="form-input form-textarea" rows={2}
                placeholder="Any comments about how your complaint was handled..."
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

      {/* Admin: Assign to Staff */}
      {user?.role === 'admin' && (
        <div className="card">
          <h3 className="card__title">Assign to Staff</h3>
          <form onSubmit={handleAssign} className="form-row">
            <select
              className="form-input"
              value={assignStaffId}
              onChange={(e) => setAssignStaffId(e.target.value)}
            >
              <option value="">Select Staff Member</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>{s.name} — {s.role} {s.department ? `(${s.department})` : ''}</option>
              ))}
            </select>
            <button type="submit" className="btn btn--primary">Assign</button>
          </form>
        </div>
      )}

      {/* Admin/Staff/Warden/Caretaker: Update Status + Evidence */}
      {canManage && (
        <div className="card">
          <h3 className="card__title">Update Status</h3>
          <form onSubmit={handleStatusUpdate}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            {statusForm.status === 'resolved' && (
              <>
                <div className="form-group">
                  <label className="form-label">Resolution Note</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={3}
                    value={statusForm.note}
                    onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                    placeholder="Describe how the issue was resolved..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Evidence — Proof of Resolution (required)</label>
                  <textarea
                    className="form-input form-textarea" rows={2}
                    placeholder="Describe what was done as proof..."
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

      {/* Comments */}
      <div className="card">
        <h3 className="card__title">Comments ({complaint.comments?.length || 0})</h3>
        <div className="comments-list">
          {(complaint.comments || []).length === 0 ? (
            <p className="empty-msg">No comments yet.</p>
          ) : (
            complaint.comments.map((c) => (
              <div key={c._id} className="comment">
                <div className="comment__header">
                  <span className="comment__author">{c.user?.name}</span>
                  <span className="comment__role">{c.user?.role}</span>
                  <span className="comment__date">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="comment__text">{c.text}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleComment} className="comment-form">
          <textarea
            className="form-input form-textarea"
            rows={2}
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button type="submit" className="btn btn--primary btn--icon">
            <FiSend /> Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComplaintDetail;
