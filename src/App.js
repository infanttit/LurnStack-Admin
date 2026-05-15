import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import LiveClasses from './pages/LiveClasses';
import CreateLiveClass from './pages/CreateLiveClass';
import Login from './pages/Login';
import RequireAuth from './components/RequireAuth';

function App() {
  return (
    <Router>
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

          <Route path="collaborative" element={<div className="p-8">Collaborative Module Placeholder</div>} />

          {/* Fallback routes */}
          <Route path="courses" element={<div className="p-8">Courses Module Placeholder</div>} />
          <Route path="students" element={<div className="p-8">Students Module Placeholder</div>} />
          <Route path="settings" element={<div className="p-8">Settings Module Placeholder</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
