import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCurrentUser,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
} from "../services/api";

function Profile() {
  const { loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [pictureLoading, setPictureLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState(null);
  const [blockedError, setBlockedError] = useState("");

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    getCurrentUser()
      .then((data) => setProfile(data))
      .catch((error) => setError(error.message));
  }, [loading, isAuthenticated, navigate]);

  const handlePictureChange = async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setError("File harus berupa gambar.");
    e.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError("Ukuran gambar maksimal 5 MB.");
    e.target.value = "";
    return;
  }

  setPictureLoading(true);
  setError("");

  try {
    const data = await uploadProfilePicture(file);
    setProfile(data.user);
  } catch (error) {
    setError(error.message);
  } finally {
    setPictureLoading(false);
    e.target.value = "";
  }
};

const handlePictureDelete = async () => {
  setPictureLoading(true);
  setError("");

  try {
    const data = await deleteProfilePicture();
    setProfile(data.user);
  } catch (error) {
    setError(error.message);
  } finally {
    setPictureLoading(false);
  }
};

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = await updateProfile({
        name: profile.name,
        email: profile.email,
        about: profile.about,
      });

      setProfile(data.user);
      setEditing(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

const fetchBlockedUsers = async () => {
  setBlockedLoading(true);
  setBlockedError("");

  try {
    const token = localStorage.getItem("unmodesty_token");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/blocked-users`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(data.message || "Gagal memuat pengguna yang diblokir.");
    }

    setBlockedUsers(data);
  } catch (error) {
    setBlockedError(error.message);
  } finally {
    setBlockedLoading(false);
  }
};

const toggleBlockedUsers = () => {
  const nextState = !showBlockedUsers;
  setShowBlockedUsers(nextState);

  if (nextState) {
    fetchBlockedUsers();
  }
};

const handleUnblock = async (user) => {
  setUnblockingId(user.id);
  setBlockedError("");

  try {
    const token = localStorage.getItem("unmodesty_token");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/blocked-users/${user.id}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Gagal membuka blokir pengguna.");
    }

    setBlockedUsers((previous) =>
      previous.filter((blockedUser) => blockedUser.id !== user.id)
    );
  } catch (error) {
    setBlockedError(error.message);
  } finally {
    setUnblockingId(null);
  }
};
  
  if (loading || !profile) {
    return <main className="profile-page">Memuat profil...</main>;
  }

  return (
    <main className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
         <div className="profile-picture-section">
  <div className="profile-picture">
    {profile.profile_picture_url || profile.profile_picture ? (
      <img
        src={profile.profile_picture_url || profile.profile_picture}
        alt="Profile"
      />
    ) : (
      <span>{profile.name?.charAt(0).toUpperCase()}</span>
    )}
  </div>

  <div className="profile-picture-actions">
   <button
  type="button"
  className="profile-picture-icon-button"
  onClick={() => fileInputRef.current.click()}
  disabled={pictureLoading}
  title="Ganti Foto"
>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </svg>
</button>

{profile.profile_picture && (
  <button
    type="button"
    className="profile-picture-icon-button delete"
    onClick={handlePictureDelete}
    disabled={pictureLoading}
    title="Hapus Foto"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  </button>
)}

    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={handlePictureChange}
      hidden
    />
  </div>
</div>

          <div className="profile-heading">
            <h1>{profile.name}</h1>
            <p>{profile.email}</p>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section-heading">
            <h2>Informasi Profil</h2>

            <button
              type="button"
              className="profile-edit-button"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Batal" : "Edit Profil"}
            </button>
          </div>

          {error && <p className="profile-error">{error}</p>}

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="profile-field">
                <label>Nama</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="profile-field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="profile-field">
                <label>Tentang Saya</label>
                <textarea
                  name="about"
                  value={profile.about || ""}
                  onChange={handleChange}
                  maxLength={1000}
                  placeholder="Ceritakan sedikit tentang diri Anda..."
                />
              </div>

              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          ) : (
            <>
              <div className="profile-field">
                <label>Nama</label>
                <p>{profile.name}</p>
              </div>

              <div className="profile-field">
                <label>Email</label>
                <p>{profile.email}</p>
              </div>

              <div className="profile-field">
                <label>Password</label>
                <p>••••••••••</p>
              </div>

              <div className="profile-field">
                <label>Tentang Saya</label>
                <p>{profile.about || "Belum ada deskripsi."}</p>
              </div>
            </>
          )}
        </div>
        <div className="profile-content profile-blocked-section">
  <div className="profile-section-heading">
    <div>
      <h2>Pengguna Diblokir</h2>
      <p className="profile-blocked-description">
        Kelola pengguna yang tidak diizinkan mengajukan penawaran pada lelangmu.
      </p>
    </div>

    <button
      type="button"
      className="profile-edit-button"
      onClick={toggleBlockedUsers}
    >
      {showBlockedUsers ? "Tutup" : "Lihat Daftar"}
    </button>
  </div>

  {showBlockedUsers && (
    <div className="profile-blocked-list">
      {blockedLoading ? (
        <p className="profile-blocked-empty">Memuat daftar pengguna...</p>
      ) : blockedError ? (
        <p className="profile-error">{blockedError}</p>
      ) : blockedUsers.length === 0 ? (
        <p className="profile-blocked-empty">
          Belum ada pengguna yang diblokir.
        </p>
      ) : (
        blockedUsers.map((user) => (
          <div className="profile-blocked-user" key={user.id}>
            <div className="profile-blocked-user-info">
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={user.name}
                  className="profile-blocked-avatar"
                />
              ) : (
                <div className="profile-blocked-avatar-placeholder">
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}

              <strong>{user.name}</strong>
            </div>

            <button
              type="button"
              className="profile-unblock-button"
              onClick={() => handleUnblock(user)}
              disabled={unblockingId === user.id}
            >
              {unblockingId === user.id ? "Memproses..." : "Buka Blokir"}
            </button>
          </div>
        ))
      )}
    </div>
  )}
</div>
      </div>
    </main>
  );
}

export default Profile;
