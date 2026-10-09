import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./StudentPortal.css";

function StudentAttendance() {
  const [attendanceData, setAttendanceData] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/attendance/student");
      const data = response.data;

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("The server returned an unexpected attendance response.");
      }

      if (!Array.isArray(data.subjects)) {
        throw new Error(
          "The attendance response does not contain a subjects list."
        );
      }

      setAttendanceData(data);
    } catch (err) {
      const statusCode = err.response?.status;
      const detail = err.response?.data?.detail;

      let message;

      if (err.message && !err.response) {
        message = err.message;
      } else if (statusCode === 401) {
        message = "Your session has expired. Please log in again.";
      } else if (statusCode === 403) {
        message = "You do not have permission to view this attendance.";
      } else if (Array.isArray(detail)) {
        message = detail
          .map((item) =>
            typeof item === "string"
              ? item
              : item.msg || JSON.stringify(item)
          )
          .join("; ");
      } else if (typeof detail === "string") {
        message = detail;
      } else {
        message = "Unable to load attendance. Please try again.";
      }

      setError(message);
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const subjects = attendanceData?.subjects ?? [];

  const filteredSubjects = useMemo(() => {
    if (selectedSubject === "ALL") {
      return subjects;
    }

    return subjects.filter(
      (subject) => String(subject.subject_code) === selectedSubject
    );
  }, [subjects, selectedSubject]);

  const getStatus = (status) =>
    String(status ?? "").trim().toLowerCase();

  const getStatusClass = (status) => {
    const normalized = getStatus(status);

    if (["present", "p"].includes(normalized)) {
      return "status-present";
    }

    if (["absent", "a"].includes(normalized)) {
      return "status-absent";
    }

    if (["late", "l"].includes(normalized)) {
      return "status-late";
    }

    return "status-unknown";
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const dateString = String(value).slice(0, 10);
    const parts = dateString.split("-");

    if (
      parts.length !== 3 ||
      !parts.every((part) => /^\d+$/.test(part))
    ) {
      return String(value);
    }

    const [year, month, day] = parts.map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="student-page">
        <div className="student-loading">
          Loading your attendance...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-page">
        <div className="student-page-header">
          <div>
            <h1>My Attendance</h1>
            <p>View your attendance subject-wise.</p>
          </div>
        </div>

        <div className="student-error" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="student-btn"
            onClick={loadAttendance}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <h1>My Attendance</h1>
          <p>
            Select a subject to view your attendance percentage
            and daily records.
          </p>
        </div>

        <button
          type="button"
          className="student-btn"
          onClick={loadAttendance}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="student-profile-summary">
        <div>
          <span className="student-label">Student Name</span>
          <h3>{attendanceData?.student_name || "Student"}</h3>
        </div>

        <div>
          <span className="student-label">Student ID</span>
          <h3>{attendanceData?.student_id || "—"}</h3>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="student-empty-state">
          <h3>No Attendance Records Yet</h3>
          <p>
            Your subject-wise attendance will appear here
            after your teachers record attendance.
          </p>
        </div>
      ) : (
        <>
          {/* Subject selector */}
          <div className="student-subject-selector">
            <label htmlFor="attendance-subject">
              Select Subject
            </label>

            <select
              id="attendance-subject"
              value={selectedSubject}
              onChange={(event) =>
                setSelectedSubject(event.target.value)
              }
            >
              <option value="ALL">All Subjects</option>

              {subjects.map((subject, index) => (
                <option
                  key={subject.subject_code || index}
                  value={String(subject.subject_code)}
                >
                  {subject.subject_code || "Subject"} —{" "}
                  {subject.subject_name || subject.subject_code}
                </option>
              ))}
            </select>
          </div>

          <div className="student-subject-list">
            {filteredSubjects.map((subject, index) => {
              const records = Array.isArray(subject.records)
                ? [...subject.records].sort((a, b) =>
                    String(b.date || "").localeCompare(
                      String(a.date || "")
                    )
                  )
                : [];

              const presentCount = records.filter((record) =>
                ["present", "p"].includes(getStatus(record.status))
              ).length;

              const absentCount = records.filter((record) =>
                ["absent", "a"].includes(getStatus(record.status))
              ).length;

              const lateCount = records.filter((record) =>
                ["late", "l"].includes(getStatus(record.status))
              ).length;

              const totalClasses = records.length;

              const percentage =
                totalClasses > 0
                  ? (presentCount / totalClasses) * 100
                  : 0;

              const subjectCode =
                subject.subject_code || `subject-${index}`;

              return (
                <section
                  className="student-attendance-card"
                  key={subjectCode}
                >
                  <div className="student-attendance-card-header">
                    <div>
                      <h2>
                        {subject.subject_name || subjectCode}
                      </h2>

                      <p className="student-subject-code">
                        {subject.subject_code ||
                          "Subject code unavailable"}
                      </p>
                    </div>

                    <div className="student-attendance-percentage">
                      <strong>{percentage.toFixed(2)}%</strong>
                      <span>Attendance</span>
                    </div>
                  </div>

                  <div
                    className="student-progress-track"
                    role="progressbar"
                    aria-label={`${subjectCode} attendance percentage`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Number(percentage.toFixed(2))}
                  >
                    <div
                      className="student-progress-fill"
                      style={{
                        width: `${Math.min(100, percentage)}%`,
                      }}
                    />
                  </div>

                  <div className="student-attendance-stats">
                    <div>
                      <span>Present</span>
                      <strong>{presentCount}</strong>
                    </div>

                    <div>
                      <span>Absent</span>
                      <strong>{absentCount}</strong>
                    </div>

                    <div>
                      <span>Late</span>
                      <strong>{lateCount}</strong>
                    </div>

                    <div>
                      <span>Total Classes</span>
                      <strong>{totalClasses}</strong>
                    </div>
                  </div>

                  <div className="student-attendance-history">
                    <h3>Attendance History</h3>

                    {records.length === 0 ? (
                      <p className="student-muted">
                        No attendance entries for this subject yet.
                      </p>
                    ) : (
                      <div className="student-table-wrapper">
                        <table className="student-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Status</th>
                            </tr>
                          </thead>

                          <tbody>
                            {records.map((record, recordIndex) => (
                              <tr
                                key={`${record.date || "no-date"}-${recordIndex}`}
                              >
                                <td>{formatDate(record.date)}</td>

                                <td>
                                  <span
                                    className={`student-status-badge ${getStatusClass(
                                      record.status
                                    )}`}
                                  >
                                    {record.status || "Not recorded"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default StudentAttendance;