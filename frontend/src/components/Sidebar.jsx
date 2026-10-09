
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role?.toLowerCase();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
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
    { name: "Dashboard", path: "/teacher/dashboard" },
    { name: "My Subjects", path: "/teacher/subjects" },
    { name: "My Sections", path: "/teacher/sections" },
    { name: "My Students", path: "/teacher/students" },
    { name: "Manage Attendance", path: "/teacher/attendance" },
    { name: "Results & Marks", path: "/teacher/results" },
  ];

  const studentLinks = [
    { name: "Dashboard", path: "/student/dashboard" },
    { name: "My Attendance", path: "/student/attendance" },
    { name: "My Results", path: "/student/results" },
    { name: "My Profile", path: "/student/profile" },
  ];

  let links = [];

  switch (role) {
    case "admin":
      links = adminLinks;
      break;
    case "teacher":
      links = teacherLinks;
      break;
    case "student":
      links = studentLinks;
      break;
    default:
      links = [];
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>ARMS</h2>
        <p>Attendance &amp; Result</p>
        <span className="sidebar-role">
          {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Guest"}
          Portal
        </span>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/dashboard" ||
                 link.path === "/student/dashboard" ||
                 link.path === "/teacher/dashboard"}
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
          <strong title={user?.email}>
            {user?.email || "User"}
          </strong>
          <span>
            {role
              ? role.charAt(0).toUpperCase() + role.slice(1)
              : "Unknown role"}
          </span>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;