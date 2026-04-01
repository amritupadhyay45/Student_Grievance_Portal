const StatusBadge = ({ status }) => {
  const colors = {
    pending: '#f59e0b',
    in_progress: '#3b82f6',
    resolved: '#10b981',
    rejected: '#ef4444',
  };

  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
  };

  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: `${colors[status] || '#6b7280'}20`,
        color: colors[status] || '#6b7280',
        border: `1px solid ${colors[status] || '#6b7280'}40`,
      }}
    >
      {labels[status] || status}
    </span>
  );
};

export default StatusBadge;
