import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const categories = [
  "Elektronik",
  "Fashion",
  "Aksesori",
  "Rumah Tangga",
  "Hobi",
  "Lainnya",
];

function toLocalDateTime(value) {
  const date = new Date(value);
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

function Edit() {
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "Elektronik",
    description: "",
    starting_price: "",
    ends_at: "",
  });

  const [existingImages, setExistingImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("unmodesty_token");

  const isReadOnly = Boolean(
    selectedAuction?.selected_bid_id ||
    selectedAuction?.status === "completed"
  );

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

  const fetchAuctions = async () => {
    const response = await fetch(`${API_URL}/auctions/mine`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    setAuctions(data);
  };

  useEffect(() => {
    const loadAuctions = async () => {
      try {
        await fetchAuctions();
      } catch (err) {
        setError(err.message || "Gagal memuat daftar lelang.");
      } finally {
        setLoading(false);
      }
    };

    loadAuctions();
  }, []);

  const selectAuction = (auction) => {
    setSelectedAuction(auction);

    setForm({
      name: auction.name || "",
      category: auction.category || "Elektronik",
      description: auction.description || "",
      starting_price: auction.starting_price || "",
      ends_at: toLocalDateTime(auction.ends_at),
    });

    setExistingImages(auction.images || []);
    setRemovedImageIds([]);
    setSelectedImages([]);
    setError("");
    setMessage("");
  };

  const closeEditor = () => {
    setSelectedAuction(null);
    setExistingImages([]);
    setRemovedImageIds([]);
    setSelectedImages([]);
    setError("");
    setMessage("");
  };

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);

    event.target.value = "";

    if (existingImages.length + selectedImages.length + files.length > 5) {
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

  const removeExistingImage = (image) => {
    setExistingImages((previous) =>
      previous.filter((item) => item.id !== image.id)
    );

    setRemovedImageIds((previous) => [...previous, image.id]);
  };

  const removeNewImage = (index) => {
    setSelectedImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (isReadOnly) {
      setError("Lelang yang telah memiliki pemenang tidak dapat diedit.");
      return;
    }

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
    formData.append("_method", "PATCH");

    removedImageIds.forEach((id) => {
      formData.append("remove_image_ids[]", id);
    });

    selectedImages.forEach((file) => {
      formData.append("images[]", file);
    });

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/auctions/${selectedAuction.id}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const validationErrors = data.errors
          ? Object.values(data.errors).flat().join(" ")
          : null;

        throw new Error(
          validationErrors || data.message || `HTTP ${response.status}`
        );
      }

      await fetchAuctions();

      const updatedAuction = data.auction;

      setSelectedAuction(updatedAuction);
      setExistingImages(updatedAuction.images || []);
      setRemovedImageIds([]);
      setSelectedImages([]);

      setForm({
        name: updatedAuction.name || "",
        category: updatedAuction.category || "Elektronik",
        description: updatedAuction.description || "",
        starting_price: updatedAuction.starting_price || "",
        ends_at: toLocalDateTime(updatedAuction.ends_at),
      });

      setMessage("Perubahan lelang berhasil disimpan.");
    } catch (err) {
      setError(err.message || "Gagal memperbarui lelang.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (auction) => {
    if (auction.bids_count > 0) {
      setError("Lelang yang sudah memiliki penawaran tidak dapat dihapus.");
      return;
    }

    setError("");
    setMessage("");
    setDeleteTarget(auction);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const auction = deleteTarget;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auctions/${auction.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      setAuctions((previous) =>
        previous.filter((item) => item.id !== auction.id)
      );

      if (selectedAuction?.id === auction.id) {
        closeEditor();
      }

      setDeleteTarget(null);
      setMessage("Lelang berhasil dihapus.");
    } catch (err) {
      setError(err.message || "Gagal menghapus lelang.");
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="sell-page">
        <div className="sell-container">
          <p className="detail-state">Memuat daftar lelang...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="sell-page">
      <div className="sell-container">
        <div className="sell-heading">
          <p className="sell-eyebrow">UNMODESTY MARKETPLACE</p>
          <h1>Edit Lelang</h1>
          <p>
            Kelola barang yang telah kamu tawarkan dan perbarui informasi
            lelangmu.
          </p>
        </div>

        {error && <div className="sell-error">{error}</div>}
        {message && <div className="edit-success">{message}</div>}

        {!selectedAuction ? (
          <section className="edit-auction-list">
            <div className="sell-form-heading">
              <div>
                <h2>Lelang Saya</h2>
                <p>Pilih lelang untuk melihat detail atau mengubah informasinya.</p>
              </div>
              <span className="sell-required">
                {auctions.length} lelang
              </span>
            </div>

            {auctions.length === 0 ? (
              <div className="edit-empty">
                <p>Kamu belum memiliki lelang.</p>
                <Link to="/sell" className="sell-submit">
                  Pasang Lelang
                </Link>
              </div>
            ) : (
              <div className="edit-auction-grid">
                {auctions.map((auction) => {
                  const completed = Boolean(
                    auction.selected_bid_id || auction.status === "completed"
                  );

                  return (
                    <article className="edit-auction-card" key={auction.id}>
                      <div className="edit-auction-image">
                        {auction.images?.[0]?.image_url ? (
                          <img
                            src={auction.images[0].image_url}
                            alt={auction.name}
                          />
                        ) : (
                          <span>Tidak ada foto</span>
                        )}
                      </div>

                      <div className="edit-auction-details">
                        <span className="edit-auction-category">
                          {auction.category}
                        </span>

                        <h3>{auction.name}</h3>

                        <p>
                          Rp{" "}
                          {Number(auction.current_price).toLocaleString("id-ID")}
                        </p>

                        <div className="edit-auction-meta">
                          <span>{auction.bids_count || 0} penawaran</span>
                          <span>
                            {new Date(auction.ends_at).toLocaleDateString("id-ID")}
                          </span>
                        </div>

                        {completed ? (
                          <p className="edit-auction-warning">
                            Pemenang telah dipilih. Detail hanya dapat dilihat.
                          </p>
                        ) : auction.bids_count > 0 ? (
                          <p className="edit-auction-warning">
                            Lelang memiliki penawaran dan masih dapat diedit.
                          </p>
                        ) : null}

                        <div className="edit-auction-actions">
                          <button
                            type="button"
                            className="sell-submit"
                            onClick={() => selectAuction(auction)}
                            disabled={saving}
                          >
                            {completed ? "Lihat Detail" : "Edit / Detail"}
                          </button>

                          <button
                            type="button"
                            className="edit-delete-button"
                            onClick={() => handleDelete(auction)}
                            disabled={saving || auction.bids_count > 0}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <>
            <button
              type="button"
              className="edit-back-button"
              onClick={closeEditor}
              disabled={saving}
            >
              ← Kembali ke Lelang Saya
            </button>

            {isReadOnly && (
              <div className="edit-success">
                Lelang ini telah memiliki pemenang. Informasi hanya dapat dilihat.
              </div>
            )}

            {isReadOnly && selectedAuction.selected_bid?.user && (
              <div className="bid-winner-box">
                <strong>Pemenang Lelang</strong>
                <span>{selectedAuction.selected_bid.user.name}</span>
                <strong>
                  Rp{" "}
                  {Number(selectedAuction.selected_bid.amount).toLocaleString("id-ID")}
                </strong>
              </div>
            )}

            <form className="sell-form" onSubmit={handleSubmit}>
              <div className="sell-form-heading">
                <div>
                  <h2>
                    {isReadOnly ? "Detail Barang" : "Informasi Barang"}
                  </h2>
                  <p>
                    {isReadOnly
                      ? "Informasi lelang yang telah selesai."
                      : "Perbarui detail barang yang sedang kamu lelang."}
                  </p>
                </div>
                <span className="sell-required">ID: #{selectedAuction.id}</span>
              </div>

              <div className="sell-form-grid">
                <div className="sell-field">
                  <label htmlFor="name">Nama Barang <span>*</span></label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={255}
                    required
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="sell-field sell-field-full">
                  <label htmlFor="description">Deskripsi Barang</label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    disabled={isReadOnly}
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
                    value={form.starting_price}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    required
                    disabled={isReadOnly}
                  />
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
                    disabled={isReadOnly}
                  />
                </div>

                <div className="sell-field sell-field-full">
                  <div className="sell-image-heading">
                    <label>Foto Barang</label>
                    {!isReadOnly && (
                      <span>
                        {existingImages.length + selectedImages.length}/5 gambar
                      </span>
                    )}
                  </div>

                  {!isReadOnly && (
                    <div className="sell-upload-area">
                      <label
                        htmlFor="edit-auction-images"
                        className={
                          existingImages.length + selectedImages.length >= 5
                            ? "sell-upload-disabled"
                            : ""
                        }
                      >
                        <span className="sell-upload-icon">+</span>
                        <strong>Tambah Foto Barang</strong>
                        <span>Pilih gambar dari perangkatmu</span>
                        <small>
                          JPG, PNG, atau WebP · Maksimal 5 MB per gambar
                        </small>
                      </label>
                    </div>
                  )}

                  {!isReadOnly && (
                    <input
                      id="edit-auction-images"
                      className="sell-file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleImageChange}
                      disabled={
                        existingImages.length + selectedImages.length >= 5 ||
                        saving
                      }
                    />
                  )}

                  {(existingImages.length > 0 || imagePreviews.length > 0) && (
                    <div className="sell-image-grid">
                      {existingImages.map((image, index) => (
                        <div className="sell-image-preview" key={image.id}>
                          <img
                            src={image.image_url}
                            alt={`Foto barang ${index + 1}`}
                          />
                          {!isReadOnly && (
                            <button
                              type="button"
                              className="sell-image-remove"
                              onClick={() => removeExistingImage(image)}
                              disabled={saving}
                              aria-label={`Hapus foto ${index + 1}`}
                            >
                              ×
                            </button>
                          )}
                          <div className="sell-image-info">
                            <span>Foto tersimpan {index + 1}</span>
                            <small>Foto lama</small>
                          </div>
                        </div>
                      ))}

                      {imagePreviews.map((image, index) => (
                        <div
                          className="sell-image-preview"
                          key={`${image.file.name}-${index}`}
                        >
                          <img
                            src={image.url}
                            alt={`Foto baru ${index + 1}`}
                          />
                          <button
                            type="button"
                            className="sell-image-remove"
                            onClick={() => removeNewImage(index)}
                            disabled={saving}
                            aria-label={`Hapus foto baru ${index + 1}`}
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

              {!isReadOnly && (
                <div className="sell-form-footer">
                  <button
                    type="submit"
                    className="sell-submit"
                    disabled={saving}
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              )}
            </form>
          </>
        )}
      </div>

      {deleteTarget && (
        <div
          className="edit-modal-overlay"
          onClick={() => !saving && setDeleteTarget(null)}
        >
          <div
            className="edit-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="edit-modal-icon">!</div>
            <h2 id="delete-modal-title">Hapus Lelang?</h2>
            <p>
              Apakah kamu yakin ingin menghapus lelang{" "}
              <strong>{deleteTarget.name}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </p>

            <div className="edit-modal-actions">
              <button
                type="button"
                className="sell-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
              >
                Batal
              </button>

              <button
                type="button"
                className="edit-modal-delete"
                onClick={confirmDelete}
                disabled={saving}
              >
                {saving ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Edit;
