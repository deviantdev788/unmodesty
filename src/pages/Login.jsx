import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await login({ email, password });
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

        <p className="hero-label">SELAMAT DATANG KEMBALI</p>
        <h1>Masuk ke akunmu</h1>
        <p className="auth-description">
          Masuk untuk mengikuti lelang dan mengelola aktivitasmu.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Alamat email</label>
          <input
            id="login-email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Kata sandi</label>
          <input
            id="login-password"
            type="password"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>

          {message && (
            <p className="auth-message" role="alert">
              {message}
            </p>
          )}
        </form>

        <p className="auth-switch">
          Belum punya akun? <Link to="/register">Daftar sekarang</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Kembali ke beranda
        </Link>
      </section>
    </main>
  );
}

export default Login;
