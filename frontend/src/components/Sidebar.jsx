import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const adminLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Users", path: "/users" },
    { name: "Students", path: "/students" },
    { name: "Teachers", path: "/teachers" },
    { name: "Subjects", path: "/subjects" },
    { name: "Academic Sections", path: "/academic-sections" },
    { name: "Teacher Assignments", path: "/teacher-assignments" },
    { name: "Assessments", path: "/assessments" },
    { name: "Attendance", path: "/attendance" },
    { name: "Results", path: "/results" },
  ];

  const teacherLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Students", path: "/students" },
    { name: "Attendance", path: "/attendance" },
    { name: "Results", path: "/results" },
  ];

  const studentLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "My Attendance", path: "/attendance" },
    { name: "My Results", path: "/results" },
  ];

  let links = [];

  if (user?.role === "admin") {
    links = adminLinks;
  } else if (user?.role === "teacher") {
    links = teacherLinks;
  } else if (user?.role === "student") {
    links = studentLinks;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>ARMS</h2>
        <p>Attendance & Result</p>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <strong>{user?.email}</strong>
          <span>{user?.role}</span>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;