import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LeaveProvider } from './contexts/LeaveContext';
import { EventProvider } from './contexts/EventContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import LeaveRequests from './pages/LeaveRequests';
import Events from './pages/Events';
import Login from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <LeaveProvider>
        <EventProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/leave-requests" element={<LeaveRequests />} />
                  <Route path="/events" element={<Events />} />
                </Route>
              </Routes>
            </Router>
          </NotificationProvider>
        </EventProvider>
      </LeaveProvider>
    </AuthProvider>
  );
}

export default App;