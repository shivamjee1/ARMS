import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./StudentPortal.css";

const ASSESSMENTS = [
{ id: 1, name: "Assessment 1" },
{ id: 2, name: "Assessment 2" },
{ id: 3, name: "Assessment 3" },
{ id: 4, name: "Final" },
];

function StudentResults() {
const [profile, setProfile] = useState(null);
const [results, setResults] = useState([]);
const [selectedSubject, setSelectedSubject] = useState("");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
let cancelled = false;

async function loadResults() {
  try {
    setLoading(true);
    setError("");

    const userResponse = await api.get("/auth/me");

    if (userResponse.data?.role !== "student") {
      throw new Error("Only students can view this page.");
    }

    const profileResponse = await api.get("/students/profile");
    const student = profileResponse.data;

    if (!student?.student_id) {
      throw new Error("Student ID was not found in the profile.");
    }

    if (cancelled) return;

    setProfile(student);

    const resultsResponse = await api.get(
      `/results/student/${encodeURIComponent(student.student_id)}`
    );

    if (cancelled) return;

    const responseData = resultsResponse.data;

    const data = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.results)
        ? responseData.results
        : [];

    setResults(data);

    // Select the first subject automatically when available.
    const availableSubjects = [
      ...new Set(
        data
          .map((result) => result.subject_code)
          .filter(Boolean)
      ),
    ].sort();

    if (availableSubjects.length > 0) {
      setSelectedSubject((current) =>
        current && availableSubjects.includes(current)
          ? current
          : availableSubjects[0]
      );
    }
  } catch (err) {
    if (cancelled) return;

    const detail = err.response?.data?.detail;

    setError(
      typeof detail === "string"
        ? detail
        : err.message || "Failed to load student results."
    );
  } finally {
    if (!cancelled) {
      setLoading(false);
    }
  }
}

loadResults();

return () => {
  cancelled = true;
};


}, []);

// Subjects currently present in the student's results.
const subjects = useMemo(() => {
return [
...new Set(
results
.map((result) => result.subject_code)
.filter(Boolean)
),
].sort();
}, [results]);

// Show all four assessment rows for the selected subject.
const subjectResults = useMemo(() => {
if (!selectedSubject) return [];

return ASSESSMENTS.map((assessment) => {
  const result = results.find((item) => {
    if (item.subject_code !== selectedSubject) return false;

    // Prefer matching the assessment ID when available.
    if (item.assessment_id != null) {
      return Number(item.assessment_id) === assessment.id;
    }

    const name = String(item.assessment_name || "")
      .toLowerCase()
      .trim();

    const expected = assessment.name.toLowerCase();

    if (assessment.id === 4) {
      return (
        name.includes("final") ||
        name.includes("end sem") ||
        name.includes("end-sem") ||
        name.includes("endsem")
      );
    }

    return name === expected;
  });

  return {
    ...assessment,
    marks: result?.marks ?? null,
    updated: result != null && result.marks != null,
  };
});

}, [results, selectedSubject]);

if (loading) {
return ( <div className="student-page"> <h2>My Results</h2> <p>Loading your results...</p> </div>
);
}

if (error) {
return ( <div className="student-page"> <h2>My Results</h2> <p className="error-message">{error}</p> </div>
);
}

return ( <div className="student-page"> <div className="student-page-header"> <div> <h2>My Results</h2> <p>Select a subject to view all your assessment marks.</p> </div> </div>

```
  {profile && (
    <div className="student-info">
      <p>
        <strong>Student ID:</strong> {profile.student_id}
      </p>
      <p>
        <strong>Name:</strong> {profile.name || "—"}
      </p>
    </div>
  )}

  <div className="results-filter">
    <label htmlFor="subject-filter">Select Subject:</label>

    <select
      id="subject-filter"
      value={selectedSubject}
      onChange={(event) => setSelectedSubject(event.target.value)}
    >
      <option value="">Choose a subject</option>

      {subjects.map((subject) => (
        <option key={subject} value={subject}>
          {subject}
        </option>
      ))}
    </select>
  </div>

  {!selectedSubject ? (
    <p>Select a subject to view your results.</p>
  ) : (
    <>
      <h3>Results for {selectedSubject}</h3>

      <div className="table-container">
        <table className="student-table">
          <thead>
            <tr>
              <th>Assessment</th>
              <th>Marks Obtained</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {subjectResults.map((assessment) => (
              <tr key={assessment.id}>
                <td>{assessment.name}</td>

                <td>
                  {assessment.updated ? assessment.marks : "—"}
                </td>

                <td>
                  <span
                    className={
                      assessment.updated
                        ? "result-status-entered"
                        : "result-status-pending"
                    }
                  >
                    {assessment.updated
                      ? "Updated"
                      : "Not Updated"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )}

  {subjects.length === 0 && (
    <p>
      No subjects were found in your results. If you are enrolled in a
      subject but no marks have been entered yet, the backend must provide
      your enrolled subjects separately to display them here.
    </p>
  )}
</div>

);
}

export default StudentResults;
