
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

const auctions = [
  {
    id: 1,
    name: "Kamera Digital Canon",
    category: "Elektronik",
    price: 850000,
    bids: 12,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
    endsIn: "02:14:35",
    description: "Kamera digital untuk mengabadikan momen dengan hasil yang tajam. Cocok untuk fotografi sehari-hari maupun perjalanan.",
  },
  {
    id: 2,
    name: "Jam Tangan Klasik",
    category: "Aksesori",
    price: 425000,
    bids: 8,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80",
    endsIn: "05:32:10",
    description: "Jam tangan bergaya klasik dengan desain minimalis yang cocok untuk berbagai kesempatan.",
  },
  {
    id: 3,
    name: "Headphone Nirkabel",
    category: "Elektronik",
    price: 275000,
    bids: 6,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    endsIn: "01:08:42",
    description: "Headphone dengan desain modern untuk menemani aktivitas, hiburan, dan mendengarkan musik.",
  },
  {
    id: 4,
    name: "Sepatu Sneakers",
    category: "Fashion",
    price: 390000,
    bids: 15,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    endsIn: "08:45:20",
    description: "Sneakers bergaya kasual yang mudah dipadukan dengan berbagai pilihan pakaian.",
  },
  {
    id: 5,
    name: "Kamera Polaroid",
    category: "Elektronik",
    price: 520000,
    bids: 9,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
    endsIn: "03:20:15",
    description: "Kamera bergaya instan dengan tampilan retro untuk mengabadikan berbagai momen.",
  },
  {
    id: 6,
    name: "Tas Kulit Minimalis",
    category: "Fashion",
    price: 310000,
    bids: 4,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80",
    endsIn: "06:12:08",
    description: "Tas bergaya minimalis untuk membawa barang-barang penting saat beraktivitas.",
  },
];

const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);

function AuctionDetail() {
  const { id } = useParams();
  const auction = auctions.find((item) => item.id === Number(id));
  const [bid, setBid] = useState("");
  const [message, setMessage] = useState("");

  if (!auction) {
    return (
      <main className="auction-detail-page">
        <h1>Lelang tidak ditemukan</h1>
        <p>Barang yang kamu cari tidak tersedia.</p>
        <Link className="detail-back-link" to="/auctions">
          ← Kembali ke daftar lelang
        </Link>
      </main>
    );
  }

  const submitBid = (event) => {
    event.preventDefault();

    const amount = Number(bid);

    if (!Number.isFinite(amount) || amount <= auction.price) {
      setMessage(
        `Tawaran harus lebih tinggi dari ${formatPrice(auction.price)}.`
      );
      return;
    }

    setMessage(
      "Tampilan penawaran ini masih berupa demo. Belum ada tawaran yang dikirim atau disimpan."
    );
  };

  return (
    <main className="auction-detail-page">
      <Link className="detail-back-link" to="/auctions">
        ← Kembali ke daftar lelang
      </Link>

      <div className="auction-detail-layout">
        <div className="detail-image-wrap">
          <img src={auction.image} alt={auction.name} />
        </div>

        <section className="detail-information">
          <span className="detail-category">{auction.category}</span>
          <h1>{auction.name}</h1>
          <p className="detail-description">{auction.description}</p>

          <div className="detail-price-box">
            <p>Harga saat ini</p>
            <h2>{formatPrice(auction.price)}</h2>
            <span>{auction.bids} penawaran</span>
          </div>

          <div className="detail-seller">
            <div className="seller-avatar">U</div>
            <div>
              <p className="seller-label">Dijual oleh</p>
              <p className="seller-name">Pengguna Unmodesty</p>
            </div>
          </div>

          <div className="detail-deadline">
            <span>Waktu tersisa (contoh)</span>
            <strong>{auction.endsIn}</strong>
          </div>

          <form className="bid-form" onSubmit={submitBid}>
            <label htmlFor="bid-amount">Masukkan tawaranmu (Rp)</label>
            <input
              id="bid-amount"
              type="number"
              min={auction.price + 1}
              step="1000"
              placeholder="Contoh: 900000"
              value={bid}
              onChange={(event) => {
                setBid(event.target.value);
                setMessage("");
              }}
              required
            />
            <button type="submit" className="auction-button">
              Ajukan Tawaran
            </button>
            {message && (
              <p className="bid-message" role="status">
                {message}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

export default AuctionDetail;
