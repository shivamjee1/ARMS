import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const token = response.data.access_token;

      login(token);

      navigate("/dashboard", { replace: true });

    } catch (error) {
      console.error("Login failed:", error);

      if (error.response?.data?.detail) {
        setError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : "Invalid login credentials."
        );
      } else {
        setError("Unable to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* Left Side */}
      <div className="login-info">

        <Link to="/" className="login-brand">
          <strong>ARMS</strong>
          <span>Attendance & Result Management System</span>
        </Link>

        <div className="login-info-content">
          <p className="login-label">
            ACADEMIC MANAGEMENT PLATFORM
          </p>

          <h1>
            Everything you need to manage academics.
          </h1>

          <p>
            Manage attendance, assessments, results, students and
            academic information from one centralized platform.
          </p>

          <div className="login-features">
            <div>
              <span>✓</span>
              <p>Role-based access</p>
            </div>

            <div>
              <span>✓</span>
              <p>Centralized academic records</p>
            </div>

            <div>
              <span>✓</span>
              <p>Secure authentication</p>
            </div>
          </div>
        </div>

      </div>


      {/* Right Side */}
      <div className="login-form-section">

        <div className="login-card">

          <div className="login-card-header">
            <h2>Welcome back</h2>

            <p>
              Login to access your dashboard
            </p>
          </div>


          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>


            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>


            {error && (
              <div className="login-error">
                {error}
              </div>
            )}


            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>


          <div className="login-divider">
            <span>or</span>
          </div>


          <p className="login-register">
            Don't have an account?
            <Link to="/register">
              Create an account
            </Link>
          </p>


          <Link to="/" className="back-home">
            ← Back to Home
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Login;