
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(price || 0));

const formatDate = (date) =>
  new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const getStatus = (auction) => {
  if (auction.status === "completed") return "Selesai";
  if (auction.status !== "active") return "Ditutup";
  if (new Date(auction.ends_at).getTime() <= Date.now()) return "Berakhir";
  return "Aktif";
};

const getImage = (auction) => auction.images?.[0]?.image_url;

function Bids() {
  const [activeTab, setActiveTab] = useState("placed");
  const [placedAuctions, setPlacedAuctions] = useState([]);
  const [receivedAuctions, setReceivedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const fetchBids = useCallback(async () => {
    const token = localStorage.getItem("unmodesty_token");

    if (!token) {
      setError("Silakan masuk ke akunmu terlebih dahulu.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [placedResponse, receivedResponse] = await Promise.all([
        fetch(`${API_URL}/bids/placed`, { headers }),
        fetch(`${API_URL}/bids/received`, { headers }),
      ]);

      const placedData = await placedResponse.json();
      const receivedData = await receivedResponse.json();

      if (!placedResponse.ok) {
        throw new Error(placedData.message || "Gagal memuat penawaran yang kamu ajukan.");
      }

      if (!receivedResponse.ok) {
        throw new Error(receivedData.message || "Gagal memuat penawaran yang masuk.");
      }

      setPlacedAuctions(Array.isArray(placedData) ? placedData : []);
      setReceivedAuctions(Array.isArray(receivedData) ? receivedData : []);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat memuat penawaran.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  const handleSelectBid = async () => {
    if (!confirmation) return;

    const token = localStorage.getItem("unmodesty_token");
    const { auction, bid } = confirmation;

    setSelecting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/auctions/${auction.id}/bids/${bid.id}/select`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal memilih pemenang.");
      }

      setConfirmation(null);
      setMessage(`Penawaran dari ${bid.user?.name || "pengguna"} berhasil dipilih sebagai pemenang.`);
      await fetchBids();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat memilih pemenang.");
    } finally {
      setSelecting(false);
    }
  };

  const renderAuctionImage = (auction) => {
    const image = getImage(auction);

    return (
      <div className="bids-image">
        {image ? (
          <img src={image} alt={auction.name} />
        ) : (
          <span>Tidak ada gambar</span>
        )}
      </div>
    );
  };

  const renderPlaced = () => {
    if (placedAuctions.length === 0) {
      return (
        <div className="bids-empty">
          <h3>Belum ada penawaran</h3>
          <p>Kamu belum mengajukan penawaran pada lelang mana pun.</p>
          <Link to="/auctions" className="sell-submit bids-empty-link">
            Jelajahi Lelang
          </Link>
        </div>
      );
    }

    return (
      <div className="bids-auction-list">
        {placedAuctions.map((auction) => {
          const myBid = auction.bids?.[0];

          return (
            <article className="bids-auction-card" key={auction.id}>
              {renderAuctionImage(auction)}

              <div className="bids-auction-info">
                <div className="bids-card-heading">
                  <span className={`bids-status ${auction.status === "completed" ? "completed" : ""}`}>
                    {getStatus(auction)}
                  </span>
                  <span className="bids-count">{auction.bids_count || 0} penawaran</span>
                </div>

                <h3>{auction.name}</h3>
                <p className="bids-category">{auction.category}</p>

                <div className="bids-price-grid">
                  <div>
                    <span>Harga saat ini</span>
                    <strong>{formatPrice(auction.current_price)}</strong>
                  </div>
                  <div>
                    <span>Penawaran kamu</span>
                    <strong>{formatPrice(myBid?.amount)}</strong>
                  </div>
                </div>

                {auction.status === "completed" && auction.selected_bid_id && (
                  <p className="bids-result">
                    {Number(auction.selected_bid_id) === Number(myBid?.id)
                      ? "Penawaran kamu terpilih sebagai pemenang."
                      : "Penawaran kamu tidak terpilih."}
                  </p>
                )}

                <Link to={`/auctions/${auction.id}`} className="bids-view-link">
                  Lihat Lelang
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const renderReceived = () => {
    if (receivedAuctions.length === 0) {
      return (
        <div className="bids-empty">
          <h3>Belum ada penawaran masuk</h3>
          <p>Belum ada pengguna yang mengajukan penawaran pada lelangmu.</p>
          <Link to="/sell" className="sell-submit bids-empty-link">
            Jual Barang
          </Link>
        </div>
      );
    }

    return (
      <div className="bids-received-list">
        {receivedAuctions.map((auction) => {
          const selectedBid = auction.selected_bid || auction.selectedBid;
          const isCompleted = auction.status === "completed" || Boolean(auction.selected_bid_id);

          return (
            <article className="bids-received-card" key={auction.id}>
              <div className="bids-received-heading">
                {renderAuctionImage(auction)}

                <div className="bids-received-title">
                  <span className={`bids-status ${isCompleted ? "completed" : ""}`}>
                    {getStatus(auction)}
                  </span>
                  <h3>{auction.name}</h3>
                  <p>{auction.bids_count || auction.bids?.length || 0} penawaran masuk</p>
                  <strong>{formatPrice(auction.current_price)}</strong>
                  <Link to={`/auctions/${auction.id}`} className="bids-view-link">
                    Lihat Lelang
                  </Link>
                </div>
              </div>

              <div className="bids-incoming-list">
                <h4>Daftar Penawaran</h4>

                {auction.bids?.length ? (
                  auction.bids.map((bid) => {
                    const isWinner =
                      Number(auction.selected_bid_id) === Number(bid.id);

                    return (
                      <div className="bids-incoming-item" key={bid.id}>
                        <div className="bids-bidder">
                          <div className="bids-avatar">
                            {bid.user?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <strong>{bid.user?.name || "Pengguna"}</strong>
                            <span>{formatDate(bid.created_at)}</span>
                          </div>
                        </div>

                        <div className="bids-incoming-action">
                          <strong>{formatPrice(bid.amount)}</strong>

                          {isWinner ? (
                            <span className="bids-winner-tag">Pemenang</span>
                          ) : !isCompleted ? (
                            <button
                              type="button"
                              className="bids-select-button"
                              onClick={() => setConfirmation({ auction, bid })}
                            >
                              Pilih Pemenang
                            </button>
                          ) : (
                            <span className="bids-not-selected">Tidak terpilih</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="bids-no-items">Belum ada data penawaran.</p>
                )}
              </div>

              {isCompleted && selectedBid?.user && (
                <div className="bids-completed-note">
                  Pemenang lelang: <strong>{selectedBid.user.name}</strong>
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <main className="bids-page">
      <div className="bids-container">
        <header className="bids-heading">
          <p className="sell-eyebrow">AKTIVITAS LELANG</p>
          <h1>Penawaran</h1>
          <p>Pantau penawaran yang kamu ajukan dan kelola penawaran yang masuk pada lelangmu.</p>
        </header>

        <div className="bids-tabs">
          <button
            type="button"
            className={activeTab === "placed" ? "active" : ""}
            onClick={() => {
              setActiveTab("placed");
              setMessage("");
              setError("");
            }}
          >
            Penawaran Saya
          </button>
          <button
            type="button"
            className={activeTab === "received" ? "active" : ""}
            onClick={() => {
              setActiveTab("received");
              setMessage("");
              setError("");
            }}
          >
            Penawaran Masuk
          </button>
        </div>

        {error && <div className="bids-error">{error}</div>}
        {message && <div className="bids-success">{message}</div>}

        {loading ? (
          <p className="bids-loading">Memuat penawaran...</p>
        ) : (
          activeTab === "placed" ? renderPlaced() : renderReceived()
        )}
      </div>

      {confirmation && (
        <div className="bids-modal-overlay">
          <div className="bids-confirm-modal">
            <div className="bids-modal-icon">!</div>
            <h2>Pilih Pemenang?</h2>
            <p>
              Kamu akan memilih <strong>{confirmation.bid.user?.name || "pengguna"}</strong> sebagai
              pemenang lelang <strong>{confirmation.auction.name}</strong> dengan penawaran sebesar{" "}
              <strong>{formatPrice(confirmation.bid.amount)}</strong>.
            </p>
            <p className="bids-modal-warning">
              Setelah dipilih, lelang akan langsung ditutup dan pemenang tidak dapat diganti.
            </p>
            <div className="bids-modal-actions">
              <button
                type="button"
                className="bids-modal-cancel"
                onClick={() => setConfirmation(null)}
                disabled={selecting}
              >
                Batal
              </button>
              <button
                type="button"
                className="bids-modal-confirm"
                onClick={handleSelectBid}
                disabled={selecting}
              >
                {selecting ? "Memproses..." : "Ya, Pilih Pemenang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Bids;
