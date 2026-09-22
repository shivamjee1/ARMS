import { useEffect, useState } from "react";
import api from "../services/api";
import "./AcademicSections.css";

function AcademicSections() {
  const [sections, setSections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    batch: "",
    section_code: "",
  });

  const fetchSections = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await api.get("/academic-sections");

    console.log("Academic sections response:", response.data);

    setSections(response.data);
  } catch (error) {
        console.error("Academic sections error:", error);
        console.error("Status:", error.response?.status);
        console.error("Response:", error.response?.data);

        if (error.response?.data?.detail) {
        setError(
            typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        );
        } else if (error.response?.status === 401) {
        setError("Authentication required. Please login again.");
        } else if (error.response?.status === 403) {
        setError("You are not authorized to view academic sections.");
        } else if (error.response?.status === 404) {
        setError("Academic sections API endpoint was not found.");
        } else {
        setError("Failed to load academic sections.");
        }
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const openCreateForm = () => {
    setEditingSection(null);

    setFormData({
      id: "",
      batch: "",
      section_code: "",
    });

    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (section) => {
    setEditingSection(section);

    setFormData({
      id: section.id,
      batch: section.batch,
      section_code: section.section_code,
    });

    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (formLoading) return;

    setShowForm(false);
    setEditingSection(null);
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
        id: Number(formData.id),
        batch: Number(formData.batch),
        section_code: Number(formData.section_code),
      };

      if (editingSection) {
        await api.put(
          `/academic-sections/${editingSection.id}`,
          data
        );
      } else {
        await api.post("/academic-sections", data);
      }

      setShowForm(false);
      setEditingSection(null);

      await fetchSections();
    } catch (error) {
      console.error(
        "Failed to save academic section:",
        error
      );

      if (error.response?.data?.detail) {
        setFormError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        );
      } else {
        setFormError(
          editingSection
            ? "Failed to update academic section."
            : "Failed to create academic section."
        );
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (section) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete academic section ${section.batch}-${section.section_code}?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/academic-sections/${section.id}`
      );

      await fetchSections();
    } catch (error) {
      console.error(
        "Failed to delete academic section:",
        error
      );

      if (error.response?.data?.detail) {
        setError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        );
      } else {
        setError("Failed to delete academic section.");
      }
    }
  };

  return (
    <div className="academic-sections-page">

      {/* PAGE HEADER */}
      <div className="academic-sections-page-header">

        <div>
          <p className="academic-sections-page-label">
            ACADEMIC MANAGEMENT
          </p>

          <h1>Academic Sections</h1>

          <p className="academic-sections-page-description">
            View and manage academic batches and sections.
          </p>
        </div>

        <div className="academic-sections-header-actions">

          <button
            className="academic-sections-refresh-button"
            onClick={fetchSections}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="academic-sections-add-button"
            onClick={openCreateForm}
          >
            + Add Section
          </button>

        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="academic-sections-error">
          {error}
        </div>
      )}

      {/* SUMMARY */}
      <div className="academic-sections-summary">

        <div>
          <span>Total Sections</span>
          <strong>{sections.length}</strong>
        </div>

      </div>

      {/* TABLE */}
      <div className="academic-sections-table-card">

        <div className="academic-sections-table-header">

          <div>
            <h2>Academic Section Records</h2>

            <p>
              Currently registered academic sections.
            </p>
          </div>

        </div>

        {loading ? (
          <div className="academic-sections-table-state">
            <p>Loading academic sections...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="academic-sections-table-state">

            <h3>No academic sections found</h3>

            <p>
              There are currently no academic sections
              in the system.
            </p>

          </div>
        ) : (
          <div className="academic-sections-table-wrapper">

            <table className="academic-sections-data-table">

              <thead>
                <tr>
                  <th>Section ID</th>
                  <th>Batch</th>
                  <th>Section Code</th>
                  <th>Display</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {sections.map((section) => (
                  <tr key={section.id}>

                    <td>
                      <span className="academic-section-id">
                        {section.id}
                      </span>
                    </td>

                    <td>
                      <strong className="academic-section-batch">
                        {section.batch}
                      </strong>
                    </td>

                    <td>
                      <span className="academic-section-code">
                        {section.section_code}
                      </span>
                    </td>

                    <td>
                      <span className="academic-section-badge">
                        {section.batch}-{section.section_code}
                      </span>
                    </td>

                    <td>

                      <div className="academic-section-actions">

                        <button
                          className="academic-section-edit-button"
                          onClick={() =>
                            openEditForm(section)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="academic-section-delete-button"
                          onClick={() =>
                            handleDelete(section)
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
          className="academic-sections-modal-overlay"
          onClick={closeForm}
        >

          <div
            className="academic-sections-modal-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}
            <div className="academic-sections-modal-header">

              <div>

                <p className="academic-sections-modal-label">
                  ACADEMIC MANAGEMENT
                </p>

                <h2>
                  {editingSection
                    ? "Edit Academic Section"
                    : "Add Academic Section"}
                </h2>

                <p>
                  {editingSection
                    ? "Update the academic section information."
                    : "Create a new academic section."}
                </p>

              </div>

              <button
                className="academic-sections-modal-close"
                onClick={closeForm}
                disabled={formLoading}
              >
                ×
              </button>

            </div>

            {/* FORM */}
            <form
              className="academic-sections-form"
              onSubmit={handleSubmit}
            >

              {/* ID */}
              <div className="academic-sections-form-group">

                <label htmlFor="section-id">
                  Section ID
                </label>

                <input
                  id="section-id"
                  name="id"
                  type="number"
                  min="1"
                  placeholder="Example: 2301"
                  value={formData.id}
                  onChange={handleChange}
                  required
                />

                <small>
                  Unique ID of the academic section.
                </small>

              </div>

              {/* BATCH */}
              <div className="academic-sections-form-group">

                <label htmlFor="section-batch">
                  Batch
                </label>

                <input
                  id="section-batch"
                  name="batch"
                  type="number"
                  min="1"
                  placeholder="Example: 23"
                  value={formData.batch}
                  onChange={handleChange}
                  required
                />

              </div>

              {/* SECTION CODE */}
              <div className="academic-sections-form-group">

                <label htmlFor="section-code">
                  Section Code
                </label>

                <input
                  id="section-code"
                  name="section_code"
                  type="number"
                  min="1"
                  placeholder="Example: 1"
                  value={formData.section_code}
                  onChange={handleChange}
                  required
                />

              </div>

              {/* FORM ERROR */}
              {formError && (
                <div className="academic-sections-form-error">
                  {formError}
                </div>
              )}

              {/* ACTIONS */}
              <div className="academic-sections-modal-actions">

                <button
                  type="button"
                  className="academic-sections-cancel-button"
                  onClick={closeForm}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="academic-sections-submit-button"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving..."
                    : editingSection
                    ? "Update Section"
                    : "Create Section"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default AcademicSections;