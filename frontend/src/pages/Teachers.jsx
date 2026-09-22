import { useEffect, useState } from "react";
import api from "../services/api";
import "./Teachers.css";

function Teachers() {
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    user_email: "",
    name: "",
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/teachers");
      setTeachers(response.data);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);

      if (error.response?.status === 403) {
        setError("You are not authorized to view teachers.");
      } else {
        setError("Failed to load teachers.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openForm = () => {
    setFormData({
      id: "",
      user_email: "",
      name: "",
    });

    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (formLoading) return;

    setShowForm(false);
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateTeacher = async (event) => {
    event.preventDefault();

    setFormError("");
    setFormLoading(true);

    try {
      await api.post("/teachers", {
        id: formData.id,
        user_email: formData.user_email,
        name: formData.name,
      });

      setShowForm(false);

      setFormData({
        id: "",
        user_email: "",
        name: "",
      });

      await fetchTeachers();
    } catch (error) {
      console.error("Failed to create teacher:", error);

      if (error.response?.data?.detail) {
        setFormError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        );
      } else {
        setFormError("Failed to create teacher.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="teachers-page">
      {/* PAGE HEADER */}
      <div className="teachers-page-header">
        <div>
          <p className="teachers-page-label">TEACHER MANAGEMENT</p>

          <h1>Teachers</h1>

          <p className="teachers-page-description">
            View and manage teacher profiles in the system.
          </p>
        </div>

        <div className="teachers-header-actions">
          <button
            className="teachers-refresh-button"
            onClick={fetchTeachers}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="teachers-add-button"
            onClick={openForm}
          >
            + Add Teacher
          </button>
        </div>
      </div>

      {/* PAGE ERROR */}
      {error && (
        <div className="teachers-error">
          {error}
        </div>
      )}

      {/* SUMMARY */}
      <div className="teachers-summary">
        <div>
          <span>Total Teachers</span>
          <strong>{teachers.length}</strong>
        </div>
      </div>

      {/* TABLE */}
      <div className="teachers-table-card">
        <div className="teachers-table-header">
          <h2>Teacher Records</h2>

          <p>
            Currently registered teacher profiles.
          </p>
        </div>

        {loading ? (
          <div className="teachers-table-state">
            <p>Loading teachers...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="teachers-table-state">
            <h3>No teachers found</h3>

            <p>
              There are currently no teacher profiles in the system.
            </p>
          </div>
        ) : (
          <div className="teachers-table-wrapper">
            <table className="teachers-data-table">
              <thead>
                <tr>
                  <th>Teacher ID</th>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>

              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>
                      <span className="teachers-id">
                        {teacher.id}
                      </span>
                    </td>

                    <td>
                      <strong className="teachers-name">
                        {teacher.name}
                      </strong>
                    </td>

                    <td>
                      {teacher.user_email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE TEACHER MODAL */}
      {showForm && (
        <div
          className="teachers-modal-overlay"
          onClick={closeForm}
        >
          <div
            className="teachers-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="teachers-modal-header">
              <div>
                <p className="teachers-modal-label">
                  TEACHER MANAGEMENT
                </p>

                <h2>Add Teacher</h2>

                <p>
                  Create a teacher profile for an existing teacher
                  account.
                </p>
              </div>

              <button
                className="teachers-modal-close"
                onClick={closeForm}
                disabled={formLoading}
              >
                ×
              </button>
            </div>

            <form
              className="teachers-form"
              onSubmit={handleCreateTeacher}
            >
              {/* TEACHER ID */}
              <div className="teachers-form-group">
                <label htmlFor="teacher-id">
                  Teacher ID
                </label>

                <input
                  id="teacher-id"
                  name="id"
                  type="text"
                  placeholder="Example: TCH001"
                  value={formData.id}
                  onChange={handleChange}
                  required
                />

                <small>
                  Enter the teacher's unique ID.
                </small>
              </div>

              {/* EMAIL */}
              <div className="teachers-form-group">
                <label htmlFor="teacher-email">
                  Teacher Email
                </label>

                <input
                  id="teacher-email"
                  name="user_email"
                  type="email"
                  placeholder="teacher@example.com"
                  value={formData.user_email}
                  onChange={handleChange}
                  required
                />

                <small>
                  The email must belong to an existing teacher
                  account.
                </small>
              </div>

              {/* NAME */}
              <div className="teachers-form-group">
                <label htmlFor="teacher-name">
                  Teacher Name
                </label>

                <input
                  id="teacher-name"
                  name="name"
                  type="text"
                  placeholder="Enter teacher name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* FORM ERROR */}
              {formError && (
                <div className="teachers-form-error">
                  {formError}
                </div>
              )}

              {/* ACTIONS */}
              <div className="teachers-modal-actions">
                <button
                  type="button"
                  className="teachers-cancel-button"
                  onClick={closeForm}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="teachers-submit-button"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Creating..."
                    : "Create Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teachers;