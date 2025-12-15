const fs = require('fs');
const https = require('https');

// 1. CẤU HÌNH ID DANH MỤC
const CAT_RESTAURANT_ID = 1;
const CAT_CAFE_ID = 2;

// 2. Hàm delay để tránh rate limit
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 3. Hàm reverse geocoding sử dụng Nominatim API
const reverseGeocode = async (lat, lng) => {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'FoodGo-DataConverter/1.0' // Nominatim yêu cầu User-Agent
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result && result.address) {
            const addr = result.address;
            // Tạo địa chỉ từ các thành phần
            const parts = [];
            
            // Số nhà và tên đường
            if (addr.house_number) parts.push(addr.house_number);
            if (addr.road) parts.push(addr.road);
            else if (addr.street) parts.push(addr.street);
            
            // Phường/Xã
            if (addr.suburb) parts.push(addr.suburb);
            else if (addr.neighbourhood) parts.push(addr.neighbourhood);
            
            // Quận/Huyện
            if (addr.city_district) parts.push(addr.city_district);
            else if (addr.district) parts.push(addr.district);
            
            // Thành phố
            if (addr.city) parts.push(addr.city);
            else if (addr.town) parts.push(addr.town);
            
            // Tỉnh/Thành phố
            if (addr.state) parts.push(addr.state);
            
            // Quốc gia
            if (addr.country) parts.push(addr.country);
            
            const address = parts.length > 0 
              ? parts.join(', ') 
              : `Đà Nẵng, Việt Nam`;
            
            resolve(address);
          } else {
            resolve(`Đà Nẵng, Việt Nam`); // Fallback
          }
        } catch (error) {
          console.error(`❌ Lỗi parse JSON cho ${lat}, ${lng}:`, error.message);
          resolve(`Đà Nẵng, Việt Nam`); // Fallback
        }
      });
    }).on('error', (error) => {
      console.error(`❌ Lỗi reverse geocode cho ${lat}, ${lng}:`, error.message);
      resolve(`Đà Nẵng, Việt Nam`); // Fallback
    });
  });
};

// 4. Đọc file GeoJSON
try {
  const rawData = fs.readFileSync('export.geojson');
  const geoJson = JSON.parse(rawData);

  console.log(`🔍 Tìm thấy ${geoJson.features.length} địa điểm từ file GeoJSON.`);
  console.log(`⏳ Bắt đầu xử lý địa chỉ từ tọa độ (có thể mất vài phút)...\n`);

  // 5. Chuyển đổi dữ liệu với async processing
  const processFeatures = async () => {
    const features = geoJson.features.filter(feature => feature.properties.name);
    const seedData = [];
    const addressCache = {}; // Cache để tránh gọi lại cùng tọa độ
    
    const stats = {
      geocodeCount: 0,
      cachedCount: 0
    };
    
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const props = feature.properties;
      const coords = feature.geometry.coordinates; // [longitude, latitude]
      const lat = coords[1];
      const lng = coords[0];
      const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`; // Key cho cache

      // Xử lý địa chỉ
      let address = null;
      
      // Ưu tiên địa chỉ từ OSM properties
      if (props['addr:street']) {
        const houseNumber = props['addr:housenumber'] || '';
        const street = props['addr:street'];
        address = houseNumber ? `${houseNumber} ${street}, Đà Nẵng` : `${street}, Đà Nẵng`;
      } else if (props['addr:full']) {
        address = props['addr:full'];
      } else {
        // Kiểm tra cache trước
        if (addressCache[coordKey]) {
          address = addressCache[coordKey];
          stats.cachedCount++;
          console.log(`💾 [${i + 1}/${features.length}] "${props.name}" - Dùng địa chỉ từ cache`);
        } else {
          // Nếu không có địa chỉ, dùng reverse geocoding
          console.log(`📍 [${i + 1}/${features.length}] Đang lấy địa chỉ cho "${props.name}"...`);
          address = await reverseGeocode(lat, lng);
          addressCache[coordKey] = address; // Lưu vào cache
          stats.geocodeCount++;
          
          // Delay 1 giây giữa các requests để tránh rate limit
          if (i < features.length - 1) {
            await delay(1000);
          }
        }
      }

      // Xác định Category ID
      let categoryId = CAT_RESTAURANT_ID;
      if (props.amenity === 'cafe' || props.amenity === 'coffee_shop') {
        categoryId = CAT_CAFE_ID;
      }

      // --- XỬ LÝ HÌNH ẢNH (Theo yêu cầu của bạn) ---
      let imageUrl = null; // Mặc định là null
      
      // Kiểm tra nếu OSM có ảnh (thường là không có, nhưng cứ check cho chắc)
      if (props.image) {
        imageUrl = props.image;
      }

      // Log ra console nếu không có ảnh
      if (!imageUrl) {
        console.log(`⚠️ [${props.name}]: Chưa có hình ảnh nào`);
      }
      // ---------------------------------------------

      seedData.push({
        name: props.name,
        category_id: categoryId,
        address: address,
        description: `Một địa điểm tuyệt vời tại Đà Nẵng (${props.amenity})`,
        latitude: coords[1],
        longitude: coords[0],
        average_rating: (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1),
        review_count: Math.floor(Math.random() * 100) + 1,
        is_open: true,
        status: 'approved',
        image_url: imageUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return { seedData, stats };
  };

  // 6. Chạy async processing và xuất file
  processFeatures().then(({ seedData, stats }) => {
    // Xuất ra file kết quả
    const outputContent = `
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const restaurantsData = ${JSON.stringify(seedData, null, 2)};
    
    // Convert ISO string dates to Date objects
    const restaurantsWithDates = restaurantsData.map(restaurant => ({
      ...restaurant,
      createdAt: new Date(restaurant.createdAt),
      updatedAt: new Date(restaurant.updatedAt)
    }));

    await queryInterface.bulkInsert('restaurants', restaurantsWithDates, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('restaurants', null, {});
  }
};
`;

    // Ghi đè vào file seed
    fs.writeFileSync('seeders/20250101000002-seed-restaurants-osm.js', outputContent);

    console.log(`\n✅ Đã tạo thành công file seed: seeders/20250101000002-seed-restaurants-osm.js`);
    console.log(`🎉 Tổng cộng: ${seedData.length} nhà hàng/cafe đã sẵn sàng nạp vào DB!`);
    console.log(`\n📊 Thống kê:`);
    console.log(`   - Đã gọi API reverse geocoding: ${stats.geocodeCount} lần`);
    console.log(`   - Đã dùng cache: ${stats.cachedCount} lần`);
    console.log(`\n💡 Lưu ý: Nếu có nhiều địa điểm không có địa chỉ, quá trình này có thể mất vài phút do rate limit của Nominatim API (1 request/giây).`);
  }).catch((error) => {
    console.error("❌ Lỗi khi xử lý dữ liệu:", error.message);
    console.error(error.stack);
  });

} catch (error) {
  console.error("❌ Lỗi: Không tìm thấy file export.geojson hoặc file bị lỗi json.");
  console.error(error.message);
}