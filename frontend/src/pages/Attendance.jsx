import { useEffect, useState } from "react";
import api from "../services/api";
import "./Attendance.css";

function Attendance() {
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [register, setRegister] = useState(null);
  const [dailyAttendance, setDailyAttendance] = useState([]);

  const [registerFilters, setRegisterFilters] = useState({
    section_id: "",
    subject_code: "",
  });

  const [updateFilters, setUpdateFilters] = useState({
    section_id: "",
    subject_code: "",
    date: "",
  });

  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [saving, setSaving] = useState(false);

  const [registerError, setRegisterError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // --------------------------------------------------
  // LOAD SECTIONS AND SUBJECTS
  // --------------------------------------------------

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      const [sectionsResponse, subjectsResponse] = await Promise.all([
        api.get("/academic-sections"),
        api.get("/subjects"),
      ]);

      setSections(sectionsResponse.data);
      setSubjects(subjectsResponse.data);
    } catch (error) {
      console.error("Failed to load attendance support data:", error);

      const message =
        error.response?.data?.detail ||
        "Failed to load sections or subjects.";

      setRegisterError(message);
      setUpdateError(message);
    }
  };

  // --------------------------------------------------
  // REGISTER
  // --------------------------------------------------

  const handleRegisterFilterChange = (event) => {
    const { name, value } = event.target;

    setRegisterFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const loadRegister = async () => {
    if (!registerFilters.section_id) {
      setRegisterError("Please select an academic section.");
      return;
    }

    if (!registerFilters.subject_code) {
      setRegisterError("Please select a subject.");
      return;
    }

    try {
      setLoadingRegister(true);
      setRegisterError("");
      setSuccessMessage("");

      const response = await api.get("/attendance/register", {
        params: {
          section_id: registerFilters.section_id,
          subject_code: registerFilters.subject_code,
        },
      });

      setRegister(response.data);
    } catch (error) {
      console.error("Failed to load attendance register:", error);

      const message =
        error.response?.data?.detail ||
        "Failed to load attendance register.";

      setRegisterError(message);
      setRegister(null);
    } finally {
      setLoadingRegister(false);
    }
  };

  // --------------------------------------------------
  // UPDATE ATTENDANCE
  // --------------------------------------------------

  const handleUpdateFilterChange = (event) => {
    const { name, value } = event.target;

    setUpdateFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const loadDailyAttendance = async () => {
    if (!updateFilters.section_id) {
      setUpdateError("Please select an academic section.");
      return;
    }

    if (!updateFilters.subject_code) {
      setUpdateError("Please select a subject.");
      return;
    }

    if (!updateFilters.date) {
      setUpdateError("Please select a date.");
      return;
    }

    try {
      setLoadingDaily(true);
      setUpdateError("");
      setSuccessMessage("");

      const response = await api.get("/attendance/date", {
        params: {
          section_id: updateFilters.section_id,
          subject_code: updateFilters.subject_code,
          date: updateFilters.date,
        },
      });

      /*
       Expected response:

       [
         {
           student_id: "STU2301001",
           student_name: "Student 1",
           status: "P"
         }
       ]
      */

      setDailyAttendance(response.data);
    } catch (error) {
      console.error("Failed to load daily attendance:", error);

      const message =
        error.response?.data?.detail ||
        "Failed to load attendance for this date.";

      setUpdateError(message);
      setDailyAttendance([]);
    } finally {
      setLoadingDaily(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setDailyAttendance((previous) =>
      previous.map((student) =>
        String(student.student_id) === String(studentId)
          ? {
              ...student,
              status,
            }
          : student
      )
    );
  };

  const saveAttendance = async () => {
    if (dailyAttendance.length === 0) {
      setUpdateError("There are no attendance records to save.");
      return;
    }

    try {
      setSaving(true);
      setUpdateError("");
      setSuccessMessage("");

      await api.put("/attendance/date", {
        section_id: Number(updateFilters.section_id),
        subject_code: updateFilters.subject_code,
        date: updateFilters.date,
        records: dailyAttendance.map((student) => ({
          student_id: student.student_id,
          status: student.status,
        })),
      });

      setSuccessMessage(
        `Attendance saved successfully for ${updateFilters.date}.`
      );

      // Refresh register if it is currently showing
      if (
        register &&
        String(register.section_id) === String(updateFilters.section_id) &&
        register.subject_code === updateFilters.subject_code
      ) {
        await loadRegister();
      }
    } catch (error) {
      console.error("Failed to save attendance:", error);

      const message =
        error.response?.data?.detail ||
        "Failed to save attendance.";

      setUpdateError(message);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const getStatusClass = (status) => {
    switch (status) {
      case "P":
        return "attendance-present";

      case "A":
        return "attendance-absent";

      case "L":
        return "attendance-leave";

      default:
        return "attendance-not-marked";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "P":
        return "P";

      case "A":
        return "A";

      case "L":
        return "L";

      default:
        return "-";
    }
  };

  const getStudentPercentage = (student) => {
    if (student.percentage !== undefined && student.percentage !== null) {
      return Number(student.percentage).toFixed(2);
    }

    if (
      student.attendance_percentage !== undefined &&
      student.attendance_percentage !== null
    ) {
      return Number(student.attendance_percentage).toFixed(2);
    }

    if (!student.attendance || student.attendance.length === 0) {
      return "0.00";
    }

    const markedAttendance = student.attendance.filter(
      (item) =>
        item.status === "P" ||
        item.status === "A" ||
        item.status === "L"
    );

    if (markedAttendance.length === 0) {
      return "0.00";
    }

    const presentCount = markedAttendance.filter(
      (item) => item.status === "P"
    ).length;

    return ((presentCount / markedAttendance.length) * 100).toFixed(2);
  };

  const getRegisterDates = () => {
    if (!register) {
      return [];
    }

    if (Array.isArray(register.dates)) {
      return register.dates;
    }

    if (Array.isArray(register.attendance_dates)) {
      return register.attendance_dates;
    }

    // If backend returns students with attendance arrays
    if (Array.isArray(register.students)) {
      const dates = new Set();

      register.students.forEach((student) => {
        if (Array.isArray(student.attendance)) {
          student.attendance.forEach((item) => {
            if (item.date) {
              dates.add(item.date);
            }
          });
        }
      });

      return Array.from(dates).sort();
    }

    return [];
  };

  const getStudentAttendanceForDate = (student, date) => {
    if (!Array.isArray(student.attendance)) {
      return null;
    }

    const record = student.attendance.find(
      (item) => item.date === date
    );

    return record?.status || null;
  };

  const getStudentList = () => {
    if (!register) {
      return [];
    }

    if (Array.isArray(register.students)) {
      return register.students;
    }

    if (Array.isArray(register.records)) {
      return register.records;
    }

    return [];
  };

  const getSectionDisplay = (section) => {
    if (!section) return "";

    if (section.section_code !== undefined) {
      return section.section_code;
    }

    return section.id;
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="attendance-page">
      {/* HEADER */}

      <div className="attendance-page-header">
        <div>
          <div className="attendance-page-label">
            ACADEMIC MANAGEMENT
          </div>

          <h2>Attendance</h2>

          <p>
            View attendance registers and manage daily attendance.
          </p>
        </div>
      </div>

      {/* SUCCESS */}

      {successMessage && (
        <div className="attendance-success">
          {successMessage}
        </div>
      )}

      {/* ==================================================
          VIEW REGISTER
      ================================================== */}

      <section className="attendance-card">
        <div className="attendance-card-header">
          <div>
            <h3>View Attendance Register</h3>

            <p>
              View all students and their attendance for a subject.
            </p>
          </div>
        </div>

        <div className="attendance-filter-row">
          <div className="attendance-form-group">
            <label>Academic Section</label>

            <select
              name="section_id"
              value={registerFilters.section_id}
              onChange={handleRegisterFilterChange}
            >
              <option value="">Select Section</option>

              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {getSectionDisplay(section)}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-form-group">
            <label>Subject Code</label>

            <select
              name="subject_code"
              value={registerFilters.subject_code}
              onChange={handleRegisterFilterChange}
            >
              <option value="">Select Subject</option>

              {subjects.map((subject) => (
                <option key={subject.code} value={subject.code}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="attendance-primary-button"
            onClick={loadRegister}
            disabled={loadingRegister}
          >
            {loadingRegister ? "Loading..." : "Load Register"}
          </button>
        </div>

        {registerError && (
          <div className="attendance-error">
            {registerError}
          </div>
        )}
      </section>

      {/* REGISTER TABLE */}

      {register && (
        <section className="attendance-register-card">
          <div className="attendance-register-header">
            <div>
              <h3>
                {register.subject_code || registerFilters.subject_code}
                {register.subject_name
                  ? ` — ${register.subject_name}`
                  : ""}
              </h3>

              <p>
                Section:{" "}
                <strong>
                  {register.section_code ||
                    registerFilters.section_id}
                </strong>
              </p>
            </div>

            <div className="attendance-register-count">
              {getStudentList().length} Students
            </div>
          </div>

          <div className="attendance-register-wrapper">
            {getStudentList().length === 0 ? (
              <div className="attendance-empty">
                No students found for this section and subject.
              </div>
            ) : (
              <table className="attendance-register-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>

                    {getRegisterDates().map((date) => (
                      <th key={date} className="attendance-date-header">
                        {date}
                      </th>
                    ))}

                    <th className="attendance-percentage-header">
                      Attendance %
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {getStudentList().map((student) => (
                    <tr key={student.student_id || student.id}>
                      <td>
                        <span className="attendance-student-id">
                          {student.student_id || student.id}
                        </span>
                      </td>

                      <td>
                        <span className="attendance-student-name">
                          {student.student_name ||
                            student.name ||
                            "Unknown Student"}
                        </span>
                      </td>

                      {getRegisterDates().map((date) => {
                        const status =
                          getStudentAttendanceForDate(
                            student,
                            date
                          );

                        return (
                          <td key={date} className="attendance-status-cell">
                            <span
                              className={`attendance-status ${getStatusClass(
                                status
                              )}`}
                            >
                              {getStatusLabel(status)}
                            </span>
                          </td>
                        );
                      })}

                      <td className="attendance-percentage-cell">
                        <strong>
                          {getStudentPercentage(student)}%
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="attendance-register-legend">
            <span>
              <b className="legend-p">P</b> Present
            </span>

            <span>
              <b className="legend-a">A</b> Absent
            </span>

            <span>
              <b className="legend-l">L</b> Leave
            </span>
          </div>
        </section>
      )}

      {/* ==================================================
          UPDATE ATTENDANCE
      ================================================== */}

      <section className="attendance-card attendance-update-card">
        <div className="attendance-card-header">
          <div>
            <h3>Update Attendance</h3>

            <p>
              Select a section, subject and date to edit attendance.
            </p>
          </div>
        </div>

        <div className="attendance-filter-row">
          <div className="attendance-form-group">
            <label>Academic Section</label>

            <select
              name="section_id"
              value={updateFilters.section_id}
              onChange={handleUpdateFilterChange}
            >
              <option value="">Select Section</option>

              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {getSectionDisplay(section)}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-form-group">
            <label>Subject Code</label>

            <select
              name="subject_code"
              value={updateFilters.subject_code}
              onChange={handleUpdateFilterChange}
            >
              <option value="">Select Subject</option>

              {subjects.map((subject) => (
                <option key={subject.code} value={subject.code}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-form-group">
            <label>Date</label>

            <input
              type="date"
              name="date"
              value={updateFilters.date}
              onChange={handleUpdateFilterChange}
            />
          </div>

          <button
            className="attendance-primary-button"
            onClick={loadDailyAttendance}
            disabled={loadingDaily}
          >
            {loadingDaily ? "Loading..." : "Load Attendance"}
          </button>
        </div>

        {updateError && (
          <div className="attendance-error">
            {updateError}
          </div>
        )}

        {dailyAttendance.length > 0 && (
          <div className="attendance-update-section">
            <div className="attendance-update-title">
              <div>
                <h4>
                  Attendance for {updateFilters.date}
                </h4>

                <span>
                  {updateFilters.subject_code} · Section{" "}
                  {updateFilters.section_id}
                </span>
              </div>

              <div className="attendance-update-count">
                {dailyAttendance.length} Students
              </div>
            </div>

            <div className="attendance-update-table-wrapper">
              <table className="attendance-update-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Attendance</th>
                  </tr>
                </thead>

                <tbody>
                  {dailyAttendance.map((student) => (
                    <tr
                      key={
                        student.student_id ||
                        student.id
                      }
                    >
                      <td>
                        <span className="attendance-student-id">
                          {student.student_id || student.id}
                        </span>
                      </td>

                      <td>
                        <span className="attendance-student-name">
                          {student.student_name ||
                            student.name ||
                            "Unknown Student"}
                        </span>
                      </td>

                      <td>
                        <div className="attendance-status-buttons">
                          <button
                            type="button"
                            className={`status-button status-button-p ${
                              student.status === "P"
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleAttendanceChange(
                                student.student_id ||
                                  student.id,
                                "P"
                              )
                            }
                          >
                            P
                          </button>

                          <button
                            type="button"
                            className={`status-button status-button-a ${
                              student.status === "A"
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleAttendanceChange(
                                student.student_id ||
                                  student.id,
                                "A"
                              )
                            }
                          >
                            A
                          </button>

                          <button
                            type="button"
                            className={`status-button status-button-l ${
                              student.status === "L"
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleAttendanceChange(
                                student.student_id ||
                                  student.id,
                                "L"
                              )
                            }
                          >
                            L
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="attendance-save-container">
              <button
                className="attendance-save-button"
                onClick={saveAttendance}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Attendance"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Attendance;