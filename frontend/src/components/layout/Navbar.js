import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/endpoints';
import { FiMenu, FiBell } from 'react-icons/fi';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await notificationService.getAll();
      if (data.success) {
        setNotifications(data.data.slice(0, 10));
        setUnread(data.unreadCount);
      }
    } catch {
      // Silently fail - non-critical feature
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const roleLabel = {
    student: 'Student',
    admin: 'Administrator',
    staff: 'Staff',
    parent: 'Parent',
  };

  return (
    <header className="navbar">
      <button className="navbar__menu" onClick={onMenuClick}>
        <FiMenu size={22} />
      </button>

      <div className="navbar__right">
        <div className="navbar__notif" ref={dropdownRef}>
          <button className="navbar__bell" onClick={() => setShowDropdown(!showDropdown)}>
            <FiBell size={20} />
            {unread > 0 && <span className="navbar__badge">{unread}</span>}
          </button>

          {showDropdown && (
            <div className="notif-dropdown">
              <div className="notif-dropdown__header">
                <h4>Notifications</h4>
                {unread > 0 && (
                  <button onClick={handleMarkAllRead} className="notif-dropdown__mark">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notif-dropdown__list">
                {notifications.length === 0 ? (
                  <p className="notif-dropdown__empty">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className={`notif-item ${!n.isRead ? 'notif-item--unread' : ''}`}>
                      <p className="notif-item__title">{n.title}</p>
                      <p className="notif-item__msg">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="navbar__user">
          <div className="navbar__avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="navbar__info">
            <span className="navbar__name">{user?.name}</span>
            <span className="navbar__role">{roleLabel[user?.role]}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
