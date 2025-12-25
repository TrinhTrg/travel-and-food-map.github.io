const fs = require('fs');
const path = require('path');
const https = require('https');

// Import DATA_SOURCES và getCategoryIdFromFileName từ config
const { 
  DATA_SOURCES, 
  getCategoryIdFromFileName
} = require('./config/geojson-sources');

// 1. Hàm delay để tránh rate limit
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 2. Hàm reverse geocoding sử dụng Nominatim API
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

// 3. Load tất cả GeoJSON files
const loadAllGeoJSONFiles = () => {
  const publicPath = path.join(__dirname, 'public');
  const allFeatures = [];
  
  // Load food files
  DATA_SOURCES.food.forEach(filePath => {
    const fullPath = path.join(publicPath, filePath);
    if (fs.existsSync(fullPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const features = data.features || [];
        features.forEach(feature => {
          feature.properties._sourceFile = filePath;
        });
        allFeatures.push(...features);
        console.log(`✅ Loaded ${features.length} features from ${filePath}`);
      } catch (error) {
        console.error(`❌ Error loading ${filePath}:`, error.message);
      }
    } else {
      console.warn(`⚠️ File not found: ${fullPath}`);
    }
  });
  
  // Load drink files
  DATA_SOURCES.drink.forEach(filePath => {
    const fullPath = path.join(publicPath, filePath);
    if (fs.existsSync(fullPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const features = data.features || [];
        features.forEach(feature => {
          feature.properties._sourceFile = filePath;
        });
        allFeatures.push(...features);
        console.log(`✅ Loaded ${features.length} features from ${filePath}`);
      } catch (error) {
        console.error(`❌ Error loading ${filePath}:`, error.message);
      }
    } else {
      console.warn(`⚠️ File not found: ${fullPath}`);
    }
  });
  
  return allFeatures;
};

// 4. Đọc và xử lý tất cả file GeoJSON
try {
  const allFeatures = loadAllGeoJSONFiles();
  const featuresWithNames = allFeatures.filter(feature => feature.properties.name);

  console.log(`\n🔍 Tìm thấy ${allFeatures.length} địa điểm từ tất cả file GeoJSON.`);
  console.log(`📝 Có ${featuresWithNames.length} địa điểm có tên.`);
  console.log(`⏳ Bắt đầu xử lý địa chỉ từ tọa độ (có thể mất vài phút)...\n`);

  // 5. Chuyển đổi dữ liệu với async processing
  const processFeatures = async () => {
    const seedData = [];
    const addressCache = {}; // Cache để tránh gọi lại cùng tọa độ
    
    const stats = {
      geocodeCount: 0,
      cachedCount: 0
    };
    
    for (let i = 0; i < featuresWithNames.length; i++) {
      const feature = featuresWithNames[i];
      const props = feature.properties;
      const coords = feature.geometry.coordinates; // [longitude, latitude]
      
      // Validate và swap nếu cần (GeoJSON format: [longitude, latitude])
      let lat = coords[1];
      let lng = coords[0];
      
      // Kiểm tra nếu coordinates bị đảo ngược
      // Latitude phải trong khoảng -90 đến 90, Longitude phải trong khoảng -180 đến 180
      // Nếu lat > 90 hoặc lat < -90, có thể bị đảo ngược
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        // Swap nếu bị đảo ngược
        [lat, lng] = [lng, lat];
      }
      
      // Validate lại sau khi swap
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || isNaN(lat) || isNaN(lng)) {
        console.warn(`⚠️ [${i + 1}/${featuresWithNames.length}] "${props.name}" - Coordinates không hợp lệ: lat=${coords[1]}, lng=${coords[0]}, bỏ qua`);
        continue; // Bỏ qua feature này
      }
      
      const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`; // Key cho cache

      // Xử lý địa chỉ - giống file cũ
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
          console.log(`💾 [${i + 1}/${featuresWithNames.length}] "${props.name}" - Dùng địa chỉ từ cache`);
        } else {
          // Nếu không có địa chỉ, dùng reverse geocoding
          console.log(`📍 [${i + 1}/${featuresWithNames.length}] Đang lấy địa chỉ cho "${props.name}"...`);
          address = await reverseGeocode(lat, lng);
          addressCache[coordKey] = address; // Lưu vào cache
          stats.geocodeCount++;
          
          // Delay 1 giây giữa các requests để tránh rate limit
          if (i < featuresWithNames.length - 1) {
            await delay(1000);
          }
        }
      }

      // Xác định Category ID từ tên file - ĐƠN GIẢN
      const categoryId = getCategoryIdFromFileName(props._sourceFile);

      // Xử lý hình ảnh - ưu tiên image_url từ geojson
      let imageUrl = null;
      if (props.image_url) {
        imageUrl = props.image_url;
      } else if (props.image) {
        imageUrl = props.image;
      }

      // Xử lý opening_hours - lấy từ geojson, nếu không có thì null
      // Cột opening_hours trong DB là JSON type, nên cần wrap string trong JSON object
      let openingHours = null;
      if (props.opening_hours) {
        // Wrap string trong JSON object để đảm bảo hợp lệ với cột JSON
        // Frontend có thể lấy ra bằng opening_hours.schedule hoặc opening_hours.text
        openingHours = { schedule: props.opening_hours };
      }

      // Xử lý phone_number - lấy từ geojson (field "phone")
      let phoneNumber = null;
      if (props.phone) {
        phoneNumber = props.phone;
      }

      // Xử lý website - lấy từ geojson
      let website = null;
      if (props.website) {
        website = props.website;
      }

      // Tạo restaurant entry với đầy đủ fields theo migration
      seedData.push({
        name: props.name,
        category_id: categoryId,
        address: address,
        description: `Một địa điểm tuyệt vời tại Đà Nẵng${props.amenity ? ` (${props.amenity})` : ''}`,
        owner_id: null, // GeoJSON không có owner_id
        average_rating: parseFloat((Math.random() * (5.0 - 3.5) + 3.5).toFixed(1)),
        latitude: parseFloat(lat.toFixed(8)),
        longitude: parseFloat(lng.toFixed(8)),
        is_open: true,
        review_count: Math.floor(Math.random() * 100) + 1,
        image_url: imageUrl,
        opening_hours: openingHours, // Lưu dưới dạng string
        phone_number: phoneNumber,
        website: website,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return { seedData, stats };
  };

  // 6. Chạy async processing và xuất file
  processFeatures().then(({ seedData, stats }) => {
    // Xuất ra file kết quả - giống file cũ
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
  console.error("❌ Lỗi: Không thể load các file GeoJSON.");
  console.error(error.message);
  console.error(error.stack);
}
