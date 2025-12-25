import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './CreateLocationPage.module.css';
import { FaImage, FaUtensils, FaCoffee, FaArrowLeft } from 'react-icons/fa';

const DEFAULT_CENTER = [16.0544, 108.2022];

// Icon cho cafe/drink
const cafeIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/7561/7561235.png",
  iconSize: [40, 40],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

// Icon cho food/restaurant
const foodIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2702/2702446.png",
  iconSize: [40, 40],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

const LocationPicker = ({ value, onChange, iconType }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onChange([lat, lng]);
    },
  });

  const selectedIcon = iconType === 'drink' ? cafeIcon : foodIcon;

  return value ? <Marker position={value} icon={selectedIcon} /> : null;
};


const CreateLocationPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // Lưu URL hoặc base64
  const [imageFileName, setImageFileName] = useState(''); // Lưu tên file để hiển thị
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [position, setPosition] = useState(null);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [iconType, setIconType] = useState('food'); // 'food' or 'drink'
  const [openingHours, setOpeningHours] = useState(''); // String field for opening hours
  const fileInputRef = useRef(null);

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


  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Lưu tên file để hiển thị
      setImageFileName(file.name);
      
      // Convert file to base64 để submit
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };


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

      // Format opening_hours as JSON object with schedule string
      let formattedOpeningHoursData = null;
      if (openingHours && openingHours.trim()) {
        formattedOpeningHoursData = {
          schedule: openingHours.trim()
        };
      }

      // Validate image_url length (nếu là base64 quá dài, có thể cần upload file thay vì)
      let finalImageUrl = imageUrl || null;
      if (finalImageUrl && finalImageUrl.startsWith('data:') && finalImageUrl.length > 100000) {
        console.warn('Warning: Base64 image quá lớn, có thể gây lỗi. Nên upload file thay vì.');
        // Có thể cắt bỏ hoặc từ chối
        // Ở đây tôi sẽ giữ nguyên nhưng cảnh báo
      }

      const payload = {
        name: name.trim(),
        address: address.trim(),
        description: description ? description.trim() : null,
        category_id: Number(categoryId),
        image_url: finalImageUrl,
        latitude: parseFloat(position[0]),
        longitude: parseFloat(position[1]),
        opening_hours: formattedOpeningHoursData,
        phone_number: phoneNumber.trim() || null,
        website: website.trim() || null,
      };

      console.log('Sending payload:', {
        ...payload,
        image_url: payload.image_url ? (payload.image_url.substring(0, 100) + '...') : null
      });

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
        console.error('Error response:', json);
        throw new Error(json.message || json.error || 'Không thể tạo địa điểm');
      }

      setSuccessMessage('Tạo địa điểm thành công! Địa điểm sẽ được duyệt sớm.');
      setName('');
      setAddress('');
      setCategoryId('');
      setImageUrl('');
      setImageFileName('');
      setDescription('');
      setPhoneNumber('');
      setWebsite('');
      setPosition(null);
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
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={styles.backButton}
            aria-label="Quay lại"
          >
            <FaArrowLeft />
            <span>Quay lại</span>
          </button>
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
              <span className={styles.label}>Số điện thoại</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="VD: +84 961 239 797 hoặc 0961239797"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Website</span>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="VD: https://www.example.com"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Mô tả</span>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả về địa điểm, món ăn đặc biệt, không gian..."
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Hình ảnh (URL)</span>
              <div className={styles.imageInputWrapper}>
                <input
                  type="text"
                  value={imageFileName || imageUrl}
                  onChange={(e) => {
                    // Nếu user nhập URL trực tiếp
                    const value = e.target.value;
                    setImageUrl(value);
                    setImageFileName('');
                  }}
                  placeholder={imageFileName ? "" : "https://example.com/image.jpg hoặc chọn file"}
                  className={styles.imageUrlInput}
                  readOnly={!!imageFileName} // Chỉ đọc nếu đã chọn file
                />
                <button
                  type="button"
                  className={styles.imageUploadButton}
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  title="Chọn ảnh từ máy"
                >
                  <FaImage />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
              {imageFileName && (
                <div className={styles.fileNameDisplay}>
                  <span>📎 {imageFileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFileName('');
                      setImageUrl('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className={styles.removeFileButton}
                  >
                    ✕
                  </button>
                </div>
              )}
              {imageUrl && imageUrl.startsWith('data:') && (
                <div className={styles.imagePreview}>
                  <img src={imageUrl} alt="Preview" />
                </div>
              )}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Giờ mở cửa</span>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="VD: 09:00 - 22:00 hoặc Thứ 2 - Chủ nhật: 08:00 - 23:00"
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
          
          {/* Toggle icon type */}
          <div className={styles.iconToggle}>
            <button
              type="button"
              className={`${styles.toggleButton} ${iconType === 'food' ? styles.active : ''}`}
              onClick={() => setIconType('food')}
            >
              <FaUtensils /> <span>Food</span>
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${iconType === 'drink' ? styles.active : ''}`}
              onClick={() => setIconType('drink')}
            >
              <FaCoffee /> <span>Drink</span>
            </button>
          </div>

          <div className={styles.mapWrapper}>
            <MapContainer
              center={position || DEFAULT_CENTER}
              zoom={15}
              scrollWheelZoom={false}
              className={styles.map}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker value={position} onChange={setPosition} iconType={iconType} />
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
