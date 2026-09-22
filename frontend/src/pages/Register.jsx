import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        email: formData.email,
        password: formData.password,
      });

      setSuccess("Account created successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("Registration failed:", error);

      if (error.response?.data?.detail) {
        setError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : "Unable to create account."
        );
      } else {
        setError("Unable to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* Left Side */}
      <div className="register-info">

        <Link to="/" className="register-brand">
          <strong>ARMS</strong>
          <span>Attendance & Result Management System</span>
        </Link>

        <div className="register-info-content">
          <p className="register-label">
            GET STARTED
          </p>

          <h1>
            Your academic information, all in one place.
          </h1>

          <p>
            Create your account and get access to a centralized
            academic management experience.
          </p>

          <div className="register-features">
            <div>
              <span>✓</span>
              <p>Simple and secure registration</p>
            </div>

            <div>
              <span>✓</span>
              <p>Personal academic dashboard</p>
            </div>

            <div>
              <span>✓</span>
              <p>Access attendance and results</p>
            </div>
          </div>
        </div>

      </div>


      {/* Right Side */}
      <div className="register-form-section">

        <div className="register-card">

          <div className="register-card-header">
            <h2>Create your account</h2>

            <p>
              Register to get started with ARMS
            </p>
          </div>


          <form onSubmit={handleRegister}>

            <div className="form-group">
              <label htmlFor="register-email">
                Email address
              </label>

              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>


            <div className="form-group">
              <label htmlFor="register-password">
                Password
              </label>

              <input
                id="register-password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>


            <div className="form-group">
              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>


            {error && (
              <div className="register-error">
                {error}
              </div>
            )}


            {success && (
              <div className="register-success">
                {success}
              </div>
            )}


            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

          </form>


          <div className="register-divider">
            <span>or</span>
          </div>


          <p className="register-login">
            Already have an account?
            <Link to="/login">
              Login
            </Link>
          </p>


          <Link to="/" className="register-back-home">
            ← Back to Home
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Register;