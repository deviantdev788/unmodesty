import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

function Navbar() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("unmodesty_token");

        const response = await fetch(`${API_URL}/notifications/unread-count`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch notification count.");
        }

        const data = await response.json();
        setUnreadCount(data.count || 0);
      } catch (error) {
        console.error("Notification count error:", error);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          UNMODESTY<span>.</span>
        </Link>

        <div className="nav-links">
          <Link to="/">Beranda</Link>
          <Link to="/auctions">Lelang</Link>
          {!loading && isAuthenticated && (
            <Link to="/edit">Edit</Link>
          )}
          {!loading && isAuthenticated && (
            <Link to="/bids">Penawaran</Link>
          )}
          <Link to="/sell">Jual Barang</Link>
        </div>

        <div className="nav-account">
          {!loading && (
            isAuthenticated ? (
              <>
                <Link to="/notifications" className="nav-notification-link" aria-label="Notifikasi">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notification-dot" />
                  )}
                </Link>

                <Link to="/profile" className="nav-username">
                  {user.name}
                </Link>

                <button
                  type="button"
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Masuk</Link>
                <Link to="/register" className="register-button">
                  Daftar
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
 