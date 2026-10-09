import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./StudentPortal.css";

function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/students/dashboard");

      // Support either a direct response or a wrapped response.
      const body = response.data;
      const dashboard =
        body?.data ?? body?.dashboard ?? body;

      if (!dashboard || typeof dashboard !== "object") {
        throw new Error("The server returned an invalid dashboard response.");
      }

      setData(dashboard);
    } catch (err) {
      setData(null);

      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (status === 403) {
        setError("You do not have permission to access the student dashboard.");
      } else if (status === 404) {
        setError(
          "Student dashboard endpoint or student record was not found. Check GET /student/dashboard in your backend."
        );
      } else if (!err.response) {
        setError(
          "Unable to connect to the backend. Check your API base URL and backend status."
        );
      } else {
        setError(
          typeof detail === "string"
            ? detail
            : err.message || "Unable to load your dashboard."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const studentName =
    data?.student_name ||
    data?.name ||
    user?.name ||
    user?.full_name ||
    user?.email ||
    "Student";

  const studentId =
    data?.student_id ??
    data?.student_code ??
    data?.student?.student_id ??
    data?.student?.student_code;

  const sectionCode =
    data?.section_code ??
    data?.section_name ??
    data?.section?.section_code ??
    data?.section?.batch ??
    null;

  const attendancePercentage =
    data?.attendance_percentage ??
    data?.attendance_percent ??
    null;

  const publishedSubjects =
    data?.published_subjects ??
    data?.published_subject_count ??
    null;

  const recentResults = Array.isArray(data?.recent_results)
    ? data.recent_results
    : Array.isArray(data?.results)
      ? data.results
      : [];

  if (loading) {
    return (
      <main className="student-page">
        <p>Loading your dashboard...</p>
      </main>
    );
  }

  return (
    <main className="student-page">
      <header className="student-welcome">
        <p className="student-eyebrow">STUDENT PORTAL</p>

        <h1>Welcome, {studentName}</h1>

        <p>
          View your attendance, examination results, and academic
          information in one place.
        </p>
      </header>

      {error && (
        <div
          className="student-alert student-alert-error"
          role="alert"
        >
          <p>{error}</p>

          <button type="button" onClick={loadDashboard}>
            Try Again
          </button>
        </div>
      )}

      <section className="student-info-grid">
        <article className="student-info-card">
          <span>Student ID</span>
          <strong>{studentId ?? "Not available"}</strong>
        </article>

        <article className="student-info-card">
          <span>Academic Section</span>
          <strong>{sectionCode ?? "Not available"}</strong>
        </article>

        <article className="student-info-card">
          <span>Attendance</span>
          <strong>
            {attendancePercentage != null
              ? `${attendancePercentage}%`
              : "Not available"}
          </strong>
        </article>

        <article className="student-info-card">
          <span>Published Subjects</span>
          <strong>{publishedSubjects ?? "Not available"}</strong>
        </article>
      </section>

      <section className="student-panel">
        <h2>My Academics</h2>
        <p>Choose a page to view your academic records.</p>

        <div className="student-actions">
          <button
            type="button"
            onClick={() => navigate("/student/attendance")}
          >
            View Attendance →
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/results")}
          >
            View Results →
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/profile")}
          >
            View Profile →
          </button>
        </div>
      </section>

      <section className="student-panel">
        <h2>Recent Results</h2>

        {recentResults.length > 0 ? (
          <div className="student-table-wrapper">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Assessment</th>
                  <th>Marks</th>
                </tr>
              </thead>

              <tbody>
                {recentResults.map((item, index) => (
                  <tr key={item.id ?? index}>
                    <td>
                      {item.subject_name ||
                        item.subject_code ||
                        item.subject?.subject_code ||
                        "Subject"}
                    </td>

                    <td>
                      {item.assessment_name ||
                        item.assessment_type ||
                        item.assessment?.name ||
                        "Assessment"}
                    </td>

                    <td>
                      {item.marks ?? "—"}
                      {item.max_marks != null
                        ? ` / ${item.max_marks}`
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="student-muted">
            {error
              ? "Recent results could not be loaded."
              : "No recent results are available."}
          </p>
        )}
      </section>
    </main>
  );
}

export default StudentDashboard;
