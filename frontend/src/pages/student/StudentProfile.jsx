import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./StudentPortal.css";

function StudentProfile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        // Fetch the currently authenticated user.
        const response = await api.get("/students/profile");

        if (active) {
          setProfile(response.data);
        }
      } catch (err) {
        if (active) {
          const status = err.response?.status;

          if (status === 401) {
            setError("Your session has expired. Please log in again.");
          } else {
            setError(
              "Unable to refresh your account details. Showing available account information."
            );
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // Use API values first, then fall back to AuthContext.
  const displayName =
    profile?.full_name ||
    profile?.name ||
    user?.full_name ||
    user?.name ||
    "Student";

  const email = profile?.email || user?.email || "Not available";

  const role = profile?.role || user?.role || "student";

  const studentId =
    profile?.student_code ||
    profile?.student_id ||
    profile?.student?.student_code ||
    profile?.student?.id ||
    "Not available";

  const section =
    profile?.section_code ||
    profile?.section_name ||
    profile?.section?.section_code ||
    profile?.student?.section_code ||
    "Not available";

  const batch =
    profile?.batch ||
    profile?.batch_code ||
    profile?.section?.batch ||
    profile?.student?.batch ||
    "Not available";

  const semester =
    profile?.semester ??
    profile?.section?.semester ??
    profile?.student?.semester ??
    "Not available";

  const details = [
    { label: "Full Name", value: displayName },
    { label: "Email Address", value: email },
    {
      label: "Account Role",
      value: String(role).replace(/_/g, " "),
    },
    { label: "Student ID", value: studentId },
    { label: "Academic Section", value: section },
    { label: "Batch", value: batch },
    { label: "Semester", value: semester },
  ];

  if (loading) {
    return (
      <main className="student-page">
        <div className="student-loading">
          Loading your profile...
        </div>
      </main>
    );
  }

  return (
    <main className="student-page">
      <header className="student-page-header">
        <div>
          <p className="student-eyebrow">MY ACCOUNT</p>
          <h1>My Profile</h1>
          <p>
            View your account details and academic information.
          </p>
        </div>

        <button
          type="button"
          className="student-btn"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </header>

      {error && (
        <div className="student-error" role="status">
          <p>{error}</p>
        </div>
      )}

      <section className="student-panel">
        <div className="student-profile-heading">
          <div className="student-avatar" aria-hidden="true">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2>{displayName}</h2>
            <p>{email}</p>
          </div>
        </div>

        <div className="student-profile-grid">
          {details.map((detail) => (
            <div
              className="student-profile-field"
              key={detail.label}
            >
              <span>{detail.label}</span>
              <strong>{detail.value}</strong>
            </div>
          ))}
        </div>

        <p className="student-muted">
          These details are read-only. Contact the academic section
          administrator if any information needs correction.
        </p>
      </section>
    </main>
  );
}

export default StudentProfile;