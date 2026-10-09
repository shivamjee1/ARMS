import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import AdminDashboard from "./AdminDashboard";
import TeacherDashboard from "./teacher/TeacherDashboard";
import StudentDashboard from "./student/StudentDashboard";

function Dashboard() {
  const { user, loading } = useAuth();

  // Wait until authentication data is loaded
  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Display dashboard according to the user's role
  switch (user.role?.toLowerCase()) {
    case "admin":
      return <AdminDashboard />;

    case "teacher":
      return <TeacherDashboard />;

    case "student":
      return <StudentDashboard />;

    default:
      return <p>Unknown user role. Please contact the administrator.</p>;
  }
}

export default Dashboard;
