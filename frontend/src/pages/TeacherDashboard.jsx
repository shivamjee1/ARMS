import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <h1>Teacher Dashboard</h1>

      <p>Welcome, {user?.email}</p>

      <h2>Teacher Controls</h2>

      <ul>
        <li>View Assigned Subjects</li>
        <li>Manage Attendance</li>
        <li>Manage Results</li>
      </ul>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default TeacherDashboard;