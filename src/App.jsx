import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Auctions from "./pages/Auctions";
import AuctionDetail from "./pages/AuctionDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Sell from "./pages/Sell";
import Edit from "./pages/Edit";
import Bids from "./pages/Bids";
import Notifications from "./pages/Notifications";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="auction-empty">Memeriksa akun...</p>;
  }

  if (!user) {
    return (
      <main className="auctions-page">
        <section className="auctions-heading">
          <h1>Login diperlukan</h1>
          <p>Silakan masuk ke akunmu terlebih dahulu untuk menjual barang.</p>
          <Link to="/login" className="auction-button">
            Masuk ke Akun
          </Link>
        </section>
      </main>
    );
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />
          <Route path="/sell" element={
            <ProtectedRoute>
              <Sell />
            </ProtectedRoute>
          } />
          <Route path="/edit" element={
          <ProtectedRoute>
          <Edit />
          </ProtectedRoute>
          } />
          <Route path="/bids" element={
          <ProtectedRoute>
          <Bids />
          </ProtectedRoute>
          } />
          <Route
          path="/notifications"
          element={
          <ProtectedRoute>
          <Notifications />
          </ProtectedRoute>
          }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
