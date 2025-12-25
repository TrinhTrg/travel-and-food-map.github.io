import React, { useMemo } from 'react';
import { FaClock } from 'react-icons/fa';
import styles from './OpeningHours.module.css';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Thứ Hai', short: 'T2' },
  { value: 'tuesday', label: 'Thứ Ba', short: 'T3' },
  { value: 'wednesday', label: 'Thứ Tư', short: 'T4' },
  { value: 'thursday', label: 'Thứ Năm', short: 'T5' },
  { value: 'friday', label: 'Thứ Sáu', short: 'T6' },
  { value: 'saturday', label: 'Thứ Bảy', short: 'T7' },
  { value: 'sunday', label: 'Chủ Nhật', short: 'CN' },
];

const OpeningHours = ({ openingHours, isOpen }) => {
  // Parse opening_hours từ string format (từ geojson) hoặc object format
  const parsedOpeningHours = useMemo(() => {
    if (!openingHours) return null;
    
    // Nếu là string (từ geojson hoặc database), hiển thị trực tiếp
    if (typeof openingHours === 'string') {
      return openingHours;
    }
    
    // Nếu là object với key "schedule" (từ database seed), extract schedule
    if (typeof openingHours === 'object' && openingHours.schedule) {
      return openingHours.schedule;
    }
    
    // Nếu là object (từ form với cấu trúc đầy đủ), trả về object
    if (typeof openingHours === 'object') {
      return openingHours;
    }
    
    return null;
  }, [openingHours]);

  // Tính toán trạng thái hiện tại
  const currentStatus = useMemo(() => {
    if (isOpen !== undefined) {
      return isOpen ? 'Đang mở cửa' : 'Đang đóng cửa';
    }

    if (!parsedOpeningHours) {
      return 'Đang cập nhật';
    }

    // Nếu là string, không thể tính toán chính xác, dùng isOpen hoặc hiển thị string
    if (typeof parsedOpeningHours === 'string') {
      return 'Đang cập nhật';
    }

    // Nếu là object, tính toán như cũ
    const now = new Date();
    const currentDay = now.getDay();
    const dayMap = [6, 0, 1, 2, 3, 4, 5];
    const dayIndex = dayMap[currentDay];
    const currentDayKey = DAYS_OF_WEEK[dayIndex]?.value;

    if (!currentDayKey || !parsedOpeningHours[currentDayKey]) {
      return 'Đang cập nhật';
    }

    const dayHours = parsedOpeningHours[currentDayKey];
    if (!dayHours.isOpen) {
      return 'Đang đóng cửa';
    }

    const [openHour, openMin] = dayHours.openTime.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.closeTime.split(':').map(Number);
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    if (currentTime >= openTime && currentTime <= closeTime) {
      return 'Đang mở cửa';
    }

    return 'Đang đóng cửa';
  }, [parsedOpeningHours, isOpen]);

  const isCurrentlyOpen = currentStatus === 'Đang mở cửa';
  const statusClass = isCurrentlyOpen ? styles.statusOpen : styles.statusClosed;

  // Format giờ hiển thị
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  // Lấy ngày hiện tại để highlight
  const getCurrentDayKey = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const dayMap = [6, 0, 1, 2, 3, 4, 5];
    const dayIndex = dayMap[currentDay];
    return DAYS_OF_WEEK[dayIndex]?.value;
  };

  const currentDayKey = getCurrentDayKey();

  return (
    <div className={styles.openingHoursContainer}>
      {/* Header với trạng thái */}
      <div className={styles.header}>
        <div className={styles.statusRow}>
          <FaClock className={styles.clockIcon} />
          <span className={`${styles.statusText} ${statusClass}`}>
            {currentStatus}
          </span>
        </div>
      </div>

      {/* Danh sách giờ mở cửa */}
      {typeof parsedOpeningHours === 'string' ? (
        // Hiển thị string format từ geojson
        <div className={styles.hoursList}>
          <div className={styles.hourRow}>
            <div className={styles.dayLabel}>Giờ mở cửa</div>
            <div className={styles.timeRange}>{parsedOpeningHours}</div>
          </div>
        </div>
      ) : (
        // Hiển thị object format từ form
        <div className={styles.hoursList}>
          {DAYS_OF_WEEK.map((day) => {
            const dayHours = parsedOpeningHours?.[day.value];
            const isOpenToday = dayHours?.isOpen;
            const isCurrentDay = day.value === currentDayKey;
            
            return (
              <div
                key={day.value}
                className={`${styles.hourRow} ${isCurrentDay ? styles.currentDay : ''}`}
              >
                <div className={styles.dayLabel}>{day.label}</div>
                {isOpenToday ? (
                  <div className={styles.timeRange}>
                    {formatTime(dayHours.openTime)} - {formatTime(dayHours.closeTime)}
                  </div>
                ) : (
                  <div className={styles.closedLabel}>Đóng cửa</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer - Đề xuất giờ khác */}
      <div className={styles.footer}>
        <button className={styles.suggestButton} type="button">
          Đề xuất giờ khác
        </button>
      </div>
    </div>
  );
};

export default OpeningHours;

