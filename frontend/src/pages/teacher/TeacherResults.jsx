import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./TeacherPortal.css";

function TeacherResults() {
  const [assignments, setAssignments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [assessmentId, setAssessmentId] = useState("");

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [resultIds, setResultIds] = useState({});
  const [viewMode, setViewMode] = useState("view");

  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedAssessment = useMemo(
    () => assessments.find(
      (item) => String(item.id) === String(assessmentId)
    ),
    [assessments, assessmentId]
  );

  const maxMarks = Number(selectedAssessment?.max_marks ?? 0);

  // Load assigned subjects and assessments created by admin.
  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setLoading(true);
      setError("");

      try {
        const [assignmentResponse, assessmentResponse] =
          await Promise.all([
            api.get("/teachers/subjects"),
            api.get("/assessments"),
          ]);

        if (!active) return;

        const assignmentData = Array.isArray(assignmentResponse.data)
          ? assignmentResponse.data
          : assignmentResponse.data?.items ?? [];

        const assessmentData = Array.isArray(assessmentResponse.data)
          ? assessmentResponse.data
          : assessmentResponse.data?.items ?? [];

        setAssignments(assignmentData);
        setAssessments(assessmentData);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail ||
            "Unable to load assignments or assessments."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  // Sections assigned to this teacher.
  const sections = useMemo(() => {
    const unique = new Map();

    assignments.forEach((item) => {
      const section = item.section ?? item.academic_section;
      const id = item.section_id ?? section?.id;

      if (id == null) return;

      unique.set(String(id), {
        id,
        label:
          section?.batch && section?.section_code
            ? `${section.batch} - ${section.section_code}`
            : section?.name ?? section?.batch ?? String(id),
      });
    });

    return [...unique.values()];
  }, [assignments]);

  // Subjects assigned to the selected section.
  const subjects = useMemo(() => {
    const unique = new Map();

    assignments.forEach((item) => {
      const section = item.section ?? item.academic_section;
      const assignedSectionId = item.section_id ?? section?.id;
      const subject = item.subject;

      const code =
        item.subject_code ??
        subject?.subject_code ??
        subject?.code;

      if (
        String(assignedSectionId) !== String(sectionId) ||
        !code
      ) {
        return;
      }

      unique.set(String(code), {
        code,
        label: subject?.name ? `${code} - ${subject.name}` : code,
      });
    });

    return [...unique.values()];
  }, [assignments, sectionId]);

  // Load students and saved results for the selected assessment.
  const loadResults = useCallback(async () => {
    if (!sectionId || !subjectCode || !assessmentId) {
      setStudents([]);
      setMarks({});
      setResultIds({});
      return;
    }

    setLoadingResults(true);
    setError("");

    try {
      const [studentsResponse, resultsResponse] = await Promise.all([
        api.get(
          `/teachers/sections/${encodeURIComponent(sectionId)}/students`
        ),
        api.get("/results", {
          params: {
            section_id: sectionId,
            subject_code: subjectCode,
            assessment_id: assessmentId,
          },
        }),
      ]);

      const studentData = Array.isArray(studentsResponse.data)
        ? studentsResponse.data
        : studentsResponse.data?.items ?? [];

      const resultData = Array.isArray(resultsResponse.data)
        ? resultsResponse.data
        : resultsResponse.data?.items ?? [];

      const nextMarks = {};
      const nextResultIds = {};

      resultData.forEach((result) => {
        if (
          result.assessment_id != null &&
          String(result.assessment_id) !== String(assessmentId)
        ) {
          return;
        }

        if (
          result.subject_code != null &&
          String(result.subject_code) !== String(subjectCode)
        ) {
          return;
        }

        const key = String(result.student_id);

        nextMarks[key] = result.marks == null
          ? ""
          : String(result.marks);

        // Preserve the database ID needed by PUT /results/{result_id}.
        if (result.id != null) {
          nextResultIds[key] = result.id;
        }
      });

      setStudents(studentData);
      setMarks(nextMarks);
      setResultIds(nextResultIds);
    } catch (err) {
      setStudents([]);
      setMarks({});
      setResultIds({});

      setError(
        err.response?.data?.detail ||
        "Unable to load students or results."
      );
    } finally {
      setLoadingResults(false);
    }
  }, [sectionId, subjectCode, assessmentId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  function handleSectionChange(value) {
    setSectionId(value);
    setSubjectCode("");
    setViewMode("view");
    setError("");
    setSuccess("");
  }

  function handleMarksChange(studentId, value) {
    setMarks((previous) => ({
      ...previous,
      [String(studentId)]: value,
    }));

    setSuccess("");
  }

  async function handleSaveResults() {
    setError("");
    setSuccess("");

    if (!sectionId || !subjectCode || !selectedAssessment) {
      setError("Select a section, subject, and assessment.");
      return;
    }

    if (!students.length) {
      setError("No students found.");
      return;
    }

    if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
      setError("The selected assessment has invalid maximum marks.");
      return;
    }

    // Validate every student's marks before making any requests.
    const records = [];

    for (const student of students) {
      const studentId = student.student_id ?? student.id;
      const key = String(studentId);
      const value = marks[key];

      if (value === undefined || String(value).trim() === "") {
        setError(`Enter marks for ${student.name ?? studentId}.`);
        return;
      }

      const numericMarks = Number(value);

      if (
        !Number.isFinite(numericMarks) ||
        numericMarks < 0 ||
        numericMarks > maxMarks
      ) {
        setError(
          `Marks for ${student.name ?? studentId} must be between 0 and ${maxMarks}.`
        );
        return;
      }

      records.push({
        student_id: studentId,
        subject_code: subjectCode,
        assessment_id: selectedAssessment.id,
        assessment_name: selectedAssessment.name,
        marks: numericMarks,
        result_id: resultIds[key],
      });
    }

    setSaving(true);

    try {
      for (const record of records) {
        if (record.result_id != null) {
          // Update the existing database record.
          await api.put(`/results/${record.result_id}`, {
            marks: record.marks,
          });
        } else {
          // Create a result only if one does not already exist.
          await api.post("/results", {
            student_id: record.student_id,
            subject_code: record.subject_code,
            assessment_id: record.assessment_id,
            assessment_name: record.assessment_name,
            marks: record.marks,
          });
        }
      }

      setSuccess("Results saved successfully.");
      setViewMode("view");

      await loadResults();
    } catch (err) {
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : JSON.stringify(
              err.response?.data?.detail ??
              "Unable to save results."
            )
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="teacher-page">Loading results...</div>;
  }

  return (
    <div className="teacher-page">
      <div className="teacher-page-header">
        <h2>Manage Results</h2>
        <p>View and update marks for your assigned students.</p>
      </div>

      {error && (
        <div className="teacher-alert teacher-alert-error" role="alert">
          {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}

      {success && (
        <div className="teacher-alert teacher-alert-success" role="status">
          {success}
        </div>
      )}

      <div className="teacher-filter-row">
        <div className="teacher-form-group">
          <label htmlFor="result-section">Section</label>
          <select
            id="result-section"
            value={sectionId}
            onChange={(e) => handleSectionChange(e.target.value)}
          >
            <option value="">Select section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </div>

        <div className="teacher-form-group">
          <label htmlFor="result-subject">Subject</label>
          <select
            id="result-subject"
            value={subjectCode}
            disabled={!sectionId}
            onChange={(e) => {
              setSubjectCode(e.target.value);
              setViewMode("view");
              setError("");
              setSuccess("");
            }}
          >
            <option value="">Select subject</option>
            {subjects.map((subject) => (
              <option key={subject.code} value={subject.code}>
                {subject.label}
              </option>
            ))}
          </select>
        </div>

        <div className="teacher-form-group">
          <label htmlFor="result-assessment">Assessment</label>
          <select
            id="result-assessment"
            value={assessmentId}
            onChange={(e) => {
              setAssessmentId(e.target.value);
              setViewMode("view");
              setError("");
              setSuccess("");
            }}
          >
            <option value="">Select assessment</option>
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedAssessment && (
        <div className="teacher-form-group result-max-marks">
          <label htmlFor="maximum-marks">Maximum Marks</label>
          <input
            id="maximum-marks"
            type="number"
            value={maxMarks}
            readOnly
          />
          <small>Maximum marks are set by the admin.</small>
        </div>
      )}

      {sectionId && subjectCode && assessmentId && (
        <div className="result-mode-tabs">
          <button
            type="button"
            className={viewMode === "view" ? "active" : ""}
            onClick={() => {
              setViewMode("view");
              setError("");
            }}
          >
            View Results
          </button>

          {viewMode === "view" ? (
            <button
              type="button"
              className="result-update-button"
              onClick={() => {
                setViewMode("update");
                setError("");
                setSuccess("");
              }}
            >
              Update Results
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setViewMode("view");
                loadResults();
              }}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {loadingResults ? (
        <p>Loading students and results...</p>
      ) : sectionId && subjectCode && assessmentId ? (
        students.length > 0 ? (
          <>
            <div className="teacher-table-wrapper">
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Marks / {maxMarks}</th>
                    {viewMode === "view" && <th>Status</th>}
                  </tr>
                </thead>

                <tbody>
                  {students.map((student, index) => {
                    const studentId = student.student_id ?? student.id;
                    const key = String(studentId);
                    const value = marks[key] ?? "";
                    const entered = String(value).trim() !== "";

                    return (
                      <tr key={studentId}>
                        <td>{index + 1}</td>
                        <td>{studentId}</td>
                        <td>
                          {student.name ?? student.full_name ?? "—"}
                        </td>
                        <td>
                          {viewMode === "view" ? (
                            entered ? value : "Not entered"
                          ) : (
                            <input
                              data-result-mark-input
                              type="number"
                              min="0"
                              max={maxMarks}
                              step="any"
                              value={value}
                              placeholder={`0–${maxMarks}`}
                              onChange={(e) =>
                                handleMarksChange(studentId, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const inputs = document.querySelectorAll(
                                    "[data-result-mark-input]"
                                  );
                                  inputs[index + 1]?.focus();
                                }
                              }}
                              aria-label={`Marks for ${student.name ?? studentId}`}
                            />
                          )}
                        </td>

                        {viewMode === "view" && (
                          <td>
                            <span
                              className={
                                entered
                                  ? "result-status result-status-entered"
                                  : "result-status result-status-pending"
                              }
                            >
                              {entered ? "Entered" : "Pending"}
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {viewMode === "update" && (
              <div className="teacher-actions">
                <button
                  type="button"
                  onClick={handleSaveResults}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </>
        ) : (
          <p>No students found in this assigned section.</p>
        )
      ) : (
        <p>Select a section, subject, and assessment to view results.</p>
      )}
    </div>
  );
}

export default TeacherResults;
