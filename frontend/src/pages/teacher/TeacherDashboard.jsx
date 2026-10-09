import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./TeacherPortal.css";

function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: "▤",
      title: "My Subjects",
      description: "View your assigned subjects and teaching responsibilities.",
      path: "/teacher/subjects",
      button: "View Subjects",
    },
    {
      icon: "▦",
      title: "My Sections",
      description: "Review the academic sections assigned to you.",
      path: "/teacher/sections",
      button: "View Sections",
    },
    {
      icon: "♙",
      title: "My Students",
      description: "View student records for your assigned classes.",
      path: "/teacher/students",
      button: "View Students",
    },
    {
      icon: "✓",
      title: "Manage Attendance",
      description: "Record and update attendance for your assigned classes.",
      path: "/teacher/attendance",
      button: "Open Attendance",
    },
    {
      icon: "▤",
      title: "Results & Marks",
      description: "Enter and update marks for assessments and final exams.",
      path: "/teacher/results",
      button: "Open Results",
    },
  ];

  return (
    <main className="teacher-page">
      <header className="teacher-welcome">
        <p className="teacher-eyebrow">TEACHER PORTAL</p>
        <h1>
          Welcome,{" "}
          {user?.name || user?.full_name || user?.email || "Teacher"}
        </h1>
        <p>
          Manage your assigned subjects, sections, students, attendance,
          and academic results.
        </p>
      </header>

      <section className="teacher-feature-grid">
        {features.map((feature) => (
          <article className="teacher-feature-card" key={feature.title}>
            <div className="teacher-feature-icon" aria-hidden="true">
              {feature.icon}
            </div>

            <h2>{feature.title}</h2>
            <p>{feature.description}</p>

            <button
              type="button"
              className="teacher-primary-button"
              onClick={() => navigate(feature.path)}
            >
              {feature.button} →
            </button>
          </article>
        ))}
      </section>

      <section className="teacher-panel">
        <h2>Teacher Access</h2>
        <p>
          You can manage attendance and marks only for subjects and
          sections assigned to your account. Student information and
          academic records are restricted by the backend.
        </p>
      </section>
    </main>
  );
}

export default TeacherDashboard;