
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Users.css";

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || JSON.stringify(item))
      .join(", ");
  }

  return fallback;
}

function Users() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

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
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);

      setError(
        getErrorMessage(err, "Failed to load users.")
      );
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
    setError("");
    setSuccess("");
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
    setError("");
    setSuccess("");
    setFormLoading(true);

    try {
      await api.post("/admin/users", {
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      setShowForm(false);

      setFormData({
        email: "",
        password: "",
        role: "student",
      });

      setSuccess("User created successfully.");
      await fetchUsers();
    } catch (err) {
      console.error("Failed to create user:", err);

      setFormError(
        getErrorMessage(err, "Failed to create user.")
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the account for ${user.email}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(user.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/admin/users/${user.id}`);

      setSuccess(`User ${user.email} was deleted successfully.`);

      // Refresh the user list after deletion.
      await fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);

      setError(
        getErrorMessage(err, "Failed to delete user.")
      );
    } finally {
      setDeletingId(null);
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
            type="button"
            className="users-refresh-button"
            onClick={fetchUsers}
            disabled={loading || deletingId !== null}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="users-add-button"
            onClick={openForm}
          >
            + Create User
          </button>
        </div>
      </div>

      {error && (
        <div className="users-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="users-success" role="status">
          {success}
        </div>
      )}

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
                  <th>Actions</th>
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

                    <td>
                      <button
                        type="button"
                        className="users-delete-button"
                        onClick={() => handleDeleteUser(user)}
                        disabled={deletingId !== null}
                        title={`Delete ${user.email}`}
                      >
                        {deletingId === user.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
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
          className="users-modal-overlay"
          onClick={closeForm}
        >
          <div
            className="users-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="users-modal-header">
              <div>
                <p className="users-modal-label">USER MANAGEMENT</p>

                <h2>Create User</h2>

                <p>Create a new authentication account.</p>
              </div>

              <button
                type="button"
                className="users-modal-close"
                onClick={closeForm}
                disabled={formLoading}
                aria-label="Close create user form"
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
                <div className="users-form-error" role="alert">
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