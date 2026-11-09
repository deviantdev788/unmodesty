
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Kata sandi harus terdiri dari minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      navigate("/");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-logo">
          UNMODESTY<span>.</span>
        </Link>

        <p className="hero-label">GABUNG DENGAN UNMODESTY</p>
        <h1>Buat akun baru</h1>
        <p className="auth-description">
          Daftar untuk menemukan barang menarik dan ikut serta dalam lelang.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="register-name">Nama lengkap</label>
          <input
            id="register-name"
            type="text"
            placeholder="Masukkan nama lengkap"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />

          <label htmlFor="register-email">Alamat email</label>
          <input
            id="register-email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="register-password">Kata sandi</label>
          <input
            id="register-password"
            type="password"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="register-confirm-password">
            Konfirmasi kata sandi
          </label>
          <input
            id="register-confirm-password"
            type="password"
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Memproses..." : "Buat Akun"}
          </button>

          {message && (
            <p className="auth-message" role="alert">
              {message}
            </p>
          )}
        </form>

        <p className="auth-switch">
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Kembali ke beranda
        </Link>
      </section>
    </main>
  );
}

export default Register;
