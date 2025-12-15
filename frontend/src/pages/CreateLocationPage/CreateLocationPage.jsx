import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './CreateLocationPage.module.css';

const DEFAULT_CENTER = [16.0544, 108.2022];

const markerIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const LocationPicker = ({ value, onChange }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onChange([lat, lng]);
    },
  });

  return value ? <Marker position={value} icon={markerIcon} /> : null;
};

const CreateLocationPage = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [position, setPosition] = useState(null);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  useEffect(() => {
    // Lấy categories để map với dropdown
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      } catch (err) {
        console.error('Không thể lấy danh sách categories', err);
      }
    };

    // Lấy vị trí hiện tại cho map picker
    const getUserLocation = () => {
      if (!navigator.geolocation) {
        setPosition(DEFAULT_CENTER);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          setPosition(DEFAULT_CENTER);
        }
      );
    };

    fetchCategories();
    getUserLocation();
  }, [API_BASE_URL]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!name || !address || !categoryId || !position) {
      setErrorMessage('Vui lòng nhập đầy đủ thông tin bắt buộc và chọn vị trí trên bản đồ.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name,
        address,
        description: openingHours,
        category_id: Number(categoryId),
        image_url: imageUrl || null,
        latitude: position[0],
        longitude: position[1],
      };

      // Lấy token giống AuthContext (localStorage key: 'token')
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_BASE_URL}/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Không thể tạo địa điểm');
      }

      setSuccessMessage('Tạo địa điểm thành công! Địa điểm sẽ được duyệt sớm.');
      setName('');
      setAddress('');
      setCategoryId('');
      setImageUrl('');
      setOpeningHours('');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Đã xảy ra lỗi khi tạo địa điểm.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.formColumn}>
          <h1 className={styles.title}>Thêm địa điểm mới</h1>
          <p className={styles.subtitle}>
            Chia sẻ những địa điểm ăn uống yêu thích của bạn với cộng đồng FoodGo.
          </p>

          {successMessage && (
            <div className={styles.alertSuccess}>{successMessage}</div>
          )}
          {errorMessage && (
            <div className={styles.alertError}>{errorMessage}</div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.field}>
              <span className={styles.label}>Tên địa điểm (bắt buộc)</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Phở Bò 24 - Nguyễn Văn Linh"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Danh mục (bắt buộc)</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Địa chỉ (bắt buộc)</span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: 123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Hình ảnh (URL)</span>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Giờ mở cửa / mô tả ngắn</span>
              <textarea
                rows={3}
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="VD: Mở cửa 7:00 - 22:00, chuyên phở bò truyền thống."
              />
            </label>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? 'Đang gửi...' : 'Gửi địa điểm'}
            </button>
          </form>
        </div>

        <div className={styles.mapColumn}>
          <h2 className={styles.mapTitle}>Chọn vị trí trên bản đồ</h2>
          <p className={styles.mapHint}>
            Nhấn vào bản đồ để đặt pin tại vị trí chính xác của địa điểm.
          </p>
          <div className={styles.mapWrapper}>
            <MapContainer
              center={position || DEFAULT_CENTER}
              zoom={15}
              scrollWheelZoom={false}
              className={styles.map}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker value={position} onChange={setPosition} />
            </MapContainer>
          </div>
          {position && (
            <p className={styles.coords}>
              Lat: {position[0].toFixed(6)} · Lng: {position[1].toFixed(6)}
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateLocationPage;