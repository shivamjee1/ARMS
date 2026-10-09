
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./TeacherPortal.css";

function TeacherAttendance() {
  const [assignments, setAssignments] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("");

  const [register, setRegister] = useState(null);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load only this teacher's assignments.
  useEffect(() => {
    let active = true;

    async function loadAssignments() {
      setLoadingAssignments(true);
      setError("");

      try {
        const response = await api.get("/teachers/subjects");
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.items ?? response.data?.assignments ?? [];

        if (!active) return;

        setAssignments(data);

        const firstAssignment = data.find(
          (item) => item.section_id != null
        );

        if (firstAssignment) {
          setSelectedSectionId(String(firstAssignment.section_id));
          setSelectedSubjectCode(
            firstAssignment.subject_code ??
              firstAssignment.code ??
              ""
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Unable to load your assigned subjects and sections."
          );
        }
      } finally {
        if (active) setLoadingAssignments(false);
      }
    }

    loadAssignments();

    return () => {
      active = false;
    };
  }, []);

  // Get unique sections from the teacher's assignments.
  const sections = useMemo(() => {
    const unique = new Map();

    assignments.forEach((item) => {
      if (item.section_id == null) return;

      const id = String(item.section_id);

      if (!unique.has(id)) {
        unique.set(id, {
          id,
          label:
            item.section_code ??
            item.section_name ??
            item.section?.section_code ??
            id,
        });
      }
    });

    return Array.from(unique.values());
  }, [assignments]);

  // Get subjects assigned to the selected section.
  const subjects = useMemo(() => {
    const unique = new Map();

    assignments
      .filter(
        (item) =>
          item.section_id != null &&
          String(item.section_id) === selectedSectionId
      )
      .forEach((item) => {
        const code =
          item.subject_code ??
          item.code ??
          item.subject?.subject_code ??
          item.subject?.code;

        if (code && !unique.has(String(code))) {
          unique.set(String(code), {
            code: String(code),
            name:
              item.subject_name ??
              item.name ??
              item.subject?.subject_name ??
              item.subject?.name ??
              String(code),
          });
        }
      });

    return Array.from(unique.values());
  }, [assignments, selectedSectionId]);

  // Keep the selected subject valid when the section changes.
  useEffect(() => {
    if (!subjects.some((item) => item.code === selectedSubjectCode)) {
      setSelectedSubjectCode(subjects[0]?.code ?? "");
    }
  }, [subjects, selectedSubjectCode]);

  // Shared filter validation.
  const filtersReady = Boolean(
    selectedSectionId && selectedSubjectCode
  );

  // Load the full attendance register.
  async function loadRegister() {
    if (!filtersReady) {
      setError("Please select an assigned section and subject.");
      return;
    }

    setLoadingRegister(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.get("/attendance/register", {
        params: {
          section_id: selectedSectionId,
          subject_code: selectedSubjectCode,
        },
      });

      setRegister(response.data);
    } catch (err) {
      setRegister(null);
      setError(
        err.response?.data?.detail ||
          "Unable to load the attendance register."
      );
    } finally {
      setLoadingRegister(false);
    }
  }

  // Load attendance for the selected date.
  async function loadDailyAttendance() {
    if (!filtersReady || !attendanceDate) {
      setError("Please select a section, subject, and date.");
      return;
    }

    setLoadingDaily(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.get("/attendance/date", {
        params: {
          section_id: selectedSectionId,
          subject_code: selectedSubjectCode,
          date: attendanceDate,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.records ??
          response.data?.students ??
          [];

      setDailyAttendance(
        data.map((item) => ({
          ...item,
          student_id:
            item.student_id ??
            item.student?.student_id ??
            item.student?.id,
          student_name:
            item.student_name ??
            item.name ??
            item.student?.name ??
            item.student?.student_name ??
            "",
          status: normalizeStatus(item.status),
        }))
      );
    } catch (err) {
      setDailyAttendance([]);
      setError(
        err.response?.data?.detail ||
          "Unable to load attendance for this date."
      );
    } finally {
      setLoadingDaily(false);
    }
  }

  // Convert common backend status formats to consistent values.
  function normalizeStatus(status) {
    const value = String(status ?? "").trim().toLowerCase();

    if (value === "p" || value === "present") return "Present";
    if (value === "a" || value === "absent") return "Absent";
    if (value === "l" || value === "late") return "Late";

    return "";
  }

  // Direct one-click P / A / L selection.
  function handleStatusChange(studentId, status) {
    setDailyAttendance((previous) =>
      previous.map((student) =>
        String(student.student_id) === String(studentId)
          ? { ...student, status }
          : student
      )
    );

    setSuccess("");
    setError("");
  }

  // Save attendance using the existing backend endpoint.
  async function saveAttendance() {
    if (!filtersReady || !attendanceDate) {
      setError("Please select a section, subject, and date.");
      return;
    }

    if (dailyAttendance.length === 0) {
      setError("No student attendance records are available to save.");
      return;
    }

    const incomplete = dailyAttendance.some(
      (student) => !student.status
    );

    if (incomplete) {
      setError("Please mark P, A, or L for every student before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put("/attendance/date", {
        section_id: Number(selectedSectionId),
        subject_code: selectedSubjectCode,
        date: attendanceDate,
        records: dailyAttendance.map((student) => ({
          student_id: student.student_id,
          status: student.status,
        })),
      });

      setSuccess("Attendance saved successfully.");

      // Refresh the daily records after saving.
      const response = await api.get("/attendance/date", {
        params: {
          section_id: selectedSectionId,
          subject_code: selectedSubjectCode,
          date: attendanceDate,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.records ??
          response.data?.students ??
          [];

      setDailyAttendance(
        data.map((item) => ({
          ...item,
          student_id:
            item.student_id ??
            item.student?.student_id ??
            item.student?.id,
          student_name:
            item.student_name ??
            item.name ??
            item.student?.name ??
            item.student?.student_name ??
            "",
          status: normalizeStatus(item.status),
        }))
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to save attendance. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // Support different common register response shapes.
  const registerStudents = Array.isArray(register)
    ? register
    : register?.students ?? register?.records ?? [];

  const registerDates =
    register?.dates ??
    register?.attendance_dates ??
    register?.columns ??
    [];

  return (
    <div className="teacher-page">
      <div className="teacher-page-heading">
        <p className="teacher-eyebrow">TEACHER PORTAL</p>
        <h1>Manage Attendance</h1>
        <p>
          View attendance records and mark attendance for your assigned
          sections and subjects.
        </p>
      </div>

      {error && (
        <div className="teacher-alert teacher-alert-error">
          {String(error)}
        </div>
      )}

      {success && (
        <div className="teacher-alert teacher-alert-success">
          {success}
        </div>
      )}

      {loadingAssignments ? (
        <div className="teacher-panel">
          <p className="teacher-muted">Loading your assignments...</p>
        </div>
      ) : assignments.length === 0 || sections.length === 0 ? (
        <div className="teacher-panel">
          <h3>No assigned sections</h3>
          <p className="teacher-muted">
            No assigned sections were returned. Check that your teacher
            assignments include section_id and subject_code.
          </p>
        </div>
      ) : (
        <>
          <section className="teacher-panel">
            <div className="teacher-panel-heading">
              <h2>Attendance Register</h2>
              <p>View attendance history for your assigned subject.</p>
            </div>

            <div className="teacher-form-grid">
              <div className="teacher-field">
                <label htmlFor="register-section">Section</label>
                <select
                  id="register-section"
                  value={selectedSectionId}
                  onChange={(event) => {
                    setSelectedSectionId(event.target.value);
                    setRegister(null);
                  }}
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="teacher-field">
                <label htmlFor="register-subject">Subject</label>
                <select
                  id="register-subject"
                  value={selectedSubjectCode}
                  onChange={(event) => {
                    setSelectedSubjectCode(event.target.value);
                    setRegister(null);
                  }}
                >
                  {subjects.map((subject) => (
                    <option key={subject.code} value={subject.code}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              className="teacher-primary-button"
              onClick={loadRegister}
              disabled={!filtersReady || loadingRegister}
            >
              {loadingRegister ? "Loading..." : "View Register"}
            </button>

            {register && (
              <div className="teacher-table-wrapper">
                {registerStudents.length === 0 ? (
                  <p className="teacher-muted">
                    No attendance records found for this selection.
                  </p>
                ) : (
                  <table className="teacher-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>

                        {registerDates.map((date) => (
                          <th key={String(date)}>
                            {typeof date === "object"
                              ? date.date ?? date.label
                              : date}
                          </th>
                        ))}

                        <th>Attendance %</th>
                      </tr>
                    </thead>

                    <tbody>
                      {registerStudents.map((student, index) => {
                        const studentId =
                          student.student_id ??
                          student.id ??
                          student.student?.student_id ??
                          student.student?.id;

                        const attendance = student.attendance ?? [];

                        const dates =
                          registerDates.length > 0
                            ? registerDates
                            : attendance.map((item) => item.date);

                        const marked = attendance.filter((item) =>
                          ["p", "a", "l", "present", "absent", "late"].includes(
                            String(item.status ?? "").toLowerCase()
                          )
                        );

                        const present = attendance.filter((item) =>
                          ["p", "present"].includes(
                            String(item.status ?? "").toLowerCase()
                          )
                        ).length;

                        const percentage =
                          student.attendance_percentage ??
                          student.percentage ??
                          (marked.length
                            ? Math.round((present / marked.length) * 100)
                            : 0);

                        return (
                          <tr key={studentId ?? index}>
                            <td>{studentId ?? "-"}</td>
                            <td>
                              {student.student_name ??
                                student.name ??
                                student.student?.name ??
                                "-"}
                            </td>

                            {dates.map((date, dateIndex) => {
                              const dateValue =
                                typeof date === "object"
                                  ? date.date ?? date.label
                                  : date;

                              const record = attendance.find(
                                (item) =>
                                  String(item.date) === String(dateValue)
                              );

                              const status = normalizeStatus(
                                record?.status ??
                                  student[String(dateValue)]
                              );

                              return (
                                <td key={`${studentId}-${dateIndex}`}>
                                  {status === "Present"
                                    ? "P"
                                    : status === "Absent"
                                      ? "A"
                                      : status === "Late"
                                        ? "L"
                                        : "-"}
                                </td>
                              );
                            })}

                            <td>{percentage}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </section>

          <section className="teacher-panel">
            <div className="teacher-panel-heading">
              <h2>Mark Daily Attendance</h2>
              <p>
                Click P, A, or L beside each student, then save your
                attendance.
              </p>
            </div>

            <div className="teacher-form-grid">
              <div className="teacher-field">
                <label htmlFor="daily-section">Section</label>
                <select
                  id="daily-section"
                  value={selectedSectionId}
                  onChange={(event) => {
                    setSelectedSectionId(event.target.value);
                    setDailyAttendance([]);
                  }}
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="teacher-field">
                <label htmlFor="daily-subject">Subject</label>
                <select
                  id="daily-subject"
                  value={selectedSubjectCode}
                  onChange={(event) => {
                    setSelectedSubjectCode(event.target.value);
                    setDailyAttendance([]);
                  }}
                >
                  {subjects.map((subject) => (
                    <option key={subject.code} value={subject.code}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="teacher-field">
                <label htmlFor="attendance-date">Date</label>
                <input
                  id="attendance-date"
                  type="date"
                  value={attendanceDate}
                  onChange={(event) => {
                    setAttendanceDate(event.target.value);
                    setDailyAttendance([]);
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className="teacher-primary-button"
              onClick={loadDailyAttendance}
              disabled={!filtersReady || loadingDaily}
            >
              {loadingDaily ? "Loading..." : "Load Students"}
            </button>

            {loadingDaily ? (
              <p className="teacher-muted">Loading attendance...</p>
            ) : dailyAttendance.length > 0 ? (
              <>
                <div className="teacher-table-wrapper">
                  <table className="teacher-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Attendance Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dailyAttendance.map((student, index) => (
                        <tr
                          key={student.student_id ?? index}
                        >
                          <td>{student.student_id ?? "-"}</td>
                          <td>{student.student_name || "-"}</td>

                          <td>
                            <div className="attendance-options">
                              {[
                                {
                                  value: "Present",
                                  label: "P",
                                  className: "present",
                                },
                                {
                                  value: "Absent",
                                  label: "A",
                                  className: "absent",
                                },
                                {
                                  value: "Late",
                                  label: "L",
                                  className: "late",
                                },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={`attendance-option ${option.className} ${
                                    student.status === option.value
                                      ? "selected"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    handleStatusChange(
                                      student.student_id,
                                      option.value
                                    )
                                  }
                                  title={option.value}
                                  aria-label={`${option.value} for ${student.student_name || student.student_id}`}
                                  aria-pressed={
                                    student.status === option.value
                                  }
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  className="teacher-primary-button"
                  onClick={saveAttendance}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </>
            ) : (
              <p className="teacher-muted">
                Select the section, subject, and date, then click
                "Load Students".
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default TeacherAttendance;