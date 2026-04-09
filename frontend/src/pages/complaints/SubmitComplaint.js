import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService, aiService } from '../../services/endpoints';
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
    category: '', subject: '', description: '', priority: 'medium', isAnonymous: false,
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAnalyze = async () => {
    if (form.description.trim().length < 20) {
      toast.warn('Write at least 20 characters in the description for AI analysis.');
      return;
    }
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await aiService.analyze(form.subject, form.description);
      setAiSuggestion(res.data.data);
    } catch {
      toast.error('AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setForm((prev) => ({
      ...prev,
      category: aiSuggestion.category || prev.category,
      priority: aiSuggestion.priority || prev.priority,
    }));
    toast.success('AI suggestions applied!');
  };

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

          {/* AI Smart Analyzer */}
          <div className="ai-analyzer">
            <button
              type="button"
              className="btn btn--ai"
              onClick={handleAnalyze}
              disabled={aiLoading || form.description.trim().length < 20}
            >
              {aiLoading ? (
                <><span className="ai-spinner" /> Analyzing...</>
              ) : (
                <> Analyze with AI</>
              )}
            </button>

            {aiSuggestion && (
              <div className="ai-suggestion-card">
                <div className="ai-suggestion-card__header">
                  <span className="ai-badge">AI Suggestions</span>
                  <span className="ai-source">
                    {aiSuggestion.source === 'gemini' ? 'Powered by Gemini AI' : 'Smart Analysis'}
                  </span>
                </div>

                <div className="ai-suggestion-card__body">
                  <div className="ai-row">
                    <span className="ai-label">Category</span>
                    <span className="ai-value ai-value--category">
                      {aiSuggestion.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="ai-row">
                    <span className="ai-label">Priority</span>
                    <span className={`ai-value ai-value--priority ai-value--${aiSuggestion.priority}`}>
                      {aiSuggestion.priority}
                    </span>
                  </div>
                  <div className="ai-row">
                    <span className="ai-label">Sentiment</span>
                    <span className="ai-value">{aiSuggestion.sentiment}</span>
                  </div>
                  {aiSuggestion.summary && (
                    <div className="ai-row ai-row--summary">
                      <span className="ai-label">Summary</span>
                      <span className="ai-value ai-value--summary">{aiSuggestion.summary}</span>
                    </div>
                  )}
                  {aiSuggestion.keywords?.length > 0 && (
                    <div className="ai-row">
                      <span className="ai-label">Keywords</span>
                      <span className="ai-keywords">
                        {aiSuggestion.keywords.map((kw) => (
                          <span key={kw} className="ai-keyword-tag">{kw}</span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>

                <button type="button" className="btn btn--ai-apply" onClick={applyAiSuggestion}>
                  Apply Suggestions
                </button>
              </div>
            )}
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

          <label className="anonymous-toggle">
            <input
              type="checkbox"
              name="isAnonymous"
              checked={form.isAnonymous}
              onChange={handleChange}
            />
            <span className="anonymous-toggle__text">
              Submit anonymously
              <span className="anonymous-toggle__hint">Your name will be hidden from staff. The system still records your identity for security.</span>
            </span>
          </label>

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
