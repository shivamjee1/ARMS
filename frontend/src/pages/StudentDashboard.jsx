import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <h1>Student Dashboard</h1>

      <p>Welcome, {user?.email}</p>

      <h2>Student Portal</h2>

      <ul>
        <li>View Attendance</li>
        <li>View Results</li>
      </ul>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default StudentDashboard;