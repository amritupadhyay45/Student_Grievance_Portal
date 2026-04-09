import { useAuth } from '../../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';
import ParentDashboard from './ParentDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'admin': return <AdminDashboard />;
    case 'staff': return <StaffDashboard />;
    case 'parent': return <ParentDashboard />;
    case 'warden':
    case 'caretaker':
    case 'hod':
    case 'bsa':
    case 'bca':
    case 'security':
    case 'others': return <StaffDashboard />;
    default: return <StudentDashboard />;
  }
};

export default Dashboard;
