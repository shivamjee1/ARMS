import { useAuth } from "../context/AuthContext";

import AdminDashboard from "./AdminDashboard";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>User information not available.</p>;
  }

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  if (user.role === "teacher") {
    return <TeacherDashboard />;
  }

  if (user.role === "student") {
    return <StudentDashboard />;
  }

  return <p>Unknown user role.</p>;
}

export default Dashboard;