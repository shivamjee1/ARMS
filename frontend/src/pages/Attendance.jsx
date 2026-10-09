
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

  const [loadingSupport, setLoadingSupport] = useState(true);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [saving, setSaving] = useState(false);

  const [registerError, setRegisterError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [supportError, setSupportError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const getErrorMessage = (error, fallback) => {
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          typeof item === "string"
            ? item
            : item?.msg || "Invalid request"
        )
        .join(", ");
    }

    if (typeof error?.response?.data?.message === "string") {
      return error.response.data.message;
    }

    return fallback;
  };

  const normalizeStatus = (status) => {
    if (!status) return "";

    switch (String(status).trim().toLowerCase()) {
      case "p":
      case "present":
        return "P";

      case "a":
      case "absent":
        return "A";

      case "l":
      case "late":
      case "leave":
        return "L";

      default:
        return "";
    }
  };

  const statusForBackend = (status) => {
    switch (normalizeStatus(status)) {
      case "P":
        return "Present";

      case "A":
        return "Absent";

      case "L":
        return "Late";

      default:
        return "";
    }
  };

  const getStatusClass = (status) => {
    switch (normalizeStatus(status)) {
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
    return normalizeStatus(status) || "-";
  };

  const getStudentPercentage = (student) => {
    const percentage =
      student.attendance_percentage ?? student.percentage;

    if (percentage !== undefined && percentage !== null) {
      const numericPercentage = Number(percentage);

      return Number.isFinite(numericPercentage)
        ? numericPercentage.toFixed(2)
        : "0.00";
    }

    const attendance = Array.isArray(student.attendance)
      ? student.attendance
      : [];

    const marked = attendance
      .map((item) => normalizeStatus(item.status))
      .filter(Boolean);

    if (marked.length === 0) return "0.00";

    const presentCount = marked.filter(
      (status) => status === "P"
    ).length;

    return ((presentCount / marked.length) * 100).toFixed(2);
  };

  const getRegisterDates = () => {
    if (!register) return [];

    if (Array.isArray(register.dates)) {
      return register.dates;
    }

    if (Array.isArray(register.attendance_dates)) {
      return register.attendance_dates;
    }

    const dates = new Set();

    getStudentList().forEach((student) => {
      if (Array.isArray(student.attendance)) {
        student.attendance.forEach((item) => {
          if (item.date) dates.add(item.date);
        });
      }
    });

    return Array.from(dates).sort();
  };

  const getStudentAttendanceForDate = (student, date) => {
    if (!Array.isArray(student.attendance)) return null;

    const record = student.attendance.find(
      (item) => item.date === date
    );

    return record?.status ?? null;
  };

  const getStudentList = () => {
    if (!register) return [];

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

    return (
      section.section_code ??
      section.code ??
      section.id ??
      ""
    );
  };

  const getStudentId = (student) => {
    return student.student_id ?? student.id;
  };

  const getStudentName = (student) => {
    return (
      student.student_name ??
      student.name ??
      student.full_name ??
      "Unknown Student"
    );
  };

  // --------------------------------------------------
  // LOAD SECTIONS AND SUBJECTS
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    const fetchSupportData = async () => {
      try {
        setLoadingSupport(true);
        setSupportError("");

        const [sectionsResponse, subjectsResponse] =
          await Promise.all([
            api.get("/academic-sections"),
            api.get("/subjects"),
          ]);

        if (!active) return;

        setSections(
          Array.isArray(sectionsResponse.data)
            ? sectionsResponse.data
            : []
        );

        setSubjects(
          Array.isArray(subjectsResponse.data)
            ? subjectsResponse.data
            : []
        );
      } catch (error) {
        if (!active) return;

        console.error(
          "Failed to load sections or subjects:",
          error.response?.data || error
        );

        setSupportError(
          getErrorMessage(
            error,
            "Failed to load sections or subjects."
          )
        );
      } finally {
        if (active) setLoadingSupport(false);
      }
    };

    fetchSupportData();

    return () => {
      active = false;
    };
  }, []);

  // --------------------------------------------------
  // REGISTER FILTERS
  // --------------------------------------------------

  const handleRegisterFilterChange = (event) => {
    const { name, value } = event.target;

    setRegisterFilters((previous) => ({
      ...previous,
      [name]: value,
    }));

    setRegisterError("");
    setSuccessMessage("");
  };

  // --------------------------------------------------
  // LOAD ATTENDANCE REGISTER
  // GET /attendance/register
  // --------------------------------------------------

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
      setRegister(null);

      const response = await api.get("/attendance/register", {
        params: {
          section_id: registerFilters.section_id,
          subject_code: registerFilters.subject_code,
        },
      });

      const data = response.data;

      if (
        !data ||
        (!Array.isArray(data.students) &&
          !Array.isArray(data.records))
      ) {
        throw new Error(
          "Unexpected attendance register response from the server."
        );
      }

      setRegister(data);
    } catch (error) {
      console.error(
        "Failed to load attendance register:",
        error.response?.data || error
      );

      setRegisterError(
        getErrorMessage(
          error,
          error.message || "Failed to load attendance register."
        )
      );

      setRegister(null);
    } finally {
      setLoadingRegister(false);
    }
  };

  // --------------------------------------------------
  // UPDATE FILTERS
  // --------------------------------------------------

  const handleUpdateFilterChange = (event) => {
    const { name, value } = event.target;

    setUpdateFilters((previous) => ({
      ...previous,
      [name]: value,
    }));

    setUpdateError("");
    setSuccessMessage("");
  };

  // --------------------------------------------------
  // LOAD DAILY ATTENDANCE
  // GET /attendance/date
  // --------------------------------------------------

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
      setDailyAttendance([]);

      const response = await api.get("/attendance/date", {
        params: {
          section_id: updateFilters.section_id,
          subject_code: updateFilters.subject_code,
          date: updateFilters.date,
        },
      });

      if (!Array.isArray(response.data)) {
        throw new Error(
          "Unexpected daily attendance response from the server."
        );
      }

      const normalizedStudents = response.data.map((student) => ({
        ...student,
        student_id: getStudentId(student),
        student_name: getStudentName(student),
        status: normalizeStatus(student.status),
      }));

      setDailyAttendance(normalizedStudents);
    } catch (error) {
      console.error(
        "Failed to load daily attendance:",
        error.response?.data || error
      );

      setUpdateError(
        getErrorMessage(
          error,
          error.message || "Failed to load attendance for this date."
        )
      );

      setDailyAttendance([]);
    } finally {
      setLoadingDaily(false);
    }
  };

  // --------------------------------------------------
  // CHANGE A STUDENT'S ATTENDANCE STATUS
  // --------------------------------------------------

  const handleAttendanceChange = (studentId, status) => {
    setDailyAttendance((previous) =>
      previous.map((student) =>
        String(student.student_id) === String(studentId)
          ? { ...student, status }
          : student
      )
    );

    setUpdateError("");
    setSuccessMessage("");
  };

  // --------------------------------------------------
  // SAVE DAILY ATTENDANCE
  // PUT /attendance/date
  // --------------------------------------------------

  const saveAttendance = async () => {
    if (dailyAttendance.length === 0) {
      setUpdateError(
        "No students are available to save attendance."
      );
      return;
    }

    const unmarkedStudents = dailyAttendance.filter(
      (student) => !normalizeStatus(student.status)
    );

    if (unmarkedStudents.length > 0) {
      setUpdateError(
        `Please mark attendance for all students. ${unmarkedStudents.length} student(s) are unmarked.`
      );
      return;
    }

    try {
      setSaving(true);
      setUpdateError("");
      setSuccessMessage("");

      const payload = {
        section_id: Number(updateFilters.section_id),
        subject_code: updateFilters.subject_code,
        date: updateFilters.date,
        records: dailyAttendance.map((student) => ({
          student_id: String(student.student_id),
          status: statusForBackend(student.status),
        })),
      };

      await api.put("/attendance/date", payload);

      setSuccessMessage(
        `Attendance saved successfully for ${updateFilters.date}.`
      );

      // Refresh the register when it matches the saved subject and section.
      if (
        register &&
        String(register.section_id) ===
          String(registerFilters.section_id) &&
        register.subject_code === registerFilters.subject_code &&
        String(registerFilters.section_id) ===
          String(updateFilters.section_id) &&
        registerFilters.subject_code === updateFilters.subject_code
      ) {
        await loadRegister();
      }
    } catch (error) {
      console.error(
        "Failed to save attendance:",
        error.response?.data || error
      );

      setUpdateError(
        getErrorMessage(error, "Failed to save attendance.")
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="attendance-page">
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

      {supportError && (
        <div className="attendance-error">
          {supportError}
        </div>
      )}

      {successMessage && (
        <div className="attendance-success">
          {successMessage}
        </div>
      )}

      {/* VIEW REGISTER */}

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
            <label htmlFor="register-section">
              Academic Section
            </label>

            <select
              id="register-section"
              name="section_id"
              value={registerFilters.section_id}
              onChange={handleRegisterFilterChange}
              disabled={loadingSupport}
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
            <label htmlFor="register-subject">
              Subject Code
            </label>

            <select
              id="register-subject"
              name="subject_code"
              value={registerFilters.subject_code}
              onChange={handleRegisterFilterChange}
              disabled={loadingSupport}
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
            type="button"
            className="attendance-primary-button"
            onClick={loadRegister}
            disabled={loadingRegister || loadingSupport}
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
                {register.subject_code ||
                  registerFilters.subject_code}
                {register.subject_name
                  ? ` — ${register.subject_name}`
                  : ""}
              </h3>

              <p>
                Section:{" "}
                <strong>
                  {register.section_code ||
                    register.section_id ||
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
                      <th
                        key={date}
                        className="attendance-date-header"
                      >
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
                    <tr
                      key={getStudentId(student)}
                    >
                      <td>
                        <span className="attendance-student-id">
                          {getStudentId(student)}
                        </span>
                      </td>

                      <td>
                        <span className="attendance-student-name">
                          {getStudentName(student)}
                        </span>
                      </td>

                      {getRegisterDates().map((date) => {
                        const status =
                          getStudentAttendanceForDate(
                            student,
                            date
                          );

                        return (
                          <td
                            key={date}
                            className="attendance-status-cell"
                          >
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
              <b className="legend-l">L</b> Late
            </span>
          </div>
        </section>
      )}

      {/* UPDATE ATTENDANCE */}

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
            <label htmlFor="update-section">
              Academic Section
            </label>

            <select
              id="update-section"
              name="section_id"
              value={updateFilters.section_id}
              onChange={handleUpdateFilterChange}
              disabled={loadingSupport}
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
            <label htmlFor="update-subject">
              Subject Code
            </label>

            <select
              id="update-subject"
              name="subject_code"
              value={updateFilters.subject_code}
              onChange={handleUpdateFilterChange}
              disabled={loadingSupport}
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
            <label htmlFor="update-date">Date</label>

            <input
              id="update-date"
              type="date"
              name="date"
              value={updateFilters.date}
              onChange={handleUpdateFilterChange}
            />
          </div>

          <button
            type="button"
            className="attendance-primary-button"
            onClick={loadDailyAttendance}
            disabled={loadingDaily || loadingSupport}
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
                <h4>Attendance for {updateFilters.date}</h4>

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
                    <tr key={student.student_id}>
                      <td>
                        <span className="attendance-student-id">
                          {student.student_id}
                        </span>
                      </td>

                      <td>
                        <span className="attendance-student-name">
                          {student.student_name}
                        </span>
                      </td>

                      <td>
                        <div className="attendance-status-buttons">
                          <button
                            type="button"
                            className={`status-button status-button-p ${
                              normalizeStatus(student.status) === "P"
                                ? "selected"
                                : ""
                            }`}
                            aria-pressed={
                              normalizeStatus(student.status) === "P"
                            }
                            onClick={() =>
                              handleAttendanceChange(
                                student.student_id,
                                "P"
                              )
                            }
                          >
                            P
                          </button>

                          <button
                            type="button"
                            className={`status-button status-button-a ${
                              normalizeStatus(student.status) === "A"
                                ? "selected"
                                : ""
                            }`}
                            aria-pressed={
                              normalizeStatus(student.status) === "A"
                            }
                            onClick={() =>
                              handleAttendanceChange(
                                student.student_id,
                                "A"
                              )
                            }
                          >
                            A
                          </button>

                          <button
                            type="button"
                            className={`status-button status-button-l ${
                              normalizeStatus(student.status) === "L"
                                ? "selected"
                                : ""
                            }`}
                            aria-pressed={
                              normalizeStatus(student.status) === "L"
                            }
                            onClick={() =>
                              handleAttendanceChange(
                                student.student_id,
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
                type="button"
                className="attendance-save-button"
                onClick={saveAttendance}
                disabled={saving || loadingDaily}
              >
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>
        )}

        {!loadingDaily &&
          dailyAttendance.length === 0 &&
          !updateError &&
          updateFilters.section_id &&
          updateFilters.subject_code &&
          updateFilters.date && (
            <div className="attendance-empty">
              No students found for this section.
            </div>
          )}
      </section>
    </div>
  );
}

export default Attendance;