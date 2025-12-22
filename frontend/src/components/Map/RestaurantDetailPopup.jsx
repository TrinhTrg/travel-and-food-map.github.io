import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { FaClock, FaDirections, FaHeart, FaMapMarkerAlt, FaStar, FaCamera, FaTimes, FaUser } from "react-icons/fa";
import { FiHeart, FiX } from "react-icons/fi";
import styles from "./RestaurantDetailPopup.module.css";
import { useCollection } from "../../context/CollectionContext";
import { useAuth } from "../../context/AuthContext";
import { reviewAPI } from "../../services/api";
import MenuSection from "../MenuSection/MenuSection";

const MAX_RATING = 5;
const MAX_IMAGES = 5;

const noop = () => { };

// Helper function để format thời gian relative
const formatRelativeTime = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) return 'vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffWeeks < 4) return `${diffWeeks} tuần trước`;
  return date.toLocaleDateString('vi-VN');
};

const BACKEND_URL = 'http://localhost:3000';

const RestaurantDetailPopup = ({ restaurant, onClose, onRequestDirections = noop, scrollToReview = false }) => {
  // Helper để lấy full URL cho ảnh
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const [reviewRating, setReviewRating] = useState(4);
  const [reviewText, setReviewText] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [communityReviews, setCommunityReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const reviewSectionRef = useRef(null);
  const popupRef = useRef(null);
  const fileInputRef = useRef(null);

  const { isAuthenticated, user } = useAuth();

  const isOwner = useMemo(() => {
    if (!user || !restaurant) return false;
    const userId = user.id?.toString();
    const ownerId = restaurant.owner_id?.toString();
    return (userId === ownerId && ownerId !== undefined) || (user.role === 'admin');
  }, [user, restaurant]);
  const { isFavorite, toggleFavorite, addRecentSearch } = useCollection();

  // Load reviews khi restaurant thay đổi
  const loadReviews = useCallback(async () => {
    if (!restaurant?.id) return;

    setLoadingReviews(true);
    try {
      const response = await reviewAPI.getReviewsByRestaurant(restaurant.id);
      if (response.success) {
        setCommunityReviews(response.data || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  }, [restaurant?.id]);

  // Load user's existing review
  const loadUserReview = useCallback(async () => {
    if (!restaurant?.id || !isAuthenticated) return;

    try {
      const response = await reviewAPI.getUserReview(restaurant.id);
      if (response.success && response.data) {
        setReviewRating(response.data.rating);
        setReviewText(response.data.content || '');
        // Load existing images if any
        if (response.data.images?.length > 0) {
          setImagePreviewUrls(response.data.images.map(img => img.url));
        }
      }
    } catch (error) {
      console.error('Error loading user review:', error);
    }
  }, [restaurant?.id, isAuthenticated]);

  useEffect(() => {
    loadReviews();
    loadUserReview();
  }, [loadReviews, loadUserReview]);

  // Reset form khi restaurant thay đổi
  useEffect(() => {
    if (!restaurant?.userReview) {
      setReviewRating(4);
      setReviewText("");
      setSelectedImages([]);
      setImagePreviewUrls([]);
    }
  }, [restaurant?.id]);

  // Thêm vào lịch sử tìm kiếm gần đây khi mở popup
  useEffect(() => {
    if (restaurant && isAuthenticated) {
      addRecentSearch(restaurant);
    }
  }, [restaurant?.id, isAuthenticated, addRecentSearch]);

  // Auto-scroll đến phần review khi scrollToReview = true
  useEffect(() => {
    if (scrollToReview && reviewSectionRef.current && popupRef.current) {
      setTimeout(() => {
        const popupContainer = popupRef.current;
        const reviewSection = reviewSectionRef.current;

        if (popupContainer && reviewSection) {
          const reviewSectionTop = reviewSection.offsetTop;
          popupContainer.scrollTo({
            top: reviewSectionTop - 20,
            behavior: 'smooth'
          });

          setTimeout(() => {
            const textarea = reviewSection.querySelector('textarea');
            if (textarea) {
              textarea.focus();
            }
          }, 600);
        }
      }, 500);
    }
  }, [scrollToReview, restaurant]);

  if (!restaurant) return null;

  const categoryLabel = restaurant.category || "Ẩm thực Đà Nẵng";
  const description = restaurant.description || "Thông tin đang được cập nhật.";
  const ratingValue = restaurant.rating || 0;
  const reviewCount = communityReviews.length;

  const statusLabel = restaurant.openStatus ||
    (restaurant.isOpen !== undefined
      ? (restaurant.isOpen ? "Đang mở cửa" : "Đã đóng cửa")
      : "Đang cập nhật");

  const isOpen = restaurant.isOpen !== undefined
    ? restaurant.isOpen
    : (statusLabel.toLowerCase().includes("mở") && !statusLabel.toLowerCase().includes("đóng"));
  const statusClass = isOpen ? styles.statusOpen : styles.statusClosed;

  const bannerImageUrl = restaurant.bannerImage || restaurant.image || restaurant.image_url;

  const renderStars = (value) =>
    Array.from({ length: MAX_RATING }).map((_, index) => (
      <FaStar
        key={index}
        className={`${styles.starIcon} ${index < value ? styles.starActive : ""}`}
      />
    ));

  // Handler chọn ảnh
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);

    // Giới hạn số lượng ảnh
    const remainingSlots = MAX_IMAGES - selectedImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      alert(`Bạn chỉ có thể upload tối đa ${MAX_IMAGES} ảnh`);
      return;
    }

    // Tạo preview URLs
    const newPreviewUrls = filesToAdd.map(file => URL.createObjectURL(file));

    setSelectedImages(prev => [...prev, ...filesToAdd]);
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);

    // Reset input
    event.target.value = '';
  };

  // Xóa ảnh đã chọn
  const handleRemoveImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      // Revoke URL để tránh memory leak
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Handler cho rating (kiểm tra login)
  const handleRatingClick = (starValue) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để đánh giá');
      return;
    }
    setReviewRating(starValue);
  };

  // Handler cho textarea focus (kiểm tra login)
  const handleTextareaFocus = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để viết đánh giá');
    }
  };

  // Submit review
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để lưu đánh giá');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let uploadedImageUrls = [];

      // Upload ảnh nếu có
      if (selectedImages.length > 0) {
        const uploadResponse = await reviewAPI.uploadImages(selectedImages);
        if (uploadResponse.success) {
          uploadedImageUrls = uploadResponse.data;
        }
      }

      // Tạo/cập nhật review
      const reviewData = {
        restaurantId: restaurant.id,
        rating: reviewRating,
        content: reviewText,
        imageUrls: uploadedImageUrls
      };

      const response = await reviewAPI.createOrUpdateReview(reviewData);

      if (response.success) {
        // Reset form
        setReviewText("");
        setSelectedImages([]);
        setImagePreviewUrls([]);

        // Reload reviews để hiển thị review mới
        await loadReviews();

        alert('Đánh giá của bạn đã được lưu!');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmitError(error.message || 'Không thể lưu đánh giá. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler cho nút yêu thích
  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để lưu địa điểm yêu thích');
      return;
    }

    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      await toggleFavorite(restaurant);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const isRestaurantFavorite = restaurant ? isFavorite(restaurant.id) : false;

  return (
    <article ref={popupRef} className={styles.popup}>
      {/* Modal phóng to ảnh */}
      {zoomedImage && (
        <div
          className={styles.imageZoomOverlay}
          onClick={() => setZoomedImage(null)}
        >
          <div className={styles.imageZoomContent}>
            <img src={zoomedImage} alt="Zoomed" />
            <button
              className={styles.closeZoomButton}
              onClick={() => setZoomedImage(null)}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      <button className={styles.closeButton} onClick={onClose} aria-label="Đóng popup">
        <FiX />
      </button>

      {/* Section 1 - Banner */}
      <section className={styles.bannerSection}>
        <div className={styles.banner}>
          {bannerImageUrl ? (
            <img
              src={bannerImageUrl}
              alt={restaurant.name}
              loading="lazy"
            />
          ) : (
            <div className={styles.bannerPlaceholder}></div>
          )}
        </div>
        <div className={styles.bannerContent}>
          <h3>{restaurant.name}</h3>
          <div className={styles.ratingRow}>
            {renderStars(Math.round(ratingValue))}
            <span className={styles.ratingValue}>{ratingValue.toFixed(1)}</span>
            <span className={styles.reviewCount}>({reviewCount} đánh giá)</span>
          </div>
          <span className={styles.category}>{categoryLabel}</span>
        </div>
      </section>

      {/* Section 2 - Actions */}
      <section className={styles.actionsSection}>
        <button className={styles.directionButton} type="button" onClick={onRequestDirections}>
          <FaDirections /> Chỉ đường
        </button>
        <button
          className={`${styles.favoriteButton} ${isRestaurantFavorite ? styles.favoriteButtonActive : ''}`}
          type="button"
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          aria-label={isRestaurantFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
        >
          {isRestaurantFavorite ? <FaHeart /> : <FiHeart />}
          {favoriteLoading ? 'Đang xử lý...' : (isRestaurantFavorite ? 'Đã thích' : 'Yêu thích')}
        </button>
      </section>

      {/* Section 3 - Meta info */}
      <section className={styles.metaSection}>
        <div className={styles.metaItem}>
          <FaMapMarkerAlt />
          <span>{restaurant.address}</span>
        </div>
        <div className={styles.metaItem}>
          <FaClock />
          <span>
            Trạng thái : <span className={statusClass}>{statusLabel}</span>
          </span>
        </div>
        <p className={styles.description}>{description}</p>
      </section>

      {/* Section - Menu */}
      {/* Section - Menu */}
      <MenuSection restaurantId={restaurant.id} isOwner={isOwner} />

      {/* Section 4 - User Review */}
      <section ref={reviewSectionRef} className={styles.userReviewSection}>
        <div className={styles.sectionHeader}>
          <h4>Đánh giá của bạn</h4>
          <span>Hiển thị công khai</span>
        </div>
        <form onSubmit={handleSubmit} className={styles.reviewForm}>
          {/* Rating Stars */}
          <div className={styles.ratingInputRow}>
            {Array.from({ length: MAX_RATING }).map((_, index) => {
              const starValue = index + 1;
              return (
                <button
                  key={starValue}
                  type="button"
                  className={`${styles.starButton} ${starValue <= reviewRating ? styles.starButtonActive : ""}`}
                  onClick={() => handleRatingClick(starValue)}
                  aria-label={`Đánh giá ${starValue} sao`}
                >
                  <FaStar />
                </button>
              );
            })}
          </div>

          {/* Textarea với icon camera */}
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.reviewTextarea}
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              onFocus={handleTextareaFocus}
              placeholder="Chia sẻ cảm nhận của bạn..."
              rows={3}
              disabled={!isAuthenticated}
            />
            <button
              type="button"
              className={styles.cameraButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={!isAuthenticated || selectedImages.length >= MAX_IMAGES}
              aria-label="Thêm ảnh"
            >
              <FaCamera />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Image Previews */}
          {imagePreviewUrls.length > 0 && (
            <div className={styles.imagePreviewGrid}>
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className={styles.imagePreviewItem}>
                  <img src={getImageUrl(url)} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className={styles.removeImageButton}
                    onClick={() => handleRemoveImage(index)}
                    aria-label="Xóa ảnh"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error message */}
          {submitError && (
            <p className={styles.errorMessage}>{submitError}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className={styles.saveButton}
            disabled={isSubmitting || !isAuthenticated}
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu đánh giá'}
          </button>

          {!isAuthenticated && (
            <p className={styles.loginHint}>Vui lòng đăng nhập để đánh giá</p>
          )}
        </form>
      </section>

      {/* Section 5 - Community Reviews */}
      <section className={styles.otherReviewsSection}>
        <div className={styles.sectionHeader}>
          <h4>Review của cộng đồng</h4>
          <span>{reviewCount} lượt</span>
        </div>
        <div className={styles.reviewList}>
          {loadingReviews ? (
            <p className={styles.loadingText}>Đang tải đánh giá...</p>
          ) : communityReviews.length > 0 ? (
            communityReviews.map((review) => (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewUserInfo}>
                    <div className={styles.reviewAvatar}>
                      {review.userAvatar ? (
                        <img src={review.userAvatar} alt={review.userName} />
                      ) : (
                        <FaUser />
                      )}
                    </div>
                    <div className={styles.reviewUserMeta}>
                      <strong>{review.userName}</strong>
                      <span className={styles.reviewTime}>{review.relativeTime}</span>
                    </div>
                  </div>
                  <div className={styles.reviewRating}>{renderStars(review.rating)}</div>
                </div>
                {review.content && (
                  <p className={styles.reviewContent}>{review.content}</p>
                )}
                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className={styles.reviewImagesGrid}>
                    {review.images.map((img, index) => (
                      <div
                        key={img.id || index}
                        className={styles.reviewImageItem}
                        onClick={() => setZoomedImage(getImageUrl(img.url))}
                      >
                        <img
                          src={getImageUrl(img.url)}
                          alt={`Review image ${index + 1}`}
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className={styles.emptyText}>Chưa có đánh giá nào.</p>
          )}
        </div>
      </section>
    </article>
  );
};

export default RestaurantDetailPopup;
