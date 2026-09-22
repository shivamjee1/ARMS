import { useEffect, useState } from "react";
import api from "../services/api";
import "./Users.css";

function Users() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "student",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);

      if (error.response?.status === 403) {
        setError("You are not authorized to view users.");
      } else {
        setError("Failed to load users.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openForm = () => {
    setFormData({
      email: "",
      password: "",
      role: "student",
    });

    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (formLoading) return;

    setShowForm(false);
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    setFormError("");
    setFormLoading(true);

    try {
      await api.post("/admin/users", {
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      setShowForm(false);

      setFormData({
        email: "",
        password: "",
        role: "student",
      });

      await fetchUsers();
    } catch (error) {
      console.error("Failed to create user:", error);

      if (error.response?.data?.detail) {
        setFormError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        );
      } else {
        setFormError("Failed to create user.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="users-page">
      <div className="users-page-header">
        <div>
          <p className="users-page-label">USER MANAGEMENT</p>

          <h1>Users</h1>

          <p className="users-page-description">
            View and manage all authentication accounts in the system.
          </p>
        </div>

        <div className="users-header-actions">
          <button
            className="users-refresh-button"
            onClick={fetchUsers}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button className="users-add-button" onClick={openForm}>
            + Create User
          </button>
        </div>
      </div>

      {error && <div className="users-error">{error}</div>}

      <div className="users-summary">
        <div>
          <span>Total Users</span>
          <strong>{users.length}</strong>
        </div>

        <div>
          <span>Active Users</span>
          <strong>
            {users.filter((user) => user.is_active).length}
          </strong>
        </div>

        <div>
          <span>Inactive Users</span>
          <strong>
            {users.filter((user) => !user.is_active).length}
          </strong>
        </div>
      </div>

      <div className="users-table-card">
        <div className="users-table-header">
          <h2>All Users</h2>
          <p>Authentication accounts registered in the system.</p>
        </div>

        {loading ? (
          <div className="users-table-state">
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="users-table-state">
            <h3>No users found</h3>
            <p>There are currently no user accounts.</p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="users-id">{user.id}</span>
                    </td>

                    <td>
                      <strong className="users-email">
                        {user.email}
                      </strong>
                    </td>

                    <td>
                      <span className={`users-role role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          user.is_active
                            ? "users-status active"
                            : "users-status inactive"
                        }
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="users-modal-overlay" onClick={closeForm}>
          <div
            className="users-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="users-modal-header">
              <div>
                <p className="users-modal-label">USER MANAGEMENT</p>

                <h2>Create User</h2>

                <p>
                  Create a new authentication account.
                </p>
              </div>

              <button
                className="users-modal-close"
                onClick={closeForm}
                disabled={formLoading}
              >
                ×
              </button>
            </div>

            <form
              className="users-form"
              onSubmit={handleCreateUser}
            >
              <div className="users-form-group">
                <label htmlFor="user-email">Email</label>

                <input
                  id="user-email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="users-form-group">
                <label htmlFor="user-password">Password</label>

                <input
                  id="user-password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="users-form-group">
                <label htmlFor="user-role">Role</label>

                <select
                  id="user-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formError && (
                <div className="users-form-error">
                  {formError}
                </div>
              )}

              <div className="users-modal-actions">
                <button
                  type="button"
                  className="users-cancel-button"
                  onClick={closeForm}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="users-submit-button"
                  disabled={formLoading}
                >
                  {formLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;