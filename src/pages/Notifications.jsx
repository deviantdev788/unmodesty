import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("unmodesty_token");

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal memuat notifikasi.");
      }

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal memperbarui notifikasi.");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const formatDate = (date) =>
    new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <main className="notifications-page">
      <div className="notifications-header">
        <h1>Notifikasi</h1>
        <p>Informasi terbaru mengenai aktivitas penawaran Anda.</p>
      </div>

      {loading ? (
        <p className="notifications-empty">Memuat notifikasi...</p>
      ) : error ? (
        <p className="notifications-error">{error}</p>
      ) : notifications.length === 0 ? (
        <div className="notifications-empty">
          <p>Belum ada notifikasi.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => {
            const data = notification.data;

            return (
              <div
                key={notification.id}
                className={`notification-item ${
                  notification.read_at ? "is-read" : "is-unread"
                }`}
              >
                <div className="notification-content">
                  <div className="notification-title">
                    {!notification.read_at && (
                      <span className="notification-unread-dot" />
                    )}
                    <h3>{data.title}</h3>
                  </div>

                  <p>{data.message}</p>

                  <span className="notification-date">
                    {formatDate(notification.created_at)}
                  </span>

                  <div className="notification-actions">
                    <Link
                      to={`/auctions/${data.auction_id}`}
                      onClick={() => {
                        if (!notification.read_at) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      Lihat lelang
                    </Link>

                    {!notification.read_at && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Tandai sudah dibaca
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Notifications;