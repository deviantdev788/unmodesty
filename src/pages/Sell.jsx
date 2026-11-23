import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function Sell() {
  const [form, setForm] = useState({
    name: "",
    category: "Elektronik",
    description: "",
    starting_price: "",
    ends_at: "",
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const imagePreviews = useMemo(() => {
    return selectedImages.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [imagePreviews]);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);

    event.target.value = "";

    if (selectedImages.length + files.length > 5) {
      setError("Maksimal 5 gambar untuk setiap lelang.");
      return;
    }

    const invalidFile = files.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024
    );

    if (invalidFile) {
      setError("Gunakan gambar JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.");
      return;
    }

    setSelectedImages((previous) => [...previous, ...files]);
    setError("");
  };

  const removeImage = (index) => {
    setSelectedImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const token = localStorage.getItem("unmodesty_token");

    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan masuk kembali.");
      return;
    }

    if (new Date(form.ends_at).getTime() <= Date.now()) {
      setError("Waktu berakhir lelang harus berada di masa depan.");
      return;
    }

    const formData = new FormData();

    formData.append("name", form.name);
    formData.append("category", form.category);
    formData.append("description", form.description);
    formData.append("starting_price", form.starting_price);
    formData.append("ends_at", new Date(form.ends_at).toISOString());

    selectedImages.forEach((file) => {
      formData.append("images[]", file);
    });

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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

      if (!data.auction) {
        throw new Error(
          "Server menerima permintaan, tetapi data lelang tidak ditemukan dalam respons."
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Gagal membuat lelang.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="sell-page">
      <div className="sell-container">
        <div className="sell-heading">
          <p className="sell-eyebrow">UNMODESTY MARKETPLACE</p>
          <h1>Jual Barang</h1>
          <p>
            Tawarkan barangmu kepada komunitas dan biarkan proses lelang dimulai.
          </p>
        </div>

        {success ? (
          <section className="sell-success-panel">
            <div className="sell-success-icon">✓</div>
            <h2>Lelang Berhasil Dikirim!</h2>
            <p>
              Barangmu berhasil diunggah dan sekarang sedang menunggu
              persetujuan admin. Kamu dapat melihat statusnya melalui
              halaman Edit Lelang.
            </p>
            <div className="sell-success-status">
              <span className="auction-status-dot"></span>
              Pending Approval
            </div>
            <div className="sell-success-actions">
              <Link to="/edit" className="sell-submit">
                Lihat Lelang Saya
              </Link>
              <Link to="/auctions" className="sell-cancel">
                Kembali ke Lelang
              </Link>
            </div>
          </section>
        ) : (
          <form className="sell-form" onSubmit={handleSubmit}>
            <div className="sell-form-heading">
              <div>
                <h2>Informasi Barang</h2>
                <p>Lengkapi detail barang yang ingin kamu lelang.</p>
              </div>
              <span className="sell-required">* Wajib diisi</span>
            </div>

            <div className="sell-form-grid">
              <div className="sell-field">
                <label htmlFor="name">Nama Barang <span>*</span></label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Contoh: Kamera Digital Canon"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={255}
                  required
                />
              </div>

              <div className="sell-field">
                <label htmlFor="category">Kategori <span>*</span></label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option>Elektronik</option>
                  <option>Fashion</option>
                  <option>Aksesori</option>
                  <option>Rumah Tangga</option>
                  <option>Hobi</option>
                  <option>Lainnya</option>
                </select>
              </div>

              <div className="sell-field sell-field-full">
                <label htmlFor="description">Deskripsi Barang</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Jelaskan kondisi, spesifikasi, dan detail lainnya..."
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                />
              </div>

              <div className="sell-field">
                <label htmlFor="starting_price">
                  Harga Awal (Rupiah) <span>*</span>
                </label>
                <input
                  id="starting_price"
                  name="starting_price"
                  type="number"
                  placeholder="Contoh: 150000"
                  value={form.starting_price}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  required
                />
                <small>Harga awal penawaran lelang.</small>
              </div>

              <div className="sell-field">
                <label htmlFor="ends_at">Waktu Berakhir <span>*</span></label>
                <input
                  id="ends_at"
                  name="ends_at"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={handleChange}
                  min={new Date(
                    Date.now() - new Date().getTimezoneOffset() * 60000
                  ).toISOString().slice(0, 16)}
                  required
                />
                <small>Tentukan kapan lelang akan ditutup.</small>
              </div>

              <div className="sell-field sell-field-full">
                <div className="sell-image-heading">
                  <label htmlFor="auction-images">Foto Barang</label>
                  <span>{selectedImages.length}/5 gambar</span>
                </div>

                <label
                  htmlFor="auction-images"
                  className={`sell-upload-area ${
                    selectedImages.length >= 5 ? "sell-upload-disabled" : ""
                  }`}
                >
                  <span className="sell-upload-icon">+</span>
                  <strong>Tambah Foto Barang</strong>
                  <span>Pilih gambar dari perangkatmu</span>
                  <small>JPG, PNG, atau WebP · Maksimal 5 MB per gambar</small>
                </label>

                <input
                  id="auction-images"
                  className="sell-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  disabled={selectedImages.length >= 5 || loading}
                />

                {imagePreviews.length > 0 && (
                  <div className="sell-image-grid">
                    {imagePreviews.map((image, index) => (
                      <div
                        className="sell-image-preview"
                        key={`${image.file.name}-${index}`}
                      >
                        <img src={image.url} alt={`Foto barang ${index + 1}`} />
                        <button
                          type="button"
                          className="sell-image-remove"
                          onClick={() => removeImage(index)}
                          disabled={loading}
                          aria-label={`Hapus foto ${index + 1}`}
                        >
                          ×
                        </button>
                        <div className="sell-image-info">
                          <span>{image.file.name}</span>
                          <small>
                            {(image.file.size / (1024 * 1024)).toFixed(2)} MB
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && <div className="sell-error">{error}</div>}

            <div className="sell-form-footer">
              <Link to="/auctions" className="sell-cancel">
                Batal
              </Link>
              <button
                type="submit"
                className="sell-submit"
                disabled={loading}
              >
                {loading ? "Mengunggah dan Membuat Lelang..." : "Pasang Lelang"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default Sell;
