import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./TeacherPortal.css";

function TeacherStudents() {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load the logged-in teacher's assigned subjects.
  useEffect(() => {
    let active = true;

    async function loadAssignedSubjects() {
      try {
        setLoading(true);
        setError("");

        // IMPORTANT: Match this URL to your FastAPI route.
        const response = await api.get("/teachers/subjects");

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.items ??
            response.data?.subjects ??
            [];

        if (!active) return;

        console.log("Assigned subjects response:", response.data);

        setSubjects(data);

        // Automatically select the first assigned section.
        const firstSection = data.find(
          (subject) => subject.section_id != null
        );

        setSelectedSection(
          firstSection ? String(firstSection.section_id) : ""
        );

        if (data.length === 0) {
          setError("No assigned subjects were returned by the API.");
        } else if (!firstSection) {
          setError(
            "Assigned subjects were returned, but section_id is missing. Check the /teacher/subjects API response."
          );
        }
      } catch (err) {
        if (!active) return;

        console.error(
          "Failed to load assigned subjects:",
          err.response?.data || err
        );

        setError(
          err.response?.data?.detail ||
            "Unable to load your assigned subjects."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAssignedSubjects();

    return () => {
      active = false;
    };
  }, []);

  // Build a unique list of sections.
  const sections = useMemo(() => {
    const uniqueSections = new Map();

    subjects.forEach((subject) => {
      if (subject.section_id == null) return;

      const id = String(subject.section_id);

      if (!uniqueSections.has(id)) {
        uniqueSections.set(id, {
          id,
          code:
            subject.section_code ||
            subject.section_name ||
            id,
        });
      }
    });

    return Array.from(uniqueSections.values());
  }, [subjects]);

  // Load students whenever the selected section changes.
  useEffect(() => {
    if (!selectedSection) {
      setStudents([]);
      setStudentsLoading(false);
      return;
    }

    let active = true;

    async function loadStudents() {
      try {
        setStudentsLoading(true);
        setStudents([]);
        setError("");

        const response = await api.get(
          `/teachers/sections/${encodeURIComponent(
            selectedSection
          )}/students`
        );

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.items ??
            response.data?.students ??
            [];

        if (!active) return;

        console.log("Students response:", response.data);
        setStudents(data);
      } catch (err) {
        if (!active) return;

        console.error(
          "Failed to load students:",
          err.response?.data || err
        );

        setStudents([]);

        setError(
          err.response?.data?.detail ||
            "Unable to load students for this section."
        );
      } finally {
        if (active) setStudentsLoading(false);
      }
    }

    loadStudents();

    return () => {
      active = false;
    };
  }, [selectedSection]);

  if (loading) {
    return (
      <main className="teacher-page">
        <h1>My Students</h1>
        <p>Loading assigned sections...</p>
      </main>
    );
  }

  return (
    <main className="teacher-page">
      <header className="teacher-page-heading">
        <div>
          <p className="teacher-eyebrow">TEACHING</p>
          <h1>My Students</h1>
          <p>
            View students belonging to your assigned academic sections.
          </p>
        </div>
      </header>

      {error && (
        <div className="teacher-alert" role="alert">
          {error}
        </div>
      )}

      {sections.length > 0 && (
        <section className="teacher-panel">
          <label htmlFor="teacher-section">
            <strong>Select Academic Section</strong>
          </label>

          <select
            id="teacher-section"
            value={selectedSection}
            onChange={(event) =>
              setSelectedSection(event.target.value)
            }
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.code}
              </option>
            ))}
          </select>
        </section>
      )}

      {sections.length === 0 && !error && (
        <section className="teacher-panel">
          <h2>No assigned sections</h2>
          <p>
            No academic sections are linked to your assigned subjects.
          </p>
        </section>
      )}

      {studentsLoading && <p>Loading students...</p>}

      {!studentsLoading &&
        sections.length > 0 &&
        !error &&
        students.length === 0 && (
          <section className="teacher-panel">
            <h2>No students found</h2>
            <p>
              No students were returned for the selected section.
            </p>
          </section>
        )}

      {!studentsLoading && students.length > 0 && (
        <section className="teacher-panel">
          <h2>Student List</h2>
          <p>
            Total students: <strong>{students.length}</strong>
          </p>

          <div className="teacher-table-container">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student, index) => (
                  <tr
                    key={
                      student.student_id ??
                      student.id ??
                      index
                    }
                  >
                    <td>
                      {student.student_id ??
                        student.id ??
                        "—"}
                    </td>

                    <td>{student.name || "—"}</td>

                    <td>
                      {student.user_email ||
                        student.email ||
                        "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

export default TeacherStudents;
