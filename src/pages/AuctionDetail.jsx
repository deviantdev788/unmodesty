import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

const formatRemaining = (endsAt, now) => {
  const difference = new Date(endsAt).getTime() - now;

  if (!Number.isFinite(difference) || difference <= 0) {
    return "Lelang berakhir";
  }

  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} hari ${hours} jam ${minutes} menit`;
  }

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function AuctionDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bid, setBid] = useState("");
  const [message, setMessage] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageFullscreen, setImageFullscreen] = useState(false);

  const fetchAuction = async () => {
    setError("");

    try {
      const response = await fetch(`${API_URL}/auctions/${id}`, {
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `Gagal memuat lelang. HTTP ${response.status}`
        );
      }

      setAuction(data.auction ?? data);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat memuat lelang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setAuction(null);
    setSelectedImageIndex(0);
    fetchAuction();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const submitBid = async (event) => {
    event.preventDefault();
    setMessage("");

    const token = localStorage.getItem("unmodesty_token");
    const amount = Number(bid);

    if (!token) {
      setMessage("Silakan masuk terlebih dahulu untuk mengajukan tawaran.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= Number(auction.current_price)) {
      setMessage(
        `Tawaran harus lebih tinggi dari ${formatPrice(auction.current_price)}.`
      );
      return;
    }

    setBidLoading(true);

    try {
      const response = await fetch(`${API_URL}/auctions/${id}/bids`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const validationErrors = data.errors
          ? Object.values(data.errors).flat().join(" ")
          : null;

        throw new Error(
          validationErrors || data.message || `HTTP ${response.status}`
        );
      }

      setBid("");
      setMessage("Tawaran berhasil diajukan!");
      await fetchAuction();
    } catch (err) {
      setMessage(err.message || "Gagal mengajukan tawaran.");
    } finally {
      setBidLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <main className="auction-detail-page">
        <p className="detail-state">Memuat informasi lelang...</p>
      </main>
    );
  }

  if (error || !auction) {
    return (
      <main className="auction-detail-page">
        <h1>Lelang tidak ditemukan</h1>
        <p className="detail-state">
          {error || "Barang yang kamu cari tidak tersedia."}
        </p>
        <button className="auction-button" onClick={fetchAuction}>
          Coba Lagi
        </button>
        <Link className="detail-back-link" to="/auctions">
          Kembali ke daftar lelang
        </Link>
      </main>
    );
  }

  const auctionImages = auction.images || [];
  const selectedImage = auctionImages[selectedImageIndex] || auctionImages[0];
  const bids = auction.bids || [];
  const currentPrice = Number(auction.current_price);
  const ended =
    auction.status !== "active" ||
    new Date(auction.ends_at).getTime() <= now;
  const isOwner = user && Number(user.id) === Number(auction.user_id);
  const selectedBid = auction.selected_bid_id
    ? bids.find((item) => Number(item.id) === Number(auction.selected_bid_id))
    : null;

  return (
    <main className="auction-detail-page">
      <Link className="detail-back-link" to="/auctions">
        ← Kembali ke daftar lelang
      </Link>

      <div className="auction-detail-layout">
        <div className="detail-gallery">
          <div className="detail-image-wrap">
            {selectedImage?.image_url ? (
              <button
                type="button"
                className="detail-main-image-button"
                onClick={() => setImageFullscreen(true)}
                aria-label="Lihat gambar ukuran penuh"
              >
                <img
                  src={selectedImage.image_url}
                  alt={auction.name || "Barang lelang"}
                />
              </button>
            ) : (
              <div className="detail-image-placeholder">
                Tidak ada gambar
              </div>
            )}
          </div>

          {auctionImages.length > 1 && (
            <div className="detail-image-thumbnails">
              {auctionImages.map((image, index) => (
                <button
                  type="button"
                  key={image.id || index}
                  className={`detail-thumbnail ${
                    selectedImageIndex === index ? "active" : ""
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`Lihat gambar ${index + 1}`}
                  aria-pressed={selectedImageIndex === index}
                >
                  <img
                    src={image.image_url}
                    alt={`${auction.name} - gambar ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="detail-information">
          <span className="detail-category">{auction.category}</span>
          <h1>{auction.name}</h1>

          <p className="detail-description">
            {auction.description || "Tidak ada deskripsi untuk barang ini."}
          </p>

          <div className="detail-price-box">
            <p>Harga saat ini</p>
            <h2>{formatPrice(currentPrice)}</h2>
            <span>{auction.bids_count ?? bids.length} penawaran</span>
          </div>

          <div className="detail-seller">
            <div className="seller-avatar">
              {auction.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="seller-label">Dijual oleh</p>
              <p className="seller-name">
                {auction.user?.name || "Pengguna Unmodesty"}
              </p>
            </div>
          </div>

          <div className="detail-deadline">
            <span>Waktu tersisa</span>
            <strong>{formatRemaining(auction.ends_at, now)}</strong>
          </div>

          <div className="detail-deadline">
            <span>Berakhir pada</span>
            <strong>{formatDate(auction.ends_at)}</strong>
          </div>

          {auction.status === "completed" && (
            <div className="bid-winner-box">
              <strong>Lelang telah selesai</strong>
              {selectedBid ? (
                <>
                  <span>Pemenang lelang</span>
                  <strong>{selectedBid.user?.name || "Pengguna"}</strong>
                  <span>Penawaran terpilih</span>
                  <strong>{formatPrice(selectedBid.amount)}</strong>
                </>
              ) : (
                <span>Penawaran pemenang telah dipilih.</span>
              )}
            </div>
          )}

          {ended ? (
            auction.status !== "completed" && (
              <p className="bid-message">Lelang ini sudah berakhir.</p>
            )
          ) : isOwner ? (
            <p className="bid-message">
              Kamu adalah penjual barang ini dan tidak dapat menawar barang sendiri.
              Kelola penawaran yang masuk melalui halaman Penawaran.
            </p>
          ) : !user ? (
            <div className="bid-login">
              <p>Masuk ke akunmu untuk mengajukan tawaran.</p>
              <Link to="/login" className="auction-button auction-detail-link">
                Masuk untuk Menawar
              </Link>
            </div>
          ) : (
            <form className="bid-form" onSubmit={submitBid}>
              <label htmlFor="bid-amount">
                Masukkan tawaranmu (Rp)
              </label>
              <input
                id="bid-amount"
                type="number"
                min={currentPrice + 1}
                step="1"
                placeholder={`Lebih dari ${formatPrice(currentPrice)}`}
                value={bid}
                onChange={(event) => {
                  setBid(event.target.value);
                  setMessage("");
                }}
                required
              />
              <button
                type="submit"
                className="auction-button"
                disabled={bidLoading || !bid || Number(bid) <= currentPrice}
              >
                {bidLoading ? "Mengirim Tawaran..." : "Ajukan Tawaran"}
              </button>
              {message && (
                <p className="bid-message" role="status">
                  {message}
                </p>
              )}
            </form>
          )}

          {auction.status !== "active" && auction.status !== "completed" && (
            <p className="bid-message">Status: {auction.status}</p>
          )}
        </section>
      </div>

      <section className="detail-bids">
        <h2>Riwayat Penawaran</h2>

        {bids.length === 0 ? (
          <p className="detail-state">Belum ada penawaran untuk barang ini.</p>
        ) : (
          <div className="detail-bid-list">
            {bids.map((item) => {
              const isWinner =
                Number(item.id) === Number(auction.selected_bid_id);

              return (
                <div className="detail-bid-item" key={item.id}>
                  <div>
                    <strong>
                      {item.user?.name || "Pengguna"}
                      {isWinner && (
                        <span className="bid-winner-label">Pemenang</span>
                      )}
                    </strong>
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                  <strong>{formatPrice(item.amount)}</strong>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {imageFullscreen && selectedImage?.image_url && (
        <div
          className="image-fullscreen-overlay"
          onClick={() => setImageFullscreen(false)}
        >
          <button
            type="button"
            className="image-fullscreen-close"
            onClick={() => setImageFullscreen(false)}
            aria-label="Tutup gambar"
          >
            ×
          </button>

          <img
            src={selectedImage.image_url}
            alt={auction.name || "Barang lelang"}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}

export default AuctionDetail;
 