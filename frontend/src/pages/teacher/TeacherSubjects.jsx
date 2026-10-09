import { useEffect, useState } from "react";
import api from "../../services/api";
import "./TeacherPortal.css";

function TeacherSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSubjects() {
      try {
        setLoading(true);
        setError("");

        // Fetch subjects and sections assigned to the logged-in teacher
        const response = await api.get("/teachers/subjects");

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.items ||
            response.data?.subjects ||
            [];

        if (active) {
          setSubjects(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Unable to load assigned subjects."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSubjects();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="teacher-page">
      <header className="teacher-page-heading">
        <div>
          <p className="teacher-eyebrow">TEACHING</p>
          <h1>My Subjects</h1>
          <p>
            View the subjects and academic sections assigned to you.
          </p>
        </div>
      </header>

      {error && (
        <div className="teacher-alert" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading assigned subjects...</p>
      ) : error ? (
        <section className="teacher-panel">
          <h2>Unable to load subjects</h2>
          <p>Please check your connection or try again.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </section>
      ) : subjects.length === 0 ? (
        <section className="teacher-panel">
          <h2>No assigned subjects</h2>
          <p>
            No subject assignments were found for your account.
            Contact the academic administrator if an assignment is missing.
          </p>
        </section>
      ) : (
        <section className="teacher-card-grid">
          {subjects.map((subject, index) => (
            <article
              className="teacher-panel"
              key={`${subject.subject_code || subject.code}-${subject.section_code || subject.section_id}-${index}`}
            >
              <span className="teacher-code">
                {subject.subject_code || subject.code || "Subject"}
              </span>

              <h2>
                {subject.subject_name ||
                  subject.name ||
                  "Unnamed Subject"}
              </h2>

              <p>
                <strong>Section:</strong>{" "}
                {subject.section_code ||
                  subject.section_name ||
                  subject.section_id ||
                  "—"}
              </p>

              <p>
                <strong>Semester:</strong>{" "}
                {subject.semester ?? "—"}
              </p>

              <p>
                <strong>Batch:</strong>{" "}
                {subject.batch_code ||
                  subject.batch ||
                  "—"}
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default TeacherSubjects;
