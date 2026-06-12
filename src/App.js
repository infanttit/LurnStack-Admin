import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import LiveClasses from './pages/LiveClasses';
import CreateLiveClass from './pages/CreateLiveClass';
import Courses from './pages/Courses';
import Students from './pages/Students';
import Trainers from './pages/Trainers';
import Payments from './pages/Payments';
import TrainerPayouts from './pages/trainerPayouts';
import Login from './pages/Login';
import RequireAuth from './components/RequireAuth';
import PendingSessions from './pages/PendingSessions';
import OfferCampaigns from './pages/OfferCampaigns';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AttendanceOverview from './pages/AttendanceOverview';
import CourseAttendanceDetail from './pages/CourseAttendanceDetail';
import SessionAttendanceRoster from './pages/SessionAttendanceRoster';
import TrainerAttendanceReport from './pages/TrainerAttendanceReport';
import StudentAttendanceAudit from './pages/StudentAttendanceAudit';
import TrainerSessions from './pages/TrainerSessions';
import PayoutRequestPage from './pages/trainerPayments/PayoutRequestPage';
import SessionEarningsPage from './pages/trainerPayments/SessionEarningsPage';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/trainer/sessions" element={<TrainerSessions />} />
        <Route path="/trainer/session-earnings" element={<SessionEarningsPage />} />
        <Route path="/trainer/session-earnings/:sessionId" element={<SessionEarningsPage />} />
        <Route path="/trainer/payout-request" element={<PayoutRequestPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="live-classes" element={<LiveClasses />} />
          <Route path="live-classes/create" element={<CreateLiveClass />} />
          <Route path="live-classes/edit/:id" element={<CreateLiveClass />} />
          <Route path="students" element={<Students />} />
          <Route path="trainers" element={<Trainers />} />
          <Route path="payments" element={<Payments />} />
          <Route path="trainer-payouts" element={<TrainerPayouts />} />
          <Route path="pending-sessions" element={<PendingSessions />} />
          <Route path="offer-campaigns" element={<OfferCampaigns view="campaigns" />} />
          <Route path="offer-campaigns/create" element={<OfferCampaigns view="builder" />} />
          <Route path="offer-campaigns/history" element={<OfferCampaigns view="history" />} />

          <Route path="courses" element={<Courses />} />
          <Route path="settings" element={<div className="p-8">Settings Module Placeholder</div>} />
          
          {/* Attendance Routes */}
          <Route path="attendance" element={<AttendanceOverview />} />
          <Route path="courses/:courseId/attendance" element={<CourseAttendanceDetail />} />
          <Route path="sessions/:sessionId/attendance" element={<SessionAttendanceRoster />} />
          <Route path="trainers/:trainerId/attendance" element={<TrainerAttendanceReport />} />
          <Route path="students/:studentId/attendance" element={<StudentAttendanceAudit />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
