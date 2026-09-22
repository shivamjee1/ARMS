import { useEffect, useState } from "react";
import api from "../services/api";
import "./Subjects.css";

function Subjects() {
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    credits: 3,
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/subjects");
      setSubjects(response.data);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);

      if (error.response?.status === 403) {
        setError("You are not authorized to view subjects.");
      } else {
        setError("Failed to load subjects.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openCreateForm = () => {
    setEditingSubject(null);

    setFormData({
      code: "",
      name: "",
      credits: 3,
    });

    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (subject) => {
    setEditingSubject(subject);

    setFormData({
      code: subject.code,
      name: subject.name,
      credits: subject.credits,
    });

    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (formLoading) return;

    setShowForm(false);
    setEditingSubject(null);
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setFormLoading(true);

    try {
      const data = {
        code: formData.code,
        name: formData.name,
        credits: Number(formData.credits),
      };

      if (editingSubject) {
        await api.put(
          `/subjects/${editingSubject.code}`,
          {
            name: data.name,
            credits: data.credits,
          }
        );
      } else {
        await api.post("/subjects", data);
      }

      closeForm();
      await fetchSubjects();
    } catch (error) {
      console.error("Failed to save subject:", error);

      if (error.response?.data?.detail) {
        setFormError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        );
      } else {
        setFormError(
          editingSubject
            ? "Failed to update subject."
            : "Failed to create subject."
        );
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (subject) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${subject.name}" (${subject.code})?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/subjects/${subject.code}`);

      await fetchSubjects();
    } catch (error) {
      console.error("Failed to delete subject:", error);

      if (error.response?.data?.detail) {
        setError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        );
      } else {
        setError("Failed to delete subject.");
      }
    }
  };

  return (
    <div className="subjects-page">

      {/* PAGE HEADER */}
      <div className="subjects-page-header">
        <div>
          <p className="subjects-page-label">
            SUBJECT MANAGEMENT
          </p>

          <h1>Subjects</h1>

          <p className="subjects-page-description">
            View and manage academic subjects in the system.
          </p>
        </div>

        <div className="subjects-header-actions">
          <button
            className="subjects-refresh-button"
            onClick={fetchSubjects}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="subjects-add-button"
            onClick={openCreateForm}
          >
            + Add Subject
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="subjects-error">
          {error}
        </div>
      )}

      {/* SUMMARY */}
      <div className="subjects-summary">
        <div>
          <span>Total Subjects</span>
          <strong>{subjects.length}</strong>
        </div>
      </div>

      {/* TABLE */}
      <div className="subjects-table-card">

        <div className="subjects-table-header">
          <div>
            <h2>Subject Records</h2>

            <p>
              Currently registered academic subjects.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="subjects-table-state">
            <p>Loading subjects...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="subjects-table-state">
            <h3>No subjects found</h3>

            <p>
              There are currently no subjects in the system.
            </p>
          </div>
        ) : (
          <div className="subjects-table-wrapper">
            <table className="subjects-data-table">

              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Credits</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.code}>

                    <td>
                      <span className="subjects-code">
                        {subject.code}
                      </span>
                    </td>

                    <td>
                      <strong className="subjects-name">
                        {subject.name}
                      </strong>
                    </td>

                    <td>
                      <span className="subjects-credit-badge">
                        {subject.credits}
                      </span>
                    </td>

                    <td>
                      <div className="subjects-actions">

                        <button
                          className="subjects-edit-button"
                          onClick={() =>
                            openEditForm(subject)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="subjects-delete-button"
                          onClick={() =>
                            handleDelete(subject)
                          }
                        >
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div
          className="subjects-modal-overlay"
          onClick={closeForm}
        >
          <div
            className="subjects-modal-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}
            <div className="subjects-modal-header">

              <div>
                <p className="subjects-modal-label">
                  SUBJECT MANAGEMENT
                </p>

                <h2>
                  {editingSubject
                    ? "Edit Subject"
                    : "Add Subject"}
                </h2>

                <p>
                  {editingSubject
                    ? "Update the subject information."
                    : "Create a new academic subject."}
                </p>
              </div>

              <button
                className="subjects-modal-close"
                onClick={closeForm}
                disabled={formLoading}
              >
                ×
              </button>

            </div>

            {/* FORM */}
            <form
              className="subjects-form"
              onSubmit={handleSubmit}
            >

              {/* CODE */}
              <div className="subjects-form-group">

                <label htmlFor="subject-code">
                  Subject Code
                </label>

                <input
                  id="subject-code"
                  name="code"
                  type="text"
                  placeholder="Example: EC0401"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={!!editingSubject}
                  required
                />

                <small>
                  Subject code must be unique.
                </small>

              </div>

              {/* NAME */}
              <div className="subjects-form-group">

                <label htmlFor="subject-name">
                  Subject Name
                </label>

                <input
                  id="subject-name"
                  name="name"
                  type="text"
                  placeholder="Example: Digital Electronics"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

              </div>

              {/* CREDITS */}
              <div className="subjects-form-group">

                <label htmlFor="subject-credits">
                  Credits
                </label>

                <input
                  id="subject-credits"
                  name="credits"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.credits}
                  onChange={handleChange}
                  required
                />

              </div>

              {/* FORM ERROR */}
              {formError && (
                <div className="subjects-form-error">
                  {formError}
                </div>
              )}

              {/* ACTIONS */}
              <div className="subjects-modal-actions">

                <button
                  type="button"
                  className="subjects-cancel-button"
                  onClick={closeForm}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="subjects-submit-button"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving..."
                    : editingSubject
                    ? "Update Subject"
                    : "Create Subject"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default Subjects;