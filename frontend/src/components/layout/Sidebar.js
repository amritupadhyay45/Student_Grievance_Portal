import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome, FiAlertCircle, FiFileText, FiUsers, FiBarChart2,
  FiSettings, FiLogOut, FiX, FiClipboard
} from 'react-icons/fi';

const navByRole = {
  student: [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/complaints', icon: <FiAlertCircle />, label: 'Complaints' },
    { to: '/requests', icon: <FiFileText />, label: 'Requests' },
  ],
  admin: [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/complaints', icon: <FiAlertCircle />, label: 'All Complaints' },
    { to: '/requests', icon: <FiFileText />, label: 'All Requests' },
    { to: '/users', icon: <FiUsers />, label: 'Manage Users' },
    { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
  ],
  staff: [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/complaints', icon: <FiClipboard />, label: 'Assigned Complaints' },
    { to: '/requests', icon: <FiFileText />, label: 'Assigned Requests' },
  ],
  parent: [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/complaints', icon: <FiAlertCircle />, label: 'Student Complaints' },
    { to: '/requests', icon: <FiFileText />, label: 'Student Requests' },
  ],
  warden: [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/complaints', icon: <FiAlertCircle />, label: 'Hostel Complaints' },
    { to: '/requests', icon: <FiFileText />, label: 'Hostel Requests' },
  ],
  caretaker: [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/complaints', icon: <FiAlertCircle />, label: 'Hostel Complaints' },
    { to: '/requests', icon: <FiFileText />, label: 'Hostel Requests' },
  ],
  hod: [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/complaints', icon: <FiAlertCircle />, label: 'All Complaints' },
    { to: '/requests', icon: <FiFileText />, label: 'All Requests' },
  ],
  bsa: [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/complaints', icon: <FiAlertCircle />, label: 'All Complaints' },
    { to: '/requests', icon: <FiFileText />, label: 'All Requests' },
  ],
  bca: [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/complaints', icon: <FiAlertCircle />, label: 'All Complaints' },
    { to: '/requests', icon: <FiFileText />, label: 'All Requests' },
  ],
  security: [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/complaints', icon: <FiAlertCircle />, label: 'All Complaints' },
    { to: '/requests', icon: <FiFileText />, label: 'All Requests' },
  ],
  others: [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/complaints', icon: <FiAlertCircle />, label: 'All Complaints' },
    { to: '/requests', icon: <FiFileText />, label: 'All Requests' },
  ],
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const links = navByRole[user?.role] || navByRole.student;

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <h2 className="sidebar__logo">SGP</h2>
          <span className="sidebar__title">Grievance Portal</span>
          <button className="sidebar__close" onClick={onClose}><FiX /></button>
        </div>

        <nav className="sidebar__nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar__icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <NavLink to="/profile" className="sidebar__link" onClick={onClose}>
            <span className="sidebar__icon"><FiSettings /></span>
            Profile
          </NavLink>
          <button className="sidebar__link sidebar__logout" onClick={logout}>
            <span className="sidebar__icon"><FiLogOut /></span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
