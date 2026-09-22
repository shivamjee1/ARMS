import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">

      {/* Navbar */}
      <header className="home-navbar">
        <div className="home-logo">
          <h2>ARMS</h2>
          <span>Attendance & Result Management</span>
        </div>

        <nav className="home-nav">
          <a href="#features">Features</a>
          <a href="#roles">Roles</a>
          <a href="#about">About</a>

          <Link to="/login" className="nav-login">
            Login
          </Link>

          <Link to="/register" className="nav-register">
            Sign Up
          </Link>
        </nav>
      </header>


      {/* Hero Section */}
      <section className="hero-section">

        <div className="hero-content">
          <p className="hero-label">
            SMART ACADEMIC MANAGEMENT
          </p>

          <h1>
            Manage Attendance &
            <span> Results Smarter.</span>
          </h1>

          <p className="hero-description">
            A centralized platform for managing students, teachers,
            subjects, attendance, assessments and academic results
            in one place.
          </p>

          <div className="hero-buttons">
            <Link to="/login" className="primary-button">
              Login to Dashboard
            </Link>

            <Link to="/register" className="secondary-button">
              Create Account
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-header">
            <span>Academic Overview</span>
            <span className="status">● Active</span>
          </div>

          <div className="overview-grid">
            <div className="overview-item">
              <strong>Students</strong>
              <span>Manage</span>
            </div>

            <div className="overview-item">
              <strong>Attendance</strong>
              <span>Track</span>
            </div>

            <div className="overview-item">
              <strong>Results</strong>
              <span>Analyze</span>
            </div>

            <div className="overview-item">
              <strong>Subjects</strong>
              <span>Organize</span>
            </div>
          </div>
        </div>

      </section>


      {/* Features */}
      <section id="features" className="home-section">

        <div className="section-heading">
          <p>FEATURES</p>
          <h2>Everything in one place</h2>
          <span>
            Tools designed to simplify everyday academic management.
          </span>
        </div>

        <div className="feature-grid">

          <div className="feature-card">
            <h3>Student Management</h3>
            <p>
              Manage student profiles, academic sections and
              student information efficiently.
            </p>
          </div>

          <div className="feature-card">
            <h3>Attendance Tracking</h3>
            <p>
              Record and monitor subject-wise attendance
              throughout the academic session.
            </p>
          </div>

          <div className="feature-card">
            <h3>Result Management</h3>
            <p>
              Manage assessments, marks and final examination
              results in a structured system.
            </p>
          </div>

          <div className="feature-card">
            <h3>Teacher Assignments</h3>
            <p>
              Assign teachers to subjects and academic sections
              with controlled access.
            </p>
          </div>

          <div className="feature-card">
            <h3>Role-Based Access</h3>
            <p>
              Different permissions for administrators, teachers
              and students.
            </p>
          </div>

          <div className="feature-card">
            <h3>Secure Authentication</h3>
            <p>
              Protected login and role-based authorization for
              application resources.
            </p>
          </div>

        </div>

      </section>


      {/* Roles */}
      <section id="roles" className="roles-section">

        <div className="section-heading">
          <p>USER ROLES</p>
          <h2>Built for every academic role</h2>
        </div>

        <div className="role-grid">

          <div className="role-card">
            <h3>Administrator</h3>
            <p>
              Manage students, teachers, subjects, sections,
              assignments, assessments, attendance and results.
            </p>
          </div>

          <div className="role-card">
            <h3>Teacher</h3>
            <p>
              Manage attendance and results for assigned
              subjects and academic sections.
            </p>
          </div>

          <div className="role-card">
            <h3>Student</h3>
            <p>
              View personal attendance and academic results
              through a simple dashboard.
            </p>
          </div>

        </div>

      </section>


      {/* About */}
      <section id="about" className="about-section">

        <div>
          <p className="section-label">ABOUT ARMS</p>

          <h2>
            A simple way to organize academic information.
          </h2>
        </div>

        <p>
          ARMS is designed to bring important academic operations
          into a single system. Instead of maintaining attendance,
          assessments and results across different tools, the
          platform provides a centralized environment with
          role-based access and structured academic data.
        </p>

      </section>


      {/* CTA */}
      <section className="cta-section">

        <h2>Ready to get started?</h2>

        <p>
          Access your academic management dashboard.
        </p>

        <Link to="/login" className="primary-button">
          Login to ARMS
        </Link>

      </section>


      {/* Footer */}
      <footer className="home-footer">

        <div>
          <h3>ARMS</h3>
          <p>
            Attendance & Result Management System
          </p>
        </div>

        <div>
          <p>Academic Management Platform</p>
          <p>© 2026 ARMS</p>
        </div>

      </footer>

    </div>
  );
}

export default Home;