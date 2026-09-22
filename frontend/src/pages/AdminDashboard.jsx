import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    subjects: 0,
    sections: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const managementItems = [
    {
      title: "Students",
      description: "Manage student profiles and academic information.",
      path: "/students",
    },
    {
      title: "Teachers",
      description: "Manage teachers and their profiles.",
      path: "/teachers",
    },
    {
      title: "Academic Sections",
      description: "Manage batches, sections and academic structure.",
      path: "/academic-sections",
    },
    {
      title: "Subjects",
      description: "Create and manage academic subjects.",
      path: "/subjects",
    },
    {
      title: "Teacher Assignments",
      description: "Assign teachers to subjects and sections.",
      path: "/teacher-assignments",
    },
    {
      title: "Assessments",
      description: "Manage assessments and examination structure.",
      path: "/assessments",
    },
    {
      title: "Attendance",
      description: "Monitor and manage student attendance.",
      path: "/attendance",
    },
    {
      title: "Results",
      description: "Manage marks, assessments and academic results.",
      path: "/results",
    },
  ];

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          studentsResponse,
          teachersResponse,
          subjectsResponse,
          sectionsResponse,
        ] = await Promise.all([
          api.get("/students"),
          api.get("/teachers"),
          api.get("/subjects"),
          api.get("/academic-sections"),
        ]);

        setStats({
          students: studentsResponse.data.length,
          teachers: teachersResponse.data.length,
          subjects: subjectsResponse.data.length,
          sections: sectionsResponse.data.length,
        });
      } catch (error) {
        console.error("Failed to load dashboard statistics:", error);
        setError("Unable to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="dashboard-page">

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <p className="dashboard-label">ADMINISTRATION</p>

          <h1>Admin Dashboard</h1>

          <p className="dashboard-subtitle">
            Manage academic information and system operations.
          </p>
        </div>

        <div className="dashboard-user">
          <div className="dashboard-avatar">
            {user?.email?.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{user?.email}</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <section className="dashboard-section">

        <div className="dashboard-section-header">
          <div>
            <p className="section-label">OVERVIEW</p>
            <h2>Academic Statistics</h2>
          </div>
        </div>

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        <div className="dashboard-stats">

          {/* Students */}
          <div className="dashboard-stat-card">
            <div className="stat-icon">S</div>

            <div>
              <span>Students</span>

              <strong>
                {loading ? "..." : stats.students}
              </strong>
            </div>
          </div>

          {/* Teachers */}
          <div className="dashboard-stat-card">
            <div className="stat-icon">T</div>

            <div>
              <span>Teachers</span>

              <strong>
                {loading ? "..." : stats.teachers}
              </strong>
            </div>
          </div>

          {/* Subjects */}
          <div className="dashboard-stat-card">
            <div className="stat-icon">S</div>

            <div>
              <span>Subjects</span>

              <strong>
                {loading ? "..." : stats.subjects}
              </strong>
            </div>
          </div>

          {/* Sections */}
          <div className="dashboard-stat-card">
            <div className="stat-icon">A</div>

            <div>
              <span>Academic Sections</span>

              <strong>
                {loading ? "..." : stats.sections}
              </strong>
            </div>
          </div>

        </div>
      </section>

      {/* Management */}
      <section className="dashboard-section">

        <div className="dashboard-section-header">
          <div>
            <p className="section-label">MANAGEMENT</p>
            <h2>System Modules</h2>
          </div>
        </div>

        <div className="management-grid">

          {managementItems.map((item) => (
            <button
              key={item.path}
              className="management-card"
              onClick={() => navigate(item.path)}
            >
              <div className="management-card-top">
                <h3>{item.title}</h3>
                <span>→</span>
              </div>

              <p>{item.description}</p>
            </button>
          ))}

        </div>
      </section>

    </div>
  );
}

export default AdminDashboard;