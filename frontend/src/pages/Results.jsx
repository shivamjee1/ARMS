import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./Results.css";

function Results() {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [sections, setSections] = useState([]);

  const [filterType, setFilterType] = useState("all");
  const [filterValue, setFilterValue] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingResult, setEditingResult] = useState(null);

  const [formData, setFormData] = useState({
    student_id: "",
    subject_code: "",
    assessment_name: "",
    marks: "",
  });

  // --------------------------------------------------
  // Load supporting data
  // --------------------------------------------------

  const loadSupportData = async () => {
    try {
      const [studentsRes, subjectsRes, assessmentsRes, sectionsRes] =
        await Promise.all([
          api.get("/students"),
          api.get("/subjects"),
          api.get("/assessments"),
          api.get("/academic-sections"),
        ]);

      setStudents(studentsRes.data);
      setSubjects(subjectsRes.data);
      setAssessments(assessmentsRes.data);
      setSections(sectionsRes.data);
    } catch (err) {
      console.error("Failed to load result support data:", err);
    }
  };

  // --------------------------------------------------
  // Load all results
  // --------------------------------------------------

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/results");
      setResults(response.data);
    } catch (err) {
      console.error("Results error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to load results.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupportData();
    fetchResults();
  }, []);

  // --------------------------------------------------
  // Filter results
  // --------------------------------------------------

  const handleFilter = async () => {
    try {
      setLoading(true);
      setError("");

      let response;

      if (filterType === "all") {
        response = await api.get("/results");
      } else if (filterType === "student") {
        if (!filterValue) {
          setError("Please select a student.");
          setLoading(false);
          return;
        }

        response = await api.get(`/results/student/${filterValue}`);
      } else if (filterType === "subject") {
        if (!filterValue) {
          setError("Please select a subject.");
          setLoading(false);
          return;
        }

        response = await api.get(`/results/subject/${filterValue}`);
      } else if (filterType === "section") {
        if (!filterValue) {
          setError("Please select a section.");
          setLoading(false);
          return;
        }

        response = await api.get(`/results/section/${filterValue}`);
      }

      setResults(response.data);
    } catch (err) {
      console.error("Filter results error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to load filtered results.");
      }

      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFilter = async () => {
    setFilterType("all");
    setFilterValue("");
    await fetchResults();
  };

  // --------------------------------------------------
  // Form
  // --------------------------------------------------

  const openAddModal = () => {
    setEditingResult(null);

    setFormData({
      student_id: "",
      subject_code: "",
      assessment_name: "",
      marks: "",
    });

    setError("");
    setShowModal(true);
  };

  const openEditModal = (result) => {
    setEditingResult(result);

    setFormData({
      student_id: result.student_id,
      subject_code: result.subject_code,
      assessment_name: result.assessment_name,
      marks: result.marks,
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (actionLoading) return;

    setShowModal(false);
    setEditingResult(null);

    setFormData({
      student_id: "",
      subject_code: "",
      assessment_name: "",
      marks: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // Maximum marks
  // --------------------------------------------------

  const selectedAssessment = useMemo(() => {
    return assessments.find(
      (assessment) => assessment.name === formData.assessment_name
    );
  }, [assessments, formData.assessment_name]);

  // --------------------------------------------------
  // Add / Update result
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.student_id) {
      setError("Please select a student.");
      return;
    }

    if (!formData.subject_code) {
      setError("Please select a subject.");
      return;
    }

    if (!formData.assessment_name) {
      setError("Please select an assessment.");
      return;
    }

    if (formData.marks === "") {
      setError("Please enter marks.");
      return;
    }

    const marks = Number(formData.marks);

    if (Number.isNaN(marks) || marks < 0) {
      setError("Marks must be a valid positive number.");
      return;
    }

    if (selectedAssessment && marks > selectedAssessment.max_marks) {
      setError(
        `Marks cannot be greater than ${selectedAssessment.max_marks}.`
      );
      return;
    }

    try {
      setActionLoading(true);

      if (editingResult) {
        await api.put(`/results/${editingResult.id}`, {
          marks,
        });
      } else {
        await api.post("/results", {
          student_id: Number(formData.student_id),
          subject_code: formData.subject_code,
          assessment_name: formData.assessment_name,
          marks,
        });
      }

      closeModal();
      await handleFilter();
    } catch (err) {
      console.error("Save result error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(
          editingResult
            ? "Failed to update result."
            : "Failed to add result."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Delete
  // --------------------------------------------------

  const handleDelete = async (result) => {
    const confirmed = window.confirm(
      `Delete result for student ${result.student_id} in ${result.subject_code} - ${result.assessment_name}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      await api.delete(`/results/${result.id}`);

      await handleFilter();
    } catch (err) {
      console.error("Delete result error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to delete result.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const getStudentName = (studentId) => {
    const student = students.find(
      (item) => Number(item.id) === Number(studentId)
    );

    return student ? student.name : "Unknown Student";
  };

  const getSectionCode = (studentId) => {
    const student = students.find(
      (item) => Number(item.id) === Number(studentId)
    );

    if (!student) return "-";

    const section = sections.find(
      (item) => Number(item.id) === Number(student.section_id)
    );

    return section ? section.section_code : "-";
  };

  const getSubjectName = (subjectCode) => {
    const subject = subjects.find(
      (item) => item.code === subjectCode
    );

    return subject?.name || "";
  };

  // --------------------------------------------------
  // Section result summary
  // --------------------------------------------------

  const sectionSummary = useMemo(() => {
    if (filterType !== "section") return [];

    const grouped = {};

    results.forEach((result) => {
      const key = `${result.student_id}-${result.subject_code}`;

      if (!grouped[key]) {
        grouped[key] = {
          student_id: result.student_id,
          student_name: getStudentName(result.student_id),
          subject_code: result.subject_code,
          subject_name: getSubjectName(result.subject_code),
          assessment1: "-",
          assessment2: "-",
          assessment3: "-",
          finalExam: "-",
        };
      }

      const name = result.assessment_name?.toLowerCase();

      if (name === "assessment 1") {
        grouped[key].assessment1 = result.marks;
      } else if (name === "assessment 2") {
        grouped[key].assessment2 = result.marks;
      } else if (name === "assessment 3") {
        grouped[key].assessment3 = result.marks;
      } else if (name === "final exam") {
        grouped[key].finalExam = result.marks;
      }
    });

    return Object.values(grouped);
  }, [results, filterType, students, subjects]);

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="results-page">
      <div className="results-page-header">
        <div>
          <div className="results-page-label">ACADEMIC MANAGEMENT</div>
          <h2>Results</h2>
          <p>Manage and view student subject-wise results.</p>
        </div>

        <button className="results-add-button" onClick={openAddModal}>
          + Add Result
        </button>
      </div>

      {/* Filters */}

      <div className="results-filter-card">
        <div className="results-filter-title">Find Results</div>

        <div className="results-filter-row">
          <div className="results-filter-group">
            <label>Search By</label>

            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterValue("");
              }}
            >
              <option value="all">All Results</option>
              <option value="student">Student</option>
              <option value="subject">Subject</option>
              <option value="section">Section</option>
            </select>
          </div>

          {filterType === "student" && (
            <div className="results-filter-group">
              <label>Student</label>

              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                <option value="">Select Student</option>

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.id} - {student.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterType === "subject" && (
            <div className="results-filter-group">
              <label>Subject</label>

              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                <option value="">Select Subject</option>

                {subjects.map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterType === "section" && (
            <div className="results-filter-group">
              <label>Section</label>

              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                <option value="">Select Section</option>

                {sections.map((section) => (
                  <option
                    key={section.id}
                    value={section.section_code}
                  >
                    {section.section_code}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="results-filter-actions">
            <button
              className="results-search-button"
              onClick={handleFilter}
            >
              Search
            </button>

            <button
              className="results-reset-button"
              onClick={resetFilter}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="results-error">
          {error}
        </div>
      )}

      {/* Section Summary */}

      {filterType === "section" && (
        <div className="results-table-card">
          <div className="results-table-header">
            <div>
              <h3>Section Result Summary</h3>
              <span>
                Assessment 1, Assessment 2, Assessment 3 and Final Exam
              </span>
            </div>

            <div className="results-count">
              {sectionSummary.length} Records
            </div>
          </div>

          <div className="results-table-wrapper">
            {loading ? (
              <div className="results-state">
                Loading results...
              </div>
            ) : sectionSummary.length === 0 ? (
              <div className="results-state">
                No results found for this section.
              </div>
            ) : (
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Assessment 1</th>
                    <th>Assessment 2</th>
                    <th>Assessment 3</th>
                    <th>Final Exam</th>
                  </tr>
                </thead>

                <tbody>
                  {sectionSummary.map((item) => (
                    <tr
                      key={`${item.student_id}-${item.subject_code}`}
                    >
                      <td className="result-id">
                        {item.student_id}
                      </td>

                      <td className="result-student-name">
                        {item.student_name}
                      </td>

                      <td>
                        <span className="subject-badge">
                          {item.subject_code}
                        </span>

                        {item.subject_name && (
                          <small className="subject-name">
                            {item.subject_name}
                          </small>
                        )}
                      </td>

                      <td>{item.assessment1}</td>
                      <td>{item.assessment2}</td>
                      <td>{item.assessment3}</td>
                      <td className="final-mark">
                        {item.finalExam}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Normal Result Table */}

      {filterType !== "section" && (
        <div className="results-table-card">
          <div className="results-table-header">
            <div>
              <h3>Result Records</h3>
              <span>Subject-wise assessment marks</span>
            </div>

            <div className="results-count">
              {results.length} Records
            </div>
          </div>

          <div className="results-table-wrapper">
            {loading ? (
              <div className="results-state">
                Loading results...
              </div>
            ) : results.length === 0 ? (
              <div className="results-state">
                No results found.
              </div>
            ) : (
              <table className="results-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Assessment</th>
                    <th>Marks</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((result) => (
                    <tr key={result.id}>
                      <td className="result-id">
                        {result.id}
                      </td>

                      <td>
                        <div className="result-student">
                          <strong>
                            {getStudentName(result.student_id)}
                          </strong>

                          <span>
                            {result.student_id}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="section-badge">
                          {getSectionCode(result.student_id)}
                        </span>
                      </td>

                      <td>
                        <div className="result-subject">
                          <strong>{result.subject_code}</strong>

                          {getSubjectName(result.subject_code) && (
                            <span>
                              {getSubjectName(result.subject_code)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="assessment-badge">
                          {result.assessment_name}
                        </span>
                      </td>

                      <td>
                        <span className="marks-badge">
                          {result.marks}
                        </span>
                      </td>

                      <td>
                        <div className="result-actions">
                          <button
                            className="edit-button"
                            onClick={() => openEditModal(result)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => handleDelete(result)}
                            disabled={actionLoading}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}

      {showModal && (
        <div className="results-modal-overlay">
          <div className="results-modal">
            <div className="results-modal-header">
              <div>
                <h3>
                  {editingResult ? "Edit Result" : "Add Result"}
                </h3>

                <p>
                  {editingResult
                    ? "Update the result marks."
                    : "Enter student assessment result."}
                </p>
              </div>

              <button
                className="modal-close-button"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="results-form-grid">
                <div className="results-form-group">
                  <label>Student</label>

                  <select
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleChange}
                    disabled={!!editingResult}
                  >
                    <option value="">Select Student</option>

                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.id} - {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="results-form-group">
                  <label>Subject</label>

                  <select
                    name="subject_code"
                    value={formData.subject_code}
                    onChange={handleChange}
                    disabled={!!editingResult}
                  >
                    <option value="">Select Subject</option>

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

                <div className="results-form-group">
                  <label>Assessment</label>

                  <select
                    name="assessment_name"
                    value={formData.assessment_name}
                    onChange={handleChange}
                    disabled={!!editingResult}
                  >
                    <option value="">Select Assessment</option>

                    {assessments.map((assessment) => (
                      <option
                        key={assessment.id}
                        value={assessment.name}
                      >
                        {assessment.name} — Max{" "}
                        {assessment.max_marks}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="results-form-group">
                  <label>
                    Marks
                    {selectedAssessment &&
                      ` / ${selectedAssessment.max_marks}`}
                  </label>

                  <input
                    type="number"
                    name="marks"
                    value={formData.marks}
                    onChange={handleChange}
                    min="0"
                    max={selectedAssessment?.max_marks || undefined}
                    placeholder="Enter marks"
                  />
                </div>
              </div>

              {error && (
                <div className="modal-error">
                  {error}
                </div>
              )}

              <div className="results-modal-actions">
                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={closeModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-save-button"
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Saving..."
                    : editingResult
                    ? "Update Result"
                    : "Add Result"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Results;