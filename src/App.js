import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import LiveClasses from './pages/LiveClasses';
import CreateLiveClass from './pages/CreateLiveClass';
import Students from './pages/Students';
import Trainers from './pages/Trainers';
import Payments from './pages/Payments';
import Revenue from './pages/Revenue';
import Login from './pages/Login';
import RequireAuth from './components/RequireAuth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AttendanceOverview from './pages/AttendanceOverview';
import CourseAttendanceDetail from './pages/CourseAttendanceDetail';
import SessionAttendanceRoster from './pages/SessionAttendanceRoster';
import TrainerAttendanceReport from './pages/TrainerAttendanceReport';
import StudentAttendanceAudit from './pages/StudentAttendanceAudit';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Routes>
        <Route path="/login" element={<Login />} />

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
          <Route path="revenue" element={<Revenue />} />

          <Route path="collaborative" element={<div className="p-8">Collaborative Module Placeholder</div>} />
          <Route path="courses" element={<div className="p-8">Courses Module Placeholder</div>} />
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
