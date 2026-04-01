const StatCard = ({ icon, label, value, color = '#1a56db' }) => (
  <div className="stat-card" style={{ borderLeftColor: color }}>
    <div className="stat-card__icon" style={{ color }}>{icon}</div>
    <div className="stat-card__info">
      <h3 className="stat-card__value">{value}</h3>
      <p className="stat-card__label">{label}</p>
    </div>
  </div>
);

export default StatCard;
