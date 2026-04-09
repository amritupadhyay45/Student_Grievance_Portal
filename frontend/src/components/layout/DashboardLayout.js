import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatBot from '../shared/ChatBot';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="layout__main">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
      <ChatBot />
    </div>
  );
};

export default DashboardLayout;
