import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";

// Admin Pages
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Subjects from "./pages/Subjects";
import AcademicSections from "./pages/AcademicSections";
import Assessments from "./pages/Assessments";
import Results from "./pages/Results";
import TeacherAssignments from "./pages/TeacherAssignments";
import Attendance from "./pages/Attendance";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherSubjects from "./pages/teacher/TeacherSubjects";
import TeacherSections from "./pages/teacher/TeacherSections";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherResults from "./pages/teacher/TeacherResults";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentResults from "./pages/student/StudentResults";
import StudentProfile from "./pages/student/StudentProfile";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Application */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Admin / Academic Section Pages */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route
            path="/academic-sections"
            element={<AcademicSections />}
          />
          <Route
            path="/teacher-assignments"
            element={<TeacherAssignments />}
          />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/results" element={<Results />} />

          {/* Teacher Pages */}
          <Route
            path="/teacher/dashboard"
            element={<TeacherDashboard />}
          />
          <Route
            path="/teacher/subjects"
            element={<TeacherSubjects />}
          />
          <Route
            path="/teacher/sections"
            element={<TeacherSections />}
          />
          <Route
            path="/teacher/students"
            element={<TeacherStudents />}
          />
          <Route
            path="/teacher/attendance"
            element={<TeacherAttendance />}
          />
          <Route
            path="/teacher/results"
            element={<TeacherResults />}
          />

          {/* Student Pages */}
          <Route
            path="/student/dashboard"
            element={<StudentDashboard />}
          />
          <Route
            path="/student/attendance"
            element={<StudentAttendance />}
          />
          <Route
            path="/student/results"
            element={<StudentResults />}
          />
          <Route
            path="/student/profile"
            element={<StudentProfile />}
          />
        </Route>

        {/* Default Route: Unknown URLs */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

