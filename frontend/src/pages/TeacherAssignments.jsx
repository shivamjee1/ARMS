import { useEffect, useState } from "react";
import api from "../services/api";
import "./TeacherAssignments.css";

function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);

  const [teacherSearch, setTeacherSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    teacher_id: "",
    subject_code: "",
    section_id: "",
  });

  // =========================================================
  // LOAD ASSIGNMENTS
  // =========================================================

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/teacher-assignments");
      setAssignments(response.data);
    } catch (err) {
      console.error("Teacher assignments error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to load teacher assignments.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SEARCH BY TEACHER ID
  // =========================================================

  const searchTeacherAssignments = async () => {
    const teacherId = teacherSearch.trim();

    if (!teacherId) {
      setError("Please enter a teacher ID.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/teacher-assignments/teacher/${encodeURIComponent(
          teacherId
        )}`
      );

      setAssignments(response.data);
    } catch (err) {
      console.error("Teacher assignment search error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(
          `No assignments found for teacher ${teacherId}.`
        );
      }

      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESET SEARCH
  // =========================================================

  const resetSearch = async () => {
    setTeacherSearch("");
    await fetchAssignments();
  };

  // =========================================================
  // LOAD SUPPORTING DATA
  // =========================================================

  const fetchSupportData = async () => {
    try {
      const [teachersRes, subjectsRes, sectionsRes] =
        await Promise.all([
          api.get("/teachers"),
          api.get("/subjects"),
          api.get("/academic-sections"),
        ]);

      setTeachers(teachersRes.data);
      setSubjects(subjectsRes.data);
      setSections(sectionsRes.data);
    } catch (err) {
      console.error("Failed to load supporting data:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(
          "Failed to load teachers, subjects or sections."
        );
      }
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchSupportData();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(
      (item) => String(item.id) === String(teacherId)
    );

    if (!teacher) return "Unknown Teacher";

    return (
      teacher.name ||
      teacher.full_name ||
      teacher.teacher_name ||
      teacherId
    );
  };

  const getSubjectName = (subjectCode) => {
    const subject = subjects.find(
      (item) => item.code === subjectCode
    );

    return subject?.name || "";
  };

  const getSectionCode = (sectionId) => {
    const section = sections.find(
      (item) => String(item.id) === String(sectionId)
    );

    return section?.section_code ?? sectionId;
  };

  // =========================================================
  // MODAL
  // =========================================================

  const openAddModal = () => {
    setFormData({
      teacher_id: "",
      subject_code: "",
      section_id: "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (actionLoading) return;

    setShowModal(false);

    setFormData({
      teacher_id: "",
      subject_code: "",
      section_id: "",
    });
  };

  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // CREATE ASSIGNMENT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.teacher_id) {
      setError("Please select a teacher.");
      return;
    }

    if (!formData.subject_code) {
      setError("Please select a subject.");
      return;
    }

    if (!formData.section_id) {
      setError("Please select an academic section.");
      return;
    }

    try {
      setActionLoading(true);

      await api.post("/teacher-assignments", {
        teacher_id: formData.teacher_id,
        subject_code: formData.subject_code,
        section_id: Number(formData.section_id),
      });

      closeModal();

      /*
       * If a teacher search is active, keep that search.
       * Otherwise reload all assignments.
       */
      if (teacherSearch.trim()) {
        await searchTeacherAssignments();
      } else {
        await fetchAssignments();
      }
    } catch (err) {
      console.error("Create assignment error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create teacher assignment.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (assignment) => {
    const confirmed = window.confirm(
      `Delete this teacher assignment?\n\n` +
        `Teacher: ${getTeacherName(assignment.teacher_id)}\n` +
        `Subject: ${assignment.subject_code}\n` +
        `Section: ${getSectionCode(assignment.section_id)}`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      await api.delete(
        `/teacher-assignments/${assignment.id}`
      );

      if (teacherSearch.trim()) {
        await searchTeacherAssignments();
      } else {
        await fetchAssignments();
      }
    } catch (err) {
      console.error("Delete assignment error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to delete teacher assignment.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // ENTER KEY SEARCH
  // =========================================================

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      searchTeacherAssignments();
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="teacher-assignments-page">

      {/* PAGE HEADER */}

      <div className="teacher-assignments-header">

        <div>
          <div className="teacher-assignments-label">
            ACADEMIC MANAGEMENT
          </div>

          <h2>Teacher Assignments</h2>

          <p>
            View and manage subject assignments for teachers.
          </p>
        </div>

        <button
          className="teacher-assignment-add-button"
          onClick={openAddModal}
        >
          + Add Assignment
        </button>

      </div>

      {/* SEARCH */}

      <div className="teacher-assignment-search-card">

        <div className="teacher-assignment-search-title">
          Search Teacher Assignments
        </div>

        <div className="teacher-assignment-search-row">

          <div className="teacher-assignment-search-input-wrapper">

            <label>Teacher ID</label>

            <input
              type="text"
              value={teacherSearch}
              onChange={(e) =>
                setTeacherSearch(e.target.value)
              }
              onKeyDown={handleSearchKeyDown}
              placeholder="e.g. TCH001"
            />

          </div>

          <div className="teacher-assignment-search-actions">

            <button
              className="teacher-assignment-search-button"
              onClick={searchTeacherAssignments}
            >
              Search
            </button>

            <button
              className="teacher-assignment-reset-button"
              onClick={resetSearch}
            >
              Reset
            </button>

          </div>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="teacher-assignment-error">
          {error}
        </div>
      )}

      {/* TABLE */}

      <div className="teacher-assignment-table-card">

        <div className="teacher-assignment-table-header">

          <div>
            <h3>
              {teacherSearch.trim()
                ? `Assignments for ${teacherSearch.trim()}`
                : "All Teacher Assignments"}
            </h3>

            <span>
              {teacherSearch.trim()
                ? "Subjects and sections assigned to this teacher"
                : "All current teacher assignments"}
            </span>
          </div>

          <div className="teacher-assignment-count">
            {assignments.length} Records
          </div>

        </div>

        <div className="teacher-assignment-table-wrapper">

          {loading ? (
            <div className="teacher-assignment-state">
              Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="teacher-assignment-state">
              No teacher assignments found.
            </div>
          ) : (
            <table className="teacher-assignment-table">

              <thead>
                <tr>
                  <th>Assignment ID</th>
                  <th>Teacher</th>
                  <th>Subject</th>
                  <th>Section</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {assignments.map((assignment) => (
                  <tr key={assignment.id}>

                    <td>
                      <span className="assignment-id">
                        #{assignment.id}
                      </span>
                    </td>

                    <td>
                      <div className="assignment-teacher">

                        <strong>
                          {getTeacherName(
                            assignment.teacher_id
                          )}
                        </strong>

                        <span>
                          {assignment.teacher_id}
                        </span>

                      </div>
                    </td>

                    <td>
                      <div className="assignment-subject">

                        <span className="subject-code-badge">
                          {assignment.subject_code}
                        </span>

                        {getSubjectName(
                          assignment.subject_code
                        ) && (
                          <small>
                            {getSubjectName(
                              assignment.subject_code
                            )}
                          </small>
                        )}

                      </div>
                    </td>

                    <td>
                      <span className="section-code-badge">
                        {getSectionCode(
                          assignment.section_id
                        )}
                      </span>
                    </td>

                    <td>

                      <button
                        className="assignment-delete-button"
                        onClick={() =>
                          handleDelete(assignment)
                        }
                        disabled={actionLoading}
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>
          )}

        </div>

      </div>

      {/* ADD ASSIGNMENT MODAL */}

      {showModal && (
        <div className="teacher-assignment-modal-overlay">

          <div className="teacher-assignment-modal">

            <div className="teacher-assignment-modal-header">

              <div>
                <h3>Add Teacher Assignment</h3>

                <p>
                  Assign a teacher to a subject and section.
                </p>
              </div>

              <button
                className="teacher-assignment-close-button"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="teacher-assignment-form">

                {/* TEACHER */}

                <div className="teacher-assignment-form-group">

                  <label>Teacher</label>

                  <select
                    name="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Teacher
                    </option>

                    {teachers.map((teacher) => (
                      <option
                        key={teacher.id}
                        value={teacher.id}
                      >
                        {teacher.id} -{" "}
                        {teacher.name ||
                          teacher.full_name ||
                          teacher.teacher_name ||
                          "Teacher"}
                      </option>
                    ))}

                  </select>

                </div>

                {/* SUBJECT */}

                <div className="teacher-assignment-form-group">

                  <label>Subject</label>

                  <select
                    name="subject_code"
                    value={formData.subject_code}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Subject
                    </option>

                    {subjects.map((subject) => (
                      <option
                        key={subject.code}
                        value={subject.code}
                      >
                        {subject.code} - {subject.name}
                      </option>
                    ))}

                  </select>

                </div>

                {/* SECTION */}

                <div className="teacher-assignment-form-group">

                  <label>Academic Section</label>

                  <select
                    name="section_id"
                    value={formData.section_id}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Section
                    </option>

                    {sections.map((section) => (
                      <option
                        key={section.id}
                        value={section.id}
                      >
                        {section.section_code}
                      </option>
                    ))}

                  </select>

                </div>

              </div>

              {error && (
                <div className="teacher-assignment-modal-error">
                  {error}
                </div>
              )}

              <div className="teacher-assignment-modal-actions">

                <button
                  type="button"
                  className="teacher-assignment-cancel-button"
                  onClick={closeModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="teacher-assignment-save-button"
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Creating..."
                    : "Create Assignment"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default TeacherAssignments;