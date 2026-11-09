
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

const formatCountdown = (endsAt, now) => {
  if (!endsAt || Number.isNaN(new Date(endsAt).getTime())) {
    return "Tidak tersedia";
  }

  const remaining = Math.max(0, new Date(endsAt).getTime() - now);

  if (remaining === 0) return "Berakhir";

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const time = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");

  return days > 0 ? `${days} hari ${time}` : time;
};

function Auctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [sort, setSort] = useState("Terbaru");
  const [now, setNow] = useState(Date.now());
  const [retry, setRetry] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  const categories = [
    "Semua",
    "Elektronik",
    "Fashion",
    "Aksesori",
    "Rumah Tangga",
    "Hobi",
    "Lainnya",
  ];

  useEffect(() => {
    let cancelled = false;

    const fetchAuctions = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auctions`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || `Server error: HTTP ${response.status}`
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("Format data lelang dari server tidak valid.");
        }

        if (!cancelled) {
          setAuctions(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message === "Failed to fetch"
              ? "Tidak dapat terhubung ke server. Periksa koneksi internetmu."
              : err.message
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAuctions();

    return () => {
      cancelled = true;
    };
  }, [retry]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredAuctions = auctions
    .filter((auction) => {
      const name = String(auction.name || "").toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());

      const matchesCategory =
        category === "Semua" || auction.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sort === "Harga Terendah") {
        return Number(a.current_price || 0) - Number(b.current_price || 0);
      }

      if (sort === "Harga Tertinggi") {
        return Number(b.current_price || 0) - Number(a.current_price || 0);
      }

      if (sort === "Penawaran Terbanyak") {
        return Number(b.bids_count || 0) - Number(a.bids_count || 0);
      }

      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAuctions = filteredAuctions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, sort]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main className="auctions-page">
      <section className="auctions-heading">
        <p className="hero-label">UNMODESTY MARKETPLACE</p>
        <h1>Temukan lelang pilihanmu.</h1>
        <p>
          Jelajahi barang menarik dan ajukan tawaran untuk
          mendapatkan barang yang kamu inginkan.
        </p>
      </section>

      <section className="auction-tools">
        <input
          type="search"
          placeholder="Cari barang lelang..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Cari barang lelang"
        />

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter kategori"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="Urutkan lelang"
        >
          <option>Terbaru</option>
          <option>Harga Terendah</option>
          <option>Harga Tertinggi</option>
          <option>Penawaran Terbanyak</option>
        </select>
      </section>

      {loading && (
        <p className="auction-empty">Memuat barang lelang...</p>
      )}

      {!loading && error && (
        <section className="auction-empty">
          <p>Gagal mengambil data lelang.</p>
          <p>{error}</p>
          <button
            type="button"
            className="auction-button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Coba Lagi
          </button>
        </section>
      )}

      {!loading && !error && auctions.length === 0 && (
        <section className="auction-empty">
          <h2>Belum Ada Barang Lelang</h2>
          <p>
            Saat ini belum ada barang yang dilelang. Silakan kembali lagi
            nanti atau jadilah penjual pertama.
          </p>
          <Link to="/sell" className="auction-button">
            Jual Barang
          </Link>
        </section>
      )}

      {!loading && !error && auctions.length > 0 && (
        <>
          {filteredAuctions.length > 0 ? (
            <>
              <section className="auction-grid">
                {paginatedAuctions.map((auction) => (
                  <article className="auction-card" key={auction.id}>
                    <div className="auction-image">
                      {auction.images?.length > 0 && auction.images[0]?.image_url ? (
                        <img
                          src={auction.images[0].image_url}
                          alt={auction.name || "Barang lelang"}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>Gambar tidak tersedia</span>
                      )}

                      <span className="auction-category">
                        {auction.category || "Lainnya"}
                      </span>
                    </div>

                    <div className="auction-details">
                      <h2>{auction.name || "Tanpa Nama"}</h2>

                      <p className="auction-price-label">Harga saat ini</p>
                      <p className="auction-price">
                        {formatPrice(auction.current_price)}
                      </p>

                      <div className="auction-meta">
                        <span>{Number(auction.bids_count || 0)} penawaran</span>
                        <span>
                          Berakhir {formatCountdown(auction.ends_at, now)}
                        </span>
                      </div>

                      <p>
                        Penjual: {auction.user?.name || "Tidak diketahui"}
                      </p>

                      <Link
                        to={`/auctions/${auction.id}`}
                        className="auction-button auction-detail-link"
                      >
                        Lihat Detail
                      </Link>
                    </div>
                  </article>
                ))}
              </section>

              {totalPages > 1 && (
                <nav className="auction-pagination" aria-label="Navigasi halaman lelang">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page - 1)}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        className={currentPage === page ? "active" : ""}
                        onClick={() => setCurrentPage(page)}
                        aria-current={currentPage === page ? "page" : undefined}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Berikutnya
                  </button>
                </nav>
              )}

              <p className="auction-pagination-info">
                Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredAuctions.length)} dari {filteredAuctions.length} barang
              </p>
            </>
          ) : (
            <section className="auction-empty">
              <h2>Barang Tidak Ditemukan</h2>
              <p>
                Tidak ada barang lelang yang sesuai dengan pencarian atau
                kategori pilihanmu.
              </p>
              <button
                type="button"
                className="auction-button"
                onClick={() => {
                  setSearch("");
                  setCategory("Semua");
                }}
              >
                Reset Filter
              </button>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default Auctions;
