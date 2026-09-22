import { useEffect, useState } from "react";
import api from "../services/api";
import "./Assessments.css";

function Assessments() {
  const [assessments, setAssessments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    max_marks: "",
  });

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/assessments");

      console.log("Assessments response:", response.data);

      setAssessments(response.data);
    } catch (error) {
      console.error("Assessments error:", error);

      if (error.response?.data?.detail) {
        setError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        );
      } else {
        setError("Failed to load assessments.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const openCreateForm = () => {
    setEditingAssessment(null);

    setFormData({
      name: "",
      max_marks: "",
    });

    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (assessment) => {
    setEditingAssessment(assessment);

    setFormData({
      name: assessment.name,
      max_marks: assessment.max_marks,
    });

    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (formLoading) return;

    setShowForm(false);
    setEditingAssessment(null);
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
        name: formData.name,
        max_marks: Number(formData.max_marks),
      };

      if (editingAssessment) {
        await api.put(
          `/assessments/${editingAssessment.id}`,
          data
        );
      } else {
        await api.post("/assessments", data);
      }

      setShowForm(false);
      setEditingAssessment(null);

      await fetchAssessments();
    } catch (error) {
      console.error("Failed to save assessment:", error);

      if (error.response?.data?.detail) {
        setFormError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        );
      } else {
        setFormError(
          editingAssessment
            ? "Failed to update assessment."
            : "Failed to create assessment."
        );
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (assessment) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${assessment.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/assessments/${assessment.id}`);

      await fetchAssessments();
    } catch (error) {
      console.error("Failed to delete assessment:", error);

      if (error.response?.data?.detail) {
        setError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        );
      } else {
        setError("Failed to delete assessment.");
      }
    }
  };

  return (
    <div className="assessments-page">

      <div className="assessments-page-header">
        <div>
          <p className="assessments-page-label">
            ACADEMIC MANAGEMENT
          </p>

          <h1>Assessments</h1>

          <p className="assessments-page-description">
            Manage assessment types and maximum marks.
          </p>
        </div>

        <div className="assessments-header-actions">
          <button
            className="assessments-refresh-button"
            onClick={fetchAssessments}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="assessments-add-button"
            onClick={openCreateForm}
          >
            + Add Assessment
          </button>
        </div>
      </div>

      {error && (
        <div className="assessments-error">
          {error}
        </div>
      )}

      <div className="assessments-summary">
        <div>
          <span>Total Assessments</span>
          <strong>{assessments.length}</strong>
        </div>
      </div>

      <div className="assessments-table-card">

        <div className="assessments-table-header">
          <h2>Assessment Records</h2>
          <p>Currently configured assessments.</p>
        </div>

        {loading ? (
          <div className="assessments-table-state">
            <p>Loading assessments...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="assessments-table-state">
            <h3>No assessments found</h3>
            <p>
              There are currently no assessments in the system.
            </p>
          </div>
        ) : (
          <div className="assessments-table-wrapper">

            <table className="assessments-data-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Assessment</th>
                  <th>Maximum Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.id}>

                    <td>
                      <span className="assessment-id">
                        {assessment.id}
                      </span>
                    </td>

                    <td>
                      <strong className="assessment-name">
                        {assessment.name}
                      </strong>
                    </td>

                    <td>
                      <span className="assessment-marks">
                        {assessment.max_marks}
                      </span>
                    </td>

                    <td>
                      <div className="assessment-actions">

                        <button
                          className="assessment-edit-button"
                          onClick={() =>
                            openEditForm(assessment)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="assessment-delete-button"
                          onClick={() =>
                            handleDelete(assessment)
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

      {showForm && (
        <div
          className="assessments-modal-overlay"
          onClick={closeForm}
        >
          <div
            className="assessments-modal-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="assessments-modal-header">

              <div>
                <p className="assessments-modal-label">
                  ACADEMIC MANAGEMENT
                </p>

                <h2>
                  {editingAssessment
                    ? "Edit Assessment"
                    : "Add Assessment"}
                </h2>

                <p>
                  {editingAssessment
                    ? "Update assessment information."
                    : "Create a new assessment."}
                </p>
              </div>

              <button
                className="assessments-modal-close"
                onClick={closeForm}
                disabled={formLoading}
              >
                ×
              </button>

            </div>

            <form
              className="assessments-form"
              onSubmit={handleSubmit}
            >

              <div className="assessments-form-group">

                <label htmlFor="assessment-name">
                  Assessment Name
                </label>

                <input
                  id="assessment-name"
                  name="name"
                  type="text"
                  placeholder="Example: Assessment 1"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="assessments-form-group">

                <label htmlFor="assessment-marks">
                  Maximum Marks
                </label>

                <input
                  id="assessment-marks"
                  name="max_marks"
                  type="number"
                  min="1"
                  placeholder="Example: 20"
                  value={formData.max_marks}
                  onChange={handleChange}
                  required
                />

              </div>

              {formError && (
                <div className="assessments-form-error">
                  {formError}
                </div>
              )}

              <div className="assessments-modal-actions">

                <button
                  type="button"
                  className="assessments-cancel-button"
                  onClick={closeForm}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="assessments-submit-button"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving..."
                    : editingAssessment
                    ? "Update Assessment"
                    : "Create Assessment"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default Assessments;