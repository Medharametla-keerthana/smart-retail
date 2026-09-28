import { useEffect, useState } from "react";
import "./Profile.css";

const API_URL = "/api";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setMessage("Please login first");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_URL}/auth/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
        } else {
          setMessage(
            data.message || "Failed to load profile"
          );
        }
      } catch {
        setMessage("Unable to connect to backend");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          {message || "Profile information not available"}
        </div>
      </div>
    );
  }

  const firstLetter =
    user.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="profile-page">

      {/* HEADER */}

      <div className="profile-header">
        <div>
          <h1>Profile</h1>
          <p>View your account information</p>
        </div>
      </div>

      {/* MESSAGE */}

      {message && (
        <div className="profile-message">
          {message}
        </div>
      )}

      {/* PROFILE CARD */}

      <div className="profile-card">

        {/* AVATAR */}

        <div className="profile-avatar">
          {firstLetter}
        </div>

        {/* NAME */}

        <h2>{user.name || "User"}</h2>

        <p className="profile-email">
          {user.email || "-"}
        </p>

      </div>

      {/* ACCOUNT INFORMATION */}

      <div className="profile-info-card">

        <h2>Account Information</h2>

        <div className="profile-info-grid">

          <div className="profile-info-item">
            <span className="profile-label">
              Full Name
            </span>

            <span className="profile-value">
              {user.name || "-"}
            </span>
          </div>

          <div className="profile-info-item">
            <span className="profile-label">
              Email
            </span>

            <span className="profile-value">
              {user.email || "-"}
            </span>
          </div>

          <div className="profile-info-item">
            <span className="profile-label">
              User ID
            </span>

            <span className="profile-value">
              {user._id || "-"}
            </span>
          </div>

          <div className="profile-info-item">
            <span className="profile-label">
              Account Status
            </span>

            <span className="profile-status">
              Active
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Profile;