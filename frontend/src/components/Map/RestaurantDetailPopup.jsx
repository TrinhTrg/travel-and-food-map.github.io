import React, { useEffect, useMemo, useState } from "react";
import { FaClock, FaDirections, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { FiHeart, FiX } from "react-icons/fi";
import styles from "./RestaurantDetailPopup.module.css";

const MAX_RATING = 5;

const noop = () => {};

const RestaurantDetailPopup = ({ restaurant, onClose, onRequestDirections = noop }) => {
  const [reviewRating, setReviewRating] = useState(4);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (restaurant?.userReview) {
      setReviewRating(restaurant.userReview.rating);
      setReviewText(restaurant.userReview.comment);
    } else {
      setReviewRating(4);
      setReviewText("");
    }
  }, [restaurant]);

  const reviews = useMemo(() => restaurant?.reviewsList || [], [restaurant]);

  if (!restaurant) return null;

  const categoryLabel = restaurant.category || "Ẩm thực Đà Nẵng";
  const description = restaurant.description || "Thông tin đang được cập nhật.";
  const ratingValue = restaurant.rating || 0;
  const reviewCount = restaurant.reviews ?? reviews.length;
  const statusLabel = restaurant.status || "Đang cập nhật";
  const isOpenLabel = restaurant.isOpen ? "Đang mở cửa" : "Đã đóng";
  
  // Kiểm tra ảnh từ các field có thể có
  const bannerImageUrl = restaurant.bannerImage || restaurant.image || restaurant.image_url;
  
  // Log khi không có ảnh
  useEffect(() => {
    if (!bannerImageUrl) {
      console.log("không có ảnh", restaurant.name || restaurant.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderStars = (value) =>
    Array.from({ length: MAX_RATING }).map((_, index) => (
      <FaStar
        key={index}
        className={`${styles.starIcon} ${index < value ? styles.starActive : ""}`}
      />
    ));

  const handleSubmit = (event) => {
    event.preventDefault();
    // Placeholder: kết nối API hoặc state quản lý review trong tương lai
    console.log("Saved review", {
      restaurantId: restaurant.id,
      rating: reviewRating,
      comment: reviewText,
    });
  };

  return (
    <article className={styles.popup}>
      <button className={styles.closeButton} onClick={onClose} aria-label="Đóng popup">
        <FiX />
      </button>

      {/* Section 1 */}
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

      {/* Section 2 */}
      <section className={styles.actionsSection}>
        <button className={styles.directionButton} type="button" onClick={onRequestDirections}>
          <FaDirections /> Chỉ đường
        </button>
        <button className={styles.favoriteButton}>
          <FiHeart /> Tim
        </button>
      </section>

      {/* Section 3 */}
      <section className={styles.metaSection}>
        <div className={styles.metaItem}>
          <FaMapMarkerAlt />
          <span>{restaurant.address}</span>
        </div>
        <div className={styles.metaItem}>
          <FaClock />
          <span>
            {isOpenLabel} · {statusLabel}
          </span>
        </div>
        <p className={styles.description}>{description}</p>
      </section>

      {/* Section 4 */}
      <section className={styles.userReviewSection}>
        <div className={styles.sectionHeader}>
          <h4>Đánh giá của bạn</h4>
          <span>Hiển thị riêng tư</span>
        </div>
        <form onSubmit={handleSubmit} className={styles.reviewForm}>
          <div className={styles.ratingInputRow}>
            {Array.from({ length: MAX_RATING }).map((_, index) => {
              const starValue = index + 1;
              return (
                <button
                  key={starValue}
                  type="button"
                  className={`${styles.starButton} ${
                    starValue <= reviewRating ? styles.starButtonActive : ""
                  }`}
                  onClick={() => setReviewRating(starValue)}
                  aria-label={`Đánh giá ${starValue} sao`}
                >
                  <FaStar />
                </button>
              );
            })}
          </div>
          <textarea
            className={styles.reviewTextarea}
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn..."
            rows={3}
          />
          <button type="submit" className={styles.saveButton}>
            Lưu đánh giá
          </button>
        </form>
      </section>

      {/* Section 5 */}
      <section className={styles.otherReviewsSection}>
        <div className={styles.sectionHeader}>
          <h4>Review của cộng đồng</h4>
          <span>{reviews.length} lượt</span>
        </div>
        <div className={styles.reviewList}>
          {reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <strong>{review.name}</strong>
                <div className={styles.reviewRating}>{renderStars(review.rating)}</div>
              </div>
              <p>{review.comment}</p>
            </div>
          ))}
          {!reviews.length && <p className={styles.emptyText}>Chưa có đánh giá nào.</p>}
        </div>
      </section>
    </article>
  );
};

export default RestaurantDetailPopup;

