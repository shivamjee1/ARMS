import { useEffect, useState } from "react";
import api from "../services/api";
import "./Students.css";

function Students() {
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    user_email: "",
    section_id: "",
    name: "",
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/students");
      setStudents(response.data);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get("/academic-sections");
      setSections(response.data);
    } catch (error) {
      console.error("Failed to fetch sections:", error);
      setFormError("Failed to load academic sections.");
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchSections();
  }, []);

  const openForm = () => {
    setFormError("");

    setFormData({
      id: "",
      user_email: "",
      section_id: "",
      name: "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (formLoading) return;

    setShowForm(false);
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();

    setFormError("");
    setFormLoading(true);

    try {
      await api.post("/students", {
        id: Number(formData.id),
        user_email: formData.user_email,
        section_id: Number(formData.section_id),
        name: formData.name,
      });

      setShowForm(false);

      setFormData({
        id: "",
        user_email: "",
        section_id: "",
        name: "",
      });

      await fetchStudents();
    } catch (error) {
      console.error("Failed to create student:", error);

      if (error.response?.data?.detail) {
        setFormError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        );
      } else {
        setFormError("Failed to create student.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="page-label">STUDENT MANAGEMENT</p>

          <h1>Students</h1>

          <p className="page-description">
            View and manage student academic information.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            className="page-refresh-button"
            onClick={fetchStudents}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="page-action-button"
            onClick={openForm}
          >
            + Add Student
          </button>
        </div>
      </div>

      {/* Page Error */}
      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      {/* Student Count */}
      <div className="table-summary">
        <div>
          <span>Total Students</span>
          <strong>{students.length}</strong>
        </div>
      </div>

      {/* Students Table */}
      <div className="table-card">

        <div className="table-card-header">
          <div>
            <h2>Student Records</h2>
            <p>Currently registered students</p>
          </div>
        </div>

        {loading ? (
          <div className="table-state">
            <p>Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="table-state">
            <h3>No students found</h3>
            <p>
              There are currently no student records in the system.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">

              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Section</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>

                    <td>
                      <span className="table-id">
                        {student.id}
                      </span>
                    </td>

                    <td>
                      <strong className="student-name">
                        {student.name}
                      </strong>
                    </td>

                    <td>
                      {student.user_email}
                    </td>

                    <td>
                      <span className="section-badge">
                        {student.section_id}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

      {/* Add Student Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>

          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <div>
                <p className="modal-label">
                  STUDENT MANAGEMENT
                </p>

                <h2>Add Student</h2>

                <p>
                  Create a student profile for an existing student account.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeForm}
                disabled={formLoading}
              >
                ×
              </button>
            </div>

            <form
              className="student-form"
              onSubmit={handleCreateStudent}
            >

              {/* Student ID */}
              <div className="form-group">
                <label htmlFor="student-id">
                  Student ID
                </label>

                <input
                  id="student-id"
                  name="id"
                  type="number"
                  min="1000000"
                  max="9999999"
                  placeholder="Enter 7-digit student ID"
                  value={formData.id}
                  onChange={handleChange}
                  required
                />

                <small>
                  Student ID must contain 7 digits.
                </small>
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="student-email">
                  Student Email
                </label>

                <input
                  id="student-email"
                  name="user_email"
                  type="email"
                  placeholder="student@example.com"
                  value={formData.user_email}
                  onChange={handleChange}
                  required
                />

                <small>
                  The email must belong to an existing student account.
                </small>
              </div>

              {/* Name */}
              <div className="form-group">
                <label htmlFor="student-name">
                  Student Name
                </label>

                <input
                  id="student-name"
                  name="name"
                  type="text"
                  placeholder="Enter student name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Section */}
              <div className="form-group">
                <label htmlFor="student-section">
                  Academic Section
                </label>

                <select
                  id="student-section"
                  name="section_id"
                  value={formData.section_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select academic section
                  </option>

                  {sections.map((section) => (
                    <option
                      key={section.id}
                      value={section.id}
                    >
                      {section.batch} - {section.section_code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Error */}
              {formError && (
                <div className="form-error">
                  {formError}
                </div>
              )}

              {/* Buttons */}
              <div className="modal-actions">

                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={closeForm}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit-button"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Creating..."
                    : "Create Student"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Students;