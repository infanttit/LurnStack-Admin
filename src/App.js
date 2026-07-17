import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/dashboard/Dashboard';
import LiveClasses from './pages/live-classes/LiveClasses';
import CreateLiveClass from './pages/live-classes/CreateLiveClass';
import Courses from './pages/courses/Courses';
import Students from './pages/students/Students';
import Trainers from './pages/trainers/Trainers';
import Payments from './pages/payments/Payments';
import TrainerPayouts from './pages/trainerPayouts';
import Login from './pages/auth/Login';
import RequireAuth from './components/RequireAuth'; 
import PendingSessions from './pages/pending-sessions/PendingSessions';
import DeleteRequests from './pages/DeleteRequests';
import OfferCampaigns from './pages/offerCampaigns/OfferCampaigns';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AttendanceOverview from './pages/attendance/AttendanceOverview';
import CourseAttendanceDetail from './pages/attendance/CourseAttendanceDetail';
import CourseAttendanceDay from './pages/attendance/CourseAttendanceDay';
import SessionAttendanceRoster from './pages/attendance/SessionAttendanceRoster';
import SessionOccurrences from './pages/attendance/SessionOccurrences';
import TrainerAttendanceReport from './pages/attendance/TrainerAttendanceReport';
import StudentAttendanceAudit from './pages/attendance/StudentAttendanceAudit';
import TrainerSessions from './pages/trainers/TrainerSessions';
import PayoutRequestPage from './pages/trainerPayments/PayoutRequestPage';
import SessionEarningsPage from './pages/trainerPayments/SessionEarningsPage';
import OffersDashboardPage from './pages/OffersDashboardPage';

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
          <Route path="delete-requests" element={<DeleteRequests />} />
          <Route path="offer-campaigns" element={<OfferCampaigns view="campaigns" />} />
          <Route path="offer-campaigns/create" element={<OfferCampaigns view="builder" />} />
          <Route path="offer-campaigns/history" element={<OfferCampaigns view="history" />} />
          <Route path="offers" element={<OffersDashboardPage />} />

          <Route path="courses" element={<Courses />} />
          <Route path="settings" element={<div className="p-8">Settings Module Placeholder</div>} />
          
          {/* Attendance Routes */}
          <Route path="attendance" element={<AttendanceOverview />} />
          <Route path="courses/:courseId/attendance" element={<CourseAttendanceDetail />} />
          <Route path="courses/:courseKey/attendance/:date" element={<CourseAttendanceDay />} />
          <Route path="tit/:courseId/attendance" element={<CourseAttendanceDetail isTIT={true} />} />
          <Route path="tit/:courseKey/attendance/:date" element={<CourseAttendanceDay isTIT={true} />} />
          <Route path="sessions/:sessionId/attendance" element={<SessionOccurrences />} />
          <Route path="sessions/:sessionId/attendance/:date" element={<SessionAttendanceRoster />} />
          <Route path="trainers/:trainerId/attendance" element={<TrainerAttendanceReport />} />
          <Route path="students/:studentId/attendance" element={<StudentAttendanceAudit />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
