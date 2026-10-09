import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./TeacherPortal.css";

function TeacherSections() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSections() {
      try {
        setLoading(true);
        setError("");

        // Reuse the existing teacher subjects endpoint
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
              "Unable to load your assigned sections."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSections();

    return () => {
      active = false;
    };
  }, []);

  // Show each section only once
  const sections = useMemo(() => {
    const uniqueSections = new Map();

    subjects.forEach((subject) => {
      const sectionCode =
        subject.section_code ||
        subject.section_name ||
        subject.section_id;

      if (sectionCode == null) return;

      const key = String(sectionCode);

      if (!uniqueSections.has(key)) {
        uniqueSections.set(key, {
          section_code: sectionCode,
          batch:
            subject.batch_code ||
            subject.batch ||
            "—",
          semester: subject.semester ?? "—",
          subjects: [],
        });
      }

      const section = uniqueSections.get(key);
      const subjectCode =
        subject.subject_code || subject.code;

      if (
        subjectCode &&
        !section.subjects.includes(subjectCode)
      ) {
        section.subjects.push(subjectCode);
      }
    });

    return Array.from(uniqueSections.values());
  }, [subjects]);

  return (
    <main className="teacher-page">
      <header className="teacher-page-heading">
        <div>
          <p className="teacher-eyebrow">TEACHING</p>
          <h1>My Sections</h1>
          <p>
            Academic sections assigned to you through your subjects.
          </p>
        </div>
      </header>

      {error && (
        <div className="teacher-alert" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading assigned sections...</p>
      ) : error ? (
        <section className="teacher-panel">
          <h2>Unable to load sections</h2>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </section>
      ) : sections.length === 0 ? (
        <section className="teacher-panel">
          <h2>No assigned sections</h2>
          <p>
            No academic sections were found for your subject assignments.
            Contact the academic administrator if this is unexpected.
          </p>
        </section>
      ) : (
        <section className="teacher-card-grid">
          {sections.map((section) => (
            <article
              className="teacher-panel"
              key={section.section_code}
            >
              <span className="teacher-code">
                {section.section_code}
              </span>

              <h2>
                Section {section.section_code}
              </h2>

              <p>
                <strong>Batch:</strong> {section.batch}
              </p>

              <p>
                <strong>Semester:</strong> {section.semester}
              </p>

              <div>
                <strong>Assigned Subjects:</strong>

                {section.subjects.length > 0 ? (
                  <ul>
                    {section.subjects.map((code) => (
                      <li key={code}>{code}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No subject codes available.</p>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default TeacherSections;