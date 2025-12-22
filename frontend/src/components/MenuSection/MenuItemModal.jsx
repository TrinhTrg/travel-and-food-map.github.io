import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaUpload, FaTrash, FaPlus, FaSave } from 'react-icons/fa';
import { menuItemAPI } from '../../services/api';
import styles from './MenuItemModal.module.css';

const MenuItemModal = ({ isOpen, onClose, item, restaurantId, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'main_course',
        isPopular: false,
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                price: item.price || '',
                category: item.category || 'main_course',
                isPopular: item.isPopular || false,
                image: null // Sẽ giữ nguyên ảnh cũ nếu không upload mới
            });
            setImagePreview(item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:3000${item.imageUrl}`) : null);
        } else {
            setFormData({
                name: '',
                price: '',
                category: 'main_course',
                isPopular: false,
                image: null
            });
            setImagePreview(null);
        }
        setError('');
    }, [item, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Ảnh không được vượt quá 5MB');
                return;
            }
            setFormData(prev => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim() || !formData.price) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('price', formData.price);
            data.append('category', formData.category);
            data.append('isPopular', formData.isPopular);
            data.append('restaurantId', restaurantId);

            if (formData.image) {
                data.append('image', formData.image);
            }

            let response;
            if (item) {
                // Sửa
                response = await menuItemAPI.updateMenuItem(item.id, data);
            } else {
                // Thêm mới
                response = await menuItemAPI.createMenuItem(data);
            }

            if (response.success) {
                onSuccess(item ? 'update' : 'create');
                onClose();
            }
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa món ăn này?')) return;

        setLoading(true);
        try {
            const response = await menuItemAPI.deleteMenuItem(item.id);
            if (response.success) {
                onSuccess('delete');
                onClose();
            }
        } catch (err) {
            setError(err.message || 'Lỗi khi xóa món ăn');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{item ? 'Chỉnh sửa món ăn' : 'Thêm món mới'}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.errorBanner}>{error}</div>}

                    <div className={styles.imageUploadSection}>
                        <label>Ảnh món ăn *</label>
                        <div
                            className={styles.imagePlaceholder}
                            onClick={() => fileInputRef.current.click()}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" />
                            ) : (
                                <div className={styles.uploadHint}>
                                    <FaUpload />
                                    <span>Chọn ảnh (PNG, JPG, WebP)</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            hidden
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Tên món *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ví dụ: Phở bò đặc biệt"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Giá (VNĐ) *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="Ví dụ: 65000"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Danh mục</label>
                            <select name="category" value={formData.category} onChange={handleChange}>
                                <option value="main_course">Món chính</option>
                                <option value="appetizer">Khai vị</option>
                                <option value="dessert">Tráng miệng</option>
                                <option value="drink">Đồ uống</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>

                        <div className={styles.formGroupCheckbox}>
                            <label>
                                <input
                                    type="checkbox"
                                    name="isPopular"
                                    checked={formData.isPopular}
                                    onChange={handleChange}
                                />
                                Đánh dấu là món nổi bật
                            </label>
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        {item && (
                            <button
                                type="button"
                                className={styles.deleteBtn}
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                <FaTrash /> Xóa món
                            </button>
                        )}
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={styles.saveBtn}
                            disabled={loading}
                        >
                            {loading ? 'Đang lưu...' : (item ? 'Lưu thay đổi' : 'Tạo món')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MenuItemModal;
