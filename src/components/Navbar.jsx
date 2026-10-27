
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          UNMODESTY<span>.</span>
        </Link>

        <div className="nav-links">
          <Link to="/">Beranda</Link>
          <Link to="/auctions">Lelang</Link>
          <Link to="/categories">Kategori</Link>
          <Link to="/sell">Jual Barang</Link>
        </div>

        <div className="nav-account">
          <Link to="/login">Masuk</Link>
          <Link to="/register" className="register-button">
            Daftar
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
