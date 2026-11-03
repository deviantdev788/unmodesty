import { useState, useEffect } from "react";import { Link } from "react-router-dom";
const sampleAuctions = [
  {
    id: 1,
    name: "Kamera Digital Canon",
    category: "Elektronik",
    price: 850000,
    bids: 12,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
    endsIn: "02:14:35",
  },
  {
    id: 2,
    name: "Jam Tangan Klasik",
    category: "Aksesori",
    price: 425000,
    bids: 8,
    image:
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
    endsIn: "05:32:10",
  },
  {
    id: 3,
    name: "Headphone Nirkabel",
    category: "Elektronik",
    price: 275000,
    bids: 6,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    endsIn: "01:08:42",
  },
  {
    id: 4,
    name: "Sepatu Sneakers",
    category: "Fashion",
    price: 390000,
    bids: 15,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    endsIn: "08:45:20",
  },
  {
    id: 5,
    name: "Kamera Polaroid",
    category: "Elektronik",
    price: 520000,
    bids: 9,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
    endsIn: "03:20:15",
  },
  {
    id: 6,
    name: "Tas Kulit Minimalis",
    category: "Fashion",
    price: 310000,
    bids: 4,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80",
    endsIn: "06:12:08",
  },
];

const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);

function BackendStatus() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    fetch("https://unmodesty-api.onrender.com/connection-test")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then(() => setStatus("Connected"))
      .catch(() => setStatus("Not connected"));
  }, []);

  return <p>Laravel: {status}</p>;
}

function Auctions() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [sort, setSort] = useState("Terbaru");

  const categories = [
    "Semua",
    "Elektronik",
    "Fashion",
    "Aksesori",
  ];

  const filteredAuctions = sampleAuctions
    .filter((auction) => {
      const matchesSearch = auction.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "Semua" || auction.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sort === "Harga Terendah") return a.price - b.price;
      if (sort === "Harga Tertinggi") return b.price - a.price;
      if (sort === "Penawaran Terbanyak") return b.bids - a.bids;
      return a.id - b.id;
    });

  return (
    <main className="auctions-page">
      <BackendStatus />
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

      <section className="auction-grid">
        {filteredAuctions.map((auction) => (
          <article className="auction-card" key={auction.id}>
            <div className="auction-image">
              <img src={auction.image} alt={auction.name} />
              <span className="auction-category">
                {auction.category}
              </span>
            </div>

            <div className="auction-details">
              <h2>{auction.name}</h2>

              <p className="auction-price-label">Harga saat ini</p>
              <p className="auction-price">
                {formatPrice(auction.price)}
              </p>

              <div className="auction-meta">
                <span>{auction.bids} penawaran</span>
                <span>Berakhir {auction.endsIn}</span>
              </div>


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

      {filteredAuctions.length === 0 && (
        <p className="auction-empty">
          Barang lelang tidak ditemukan.
        </p>
      )}
    </main>
  );
}

export default Auctions;
