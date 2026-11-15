
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function AuctionDetail() {
  const { id } = useParams();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const [bidSearch, setBidSearch] = useState("");
  const [bidSort, setBidSort] = useState("newest");
  const [bidPage, setBidPage] = useState(1);

  const bidsPerPage = 8;

  const token = localStorage.getItem("unmodesty_token");

  useEffect(() => {
    fetchAuction();
  }, [id]);

  async function fetchAuction() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/auctions/${id}`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load auction.");
      }

      setAuction(data.data || data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBid(e) {
    e.preventDefault();

    setBidMessage("");

    if (!token) {
      setBidMessage("Silakan login terlebih dahulu untuk melakukan penawaran.");
      return;
    }

    const amount = Number(bidAmount);

    if (!amount || amount <= Number(auction.current_price)) {
      setBidMessage("Penawaran harus lebih tinggi dari harga saat ini.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/auctions/${id}/bids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Penawaran gagal dikirim.");
      }

      setBidAmount("");
      setBidMessage("Penawaran berhasil dikirim!");

      await fetchAuction();
    } catch (err) {
      setBidMessage(err.message || "Terjadi kesalahan saat mengirim penawaran.");
    } finally {
      setSubmitting(false);
    }
  }

  const images = useMemo(() => {
    if (!auction) return [];

    if (Array.isArray(auction.images) && auction.images.length > 0) {
      return auction.images
        .map((image) => {
          if (typeof image === "string") return image;
          return image.image_url || image.url || image.path;
        })
        .filter(Boolean);
    }

    if (auction.image_url) return [auction.image_url];
    if (auction.image_path) return [auction.image_path];

    return [];
  }, [auction]);

  const bids = useMemo(() => {
    if (!auction || !Array.isArray(auction.bids)) return [];
    return auction.bids;
  }, [auction]);

  const filteredBids = useMemo(() => {
    const search = bidSearch.trim().toLowerCase();

    let result = bids.filter((bid) => {
      const bidderName =
        bid.user?.name ||
        bid.user_name ||
        bid.bidder_name ||
        "";

      return bidderName.toLowerCase().includes(search);
    });

    result = [...result].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      return bidSort === "newest"
        ? dateB - dateA
        : dateA - dateB;
    });

    return result;
  }, [bids, bidSearch, bidSort]);

  const totalBidPages = Math.max(
    1,
    Math.ceil(filteredBids.length / bidsPerPage)
  );

  const paginatedBids = filteredBids.slice(
    (bidPage - 1) * bidsPerPage,
    bidPage * bidsPerPage
  );

  useEffect(() => {
    setBidPage(1);
  }, [bidSearch, bidSort, id]);

  useEffect(() => {
    if (bidPage > totalBidPages) {
      setBidPage(totalBidPages);
    }
  }, [bidPage, totalBidPages]);

  function formatPrice(price) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(price || 0));
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="ad2-page">
        <p className="ad2-state">Memuat detail lelang...</p>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="ad2-page">
        <p className="ad2-state ad2-error">
          {error || "Lelang tidak ditemukan."}
        </p>
        <Link to="/auctions" className="ad2-back">
          Kembali ke daftar lelang
        </Link>
      </div>
    );
  }

  const isEnded =
    auction.status === "ended" ||
    (auction.ends_at && new Date(auction.ends_at) <= new Date());

  const sellerName =
    auction.user?.name ||
    auction.seller?.name ||
    "Penjual";

  const selectedBid =
    auction.selected_bid ||
    auction.selectedBid ||
    null;

  return (
    <div className="ad2-page">
      <Link to="/auctions" className="ad2-back">
        ← Kembali ke Lelang
      </Link>

      <div className="ad2-layout">
        <div className="ad2-gallery">
          {images.length > 0 ? (
            <>
              <div
                className="ad2-main-image"
                onClick={() => setFullscreen(true)}
              >
                <img
                  src={images[selectedImage] || images[0]}
                  alt={auction.name}
                />
                <span className="ad2-zoom-label">
                  Klik untuk memperbesar
                </span>
              </div>

              {images.length > 1 && (
                <div className="ad2-thumbnails">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={index}
                      className={`ad2-thumbnail ${
                        selectedImage === index ? "active" : ""
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img src={image} alt={`Foto ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="ad2-no-image">
              Tidak ada gambar
            </div>
          )}
        </div>

        <div className="ad2-information">
          <span className="ad2-category">
            {auction.category}
          </span>

          <h1>{auction.name}</h1>

          <div className="ad2-price">
            <span>Harga saat ini</span>
            <strong>{formatPrice(auction.current_price)}</strong>
          </div>

          <div className="ad2-seller">
            <span>Penjual</span>
            <strong>{sellerName}</strong>
          </div>

          <div className="ad2-deadline">
            <span>Batas waktu lelang</span>
            <strong>
              {formatDate(auction.ends_at)}
            </strong>
          </div>

          {selectedBid && (
            <div className="ad2-winner">
              <strong>Pemenang lelang</strong>
              <span>
                {selectedBid.user?.name ||
                  selectedBid.bidder_name ||
                  "Pemenang terpilih"}
              </span>
              <span>
                {formatPrice(selectedBid.amount)}
              </span>
            </div>
          )}

          <div className="ad2-description">
            <h2>Deskripsi Barang</h2>
            <p>{auction.description || "Tidak ada deskripsi."}</p>
          </div>

          {!isEnded && (
            <form className="ad2-bid-form" onSubmit={handleBid}>
              <label htmlFor="ad2-bid-amount">
                Masukkan penawaran
              </label>

              <input
                id="ad2-bid-amount"
                type="number"
                min={Number(auction.current_price) + 1}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Masukkan nominal penawaran"
                required
              />

              <button type="submit" disabled={submitting}>
                {submitting ? "Mengirim..." : "Ajukan Penawaran"}
              </button>

              {bidMessage && (
                <p className="ad2-message">{bidMessage}</p>
              )}
            </form>
          )}

          {isEnded && (
            <p className="ad2-ended">
              Lelang ini telah berakhir.
            </p>
          )}
        </div>
      </div>

      <section className="ad2-bids">
        <div className="ad2-bids-heading">
          <div>
            <h2>Riwayat Penawaran</h2>
            <p>{bids.length} penawaran tercatat</p>
          </div>
        </div>

        <div className="ad2-bid-tools">
          <input
            type="search"
            value={bidSearch}
            onChange={(e) => setBidSearch(e.target.value)}
            placeholder="Cari nama penawar..."
            aria-label="Cari nama penawar"
          />

          <select
            value={bidSort}
            onChange={(e) => setBidSort(e.target.value)}
            aria-label="Urutkan penawaran"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>

        {paginatedBids.length > 0 ? (
          <>
            <div className="ad2-bid-list">
              {paginatedBids.map((bid, index) => {
                const bidderName =
                  bid.user?.name ||
                  bid.user_name ||
                  bid.bidder_name ||
                  "Pengguna";

                const isWinner =
                  selectedBid &&
                  String(selectedBid.id) === String(bid.id);

                return (
                  <div
                    className="ad2-bid-item"
                    key={bid.id || `${bid.created_at}-${index}`}
                  >
                    <div className="ad2-bid-person">
                      <strong>{bidderName}</strong>
                      <span>{formatDate(bid.created_at)}</span>
                    </div>

                    <div className="ad2-bid-amount">
                      <strong>{formatPrice(bid.amount)}</strong>
                      {isWinner && (
                        <span className="ad2-winner-label">
                          Pemenang
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="ad2-pagination">
              <span>
                Halaman {bidPage} dari {totalBidPages}
              </span>

              <div className="ad2-pagination-buttons">
                <button
                  type="button"
                  disabled={bidPage === 1}
                  onClick={() => setBidPage((page) => page - 1)}
                >
                  Sebelumnya
                </button>

                {Array.from(
                  { length: totalBidPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={bidPage === page ? "active" : ""}
                    onClick={() => setBidPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={bidPage === totalBidPages}
                  onClick={() => setBidPage((page) => page + 1)}
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="ad2-empty-bids">
            {bidSearch
              ? "Tidak ada penawaran yang cocok dengan pencarian."
              : "Belum ada penawaran untuk lelang ini."}
          </div>
        )}
      </section>

      {fullscreen && images.length > 0 && (
        <div
          className="ad2-fullscreen"
          onClick={() => setFullscreen(false)}
        >
          <button
            type="button"
            className="ad2-fullscreen-close"
            onClick={() => setFullscreen(false)}
          >
            ×
          </button>

          <img
            src={images[selectedImage]}
            alt={auction.name}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default AuctionDetail;
