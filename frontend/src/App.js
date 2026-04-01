import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import ComplaintsList from './pages/complaints/ComplaintsList';
import SubmitComplaint from './pages/complaints/SubmitComplaint';
import ComplaintDetail from './pages/complaints/ComplaintDetail';
import RequestsList from './pages/requests/RequestsList';
import SubmitRequest from './pages/requests/SubmitRequest';
import RequestDetail from './pages/requests/RequestDetail';
import UsersManagement from './pages/admin/UsersManagement';
import Analytics from './pages/admin/Analytics';
import Profile from './pages/Profile';

import './styles.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Complaints */}
            <Route path="complaints" element={<ComplaintsList />} />
            <Route
              path="complaints/new"
              element={
                <ProtectedRoute roles={['student']}>
                  <SubmitComplaint />
                </ProtectedRoute>
              }
            />
            <Route path="complaints/:id" element={<ComplaintDetail />} />

            {/* Requests */}
            <Route path="requests" element={<RequestsList />} />
            <Route
              path="requests/new"
              element={
                <ProtectedRoute roles={['student']}>
                  <SubmitRequest />
                </ProtectedRoute>
              }
            />
            <Route path="requests/:id" element={<RequestDetail />} />

            {/* Admin only */}
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['admin']}>
                  <UsersManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="analytics"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
