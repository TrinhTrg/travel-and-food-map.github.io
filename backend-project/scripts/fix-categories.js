/**
 * Script để sửa category_id của các nhà hàng bị nhầm lẫn
 * - Quán cafe nên có category_id = 1 (Cafe)
 * - Quán ăn nên có category_id khác (không phải Cafe, Dessert, Chè)
 */

require('dotenv').config();
const db = require('../models');
const Restaurant = db.Restaurant;
const Category = db.Category;
const sequelize = db.sequelize;

// Mapping category names to IDs (theo seed-categories.js)
const CATEGORY_MAP = {
  'Cafe': 1,
  'Fast Food': 2,
  'BBQ': 3,
  'Japanese': 4,
  'Vietnamese': 5,
  'Dessert': 6,
  'Seafood': 7,
  'Italian': 8,
  'Korean': 9,
  'Chinese': 10,
  'Chè': 11,
  'Restaurant': 12
};

// Keywords để nhận diện loại quán
const CAFE_KEYWORDS = ['cafe', 'ca phe', 'cà phê', 'café', 'coffee', 'CaPhe', 'espresso', 'Huế xưa', 'coffe', 'ACE Coworking Space', 'SIX ON SIX', 'Thanh Tam', 'Kafe', 'Phương Nguyên', 'Cafè', 'No Nee', 'Ikigai', 'Slow Breeze', 'Soncha Roastery', 'Bacama','Den long', 'Neko', 'Boulevard', 'Molly', 'Café' ,'kafe'];
const DESSERT_KEYWORDS = ['dessert', 'bánh ngọt', 'kem', 'ice cream'];
const CHE_KEYWORDS = ['chè', 'chè đậu', 'chè thái', 'che'];
// Keywords cụ thể cho Vietnamese food
const VIETNAMESE_FOOD_KEYWORDS = [
  'bánh mì',
  'banh mi',
  'xôi',
  'xoi',
  'hủ tiếu',
  'hu tieu',
  'hủ tiếu',
  'mì quảng',
  'my quang',
  'mi quang',
  'mỳ quảng',
  'noodles',
  'bánh bao',
  'banh bao',
  'phở',
  'pho',
  'bún',
  'bun'
];

// Keywords chung cho restaurant (không phải Vietnamese food cụ thể)
const RESTAURANT_KEYWORDS = [
  'restaurant', 
  'nhà hàng',
  'Nhà hàng', 
  'quán ăn', 
  'quan an',
  'chay',
  'bbq', 
  'grill',
  'Dimsum',
];

/**
 * Xác định các categories dựa vào tên và mô tả (trả về mảng)
 */
function determineCategories(name, description) {
  const nameLower = (name || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  const combined = `${nameLower} ${descLower}`;
  const categories = [];
  let isRestaurant = false;

  // ƯU TIÊN CAO NHẤT: Kiểm tra Chè TRƯỚC (vì chè là drink, không phải restaurant)
  if (CHE_KEYWORDS.some(keyword => combined.includes(keyword))) {
    categories.push(CATEGORY_MAP['Chè']);
    // Chè có thể kết hợp với Cafe, nhưng không phải restaurant
    // Không set isRestaurant = true
    // Return sớm nếu chỉ có Chè để tránh bị gán nhầm restaurant keywords
    if (categories.length === 1 && categories[0] === CATEGORY_MAP['Chè']) {
      return categories;
    }
  }

  // ƯU TIÊN: Kiểm tra Seafood keywords TRƯỚC restaurant keywords chung
  const seafoodKeywords = ['seafood', 'hải sản', 'Hải sản', 'hai san'];
  if (seafoodKeywords.some(keyword => {
    const keywordLower = keyword.toLowerCase();
    return combined.includes(keywordLower);
  })) {
    categories.push(CATEGORY_MAP['Seafood']);
    isRestaurant = true;
    // Nếu đã có Seafood, không cần kiểm tra restaurant keywords chung nữa
    // Return sớm nếu chỉ có Seafood
    if (categories.length === 1 && categories[0] === CATEGORY_MAP['Seafood']) {
      return categories;
    }
  }

  // ƯU TIÊN CAO NHẤT: Kiểm tra restaurant keywords TRƯỚC cafe keywords
  // Loại bỏ các keywords đã kiểm tra ở trên (bbq, grill, Dimsum)
  const restaurantKeywordsToCheck = RESTAURANT_KEYWORDS.filter(
    keyword => !['bbq', 'grill', 'Dimsum'].includes(keyword)
  );
  
  // Kiểm tra restaurant keywords TRƯỚC cafe keywords (ưu tiên cao)
  // Sử dụng word boundary hoặc exact match để tránh false positive
  const hasRestaurantKeyword = restaurantKeywordsToCheck.some(keyword => {
    const keywordLower = keyword.toLowerCase().trim();
    // Kiểm tra trong cả name và description
    return nameLower.includes(keywordLower) || descLower.includes(keywordLower);
  });
  
  if (hasRestaurantKeyword) {
    isRestaurant = true;
    // Tất cả keywords restaurant chung → Vietnamese (ID: 5)
    // Thêm Vietnamese category ngay lập tức và KHÔNG cho phép cafe
    if (!categories.includes(CATEGORY_MAP['Vietnamese'])) {
      categories.push(CATEGORY_MAP['Vietnamese']);
    }
  }

  // Ưu tiên kiểm tra description có chứa (restaurant) TRƯỚC (cafe)
  if (descLower.includes('(restaurant)')) {
    isRestaurant = true;
    // Nếu chưa có Vietnamese category, thêm vào
    if (!categories.includes(CATEGORY_MAP['Vietnamese'])) {
      categories.push(CATEGORY_MAP['Vietnamese']);
    }
  }
  
  // Kiểm tra (cafe) - CHỈ nếu chưa phải restaurant
  if (descLower.includes('(cafe)') && !isRestaurant) {
    if (!categories.includes(CATEGORY_MAP['Cafe'])) {
      categories.push(CATEGORY_MAP['Cafe']);
    }
    // Nếu chỉ có cafe và không có restaurant keywords, trả về ngay
    if (!hasRestaurantKeyword) {
      return categories.length > 0 ? categories : [CATEGORY_MAP['Cafe']];
    }
  }

  // Kiểm tra các loại nhà hàng cụ thể TRƯỚC (ưu tiên cao hơn)
  // Sử dụng keywords từ RESTAURANT_KEYWORDS
  const bbqKeywords = ['bbq', 'grill', 'nướng', 'nuong'];
  if (bbqKeywords.some(keyword => {
    const keywordLower = keyword.toLowerCase();
    return combined.includes(keywordLower);
  })) {
    categories.push(CATEGORY_MAP['BBQ']);
    isRestaurant = true;
  }

  const japaneseKeywords = ['japanese', 'sushi', 'ramen'];
  if (japaneseKeywords.some(keyword => combined.includes(keyword))) {
    categories.push(CATEGORY_MAP['Japanese']);
    isRestaurant = true;
  }

  const koreanKeywords = ['korean', 'kimchi'];
  if (koreanKeywords.some(keyword => combined.includes(keyword))) {
    categories.push(CATEGORY_MAP['Korean']);
    isRestaurant = true;
  }

  // Sử dụng 'Dimsum' từ RESTAURANT_KEYWORDS
  const chineseKeywords = ['chinese', 'dimsum', 'dim sum'];
  if (chineseKeywords.some(keyword => combined.includes(keyword))) {
    categories.push(CATEGORY_MAP['Chinese']);
    isRestaurant = true;
  }

  const italianKeywords = ['italian', 'pizza', 'pasta'];
  if (italianKeywords.some(keyword => combined.includes(keyword))) {
    categories.push(CATEGORY_MAP['Italian']);
    isRestaurant = true;
  }

  // Seafood keywords đã được kiểm tra ở trên (dòng 85-95)
  // Không cần kiểm tra lại ở đây

  // Kiểm tra Vietnamese food keywords TRƯỚC (ưu tiên cao)
  if (VIETNAMESE_FOOD_KEYWORDS.some(keyword => {
    const keywordLower = keyword.toLowerCase();
    return combined.includes(keywordLower);
  })) {
    if (!categories.includes(CATEGORY_MAP['Vietnamese'])) {
      categories.push(CATEGORY_MAP['Vietnamese']);
    }
    isRestaurant = true;
  }

  // Restaurant keywords đã được kiểm tra ở trên (dòng 88-100)
  // Nếu đã có Vietnamese category, không cần kiểm tra lại
  // Nếu chưa có Vietnamese category nhưng có restaurant keywords, thêm vào
  if (hasRestaurantKeyword && !categories.includes(CATEGORY_MAP['Vietnamese'])) {
    // Chỉ thêm Vietnamese nếu chưa có category cụ thể nào khác
    const hasSpecificCategory = categories.some(catId => 
      [CATEGORY_MAP['BBQ'], CATEGORY_MAP['Japanese'], CATEGORY_MAP['Korean'], 
       CATEGORY_MAP['Chinese'], CATEGORY_MAP['Italian'], CATEGORY_MAP['Seafood'],
       CATEGORY_MAP['Chè']].includes(catId)
    );
    
    if (!hasSpecificCategory) {
      categories.push(CATEGORY_MAP['Vietnamese']);
    }
  }

  // Kiểm tra Cafe - CHỈ nếu KHÔNG phải restaurant VÀ chưa có Vietnamese category
  // QUAN TRỌNG: Nếu đã có Vietnamese category (từ restaurant keywords), KHÔNG được thêm Cafe
  const hasVietnameseCategory = categories.includes(CATEGORY_MAP['Vietnamese']);
  
  // Nếu đã có Vietnamese category từ restaurant keywords, bỏ qua hoàn toàn việc kiểm tra cafe
  if (hasVietnameseCategory && isRestaurant) {
    // Đã có Vietnamese category từ restaurant keywords, không cần kiểm tra cafe nữa
    // Return ngay nếu chỉ có Vietnamese category
    if (categories.length === 1 && categories[0] === CATEGORY_MAP['Vietnamese']) {
      return categories;
    }
  } else if (!isRestaurant) {
    // Chỉ kiểm tra cafe nếu KHÔNG phải restaurant VÀ chưa có Restaurant category
    // Kiểm tra tên có chứa từ khóa cafe cụ thể (sử dụng tất cả keywords)
    const cafeInName = CAFE_KEYWORDS.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      // Match nếu keyword xuất hiện trong tên (case-insensitive)
      return nameLower.includes(keywordLower);
    });
    
    // Hoặc description có (cafe) hoặc rõ ràng là cafe
    const cafeInDesc = descLower.includes('(cafe)') || 
                       descLower.includes('quán cà phê') ||
                       descLower.includes('coffee shop') ||
                       // Kiểm tra các keywords cafe trong description
                       CAFE_KEYWORDS.some(keyword => {
                         const keywordLower = keyword.toLowerCase();
                         return descLower.includes(keywordLower);
                       });
    
    if (cafeInName || cafeInDesc) {
      if (!categories.includes(CATEGORY_MAP['Cafe'])) {
        categories.push(CATEGORY_MAP['Cafe']);
      }
    }
  }

  // Chè đã được kiểm tra ở đầu, không cần kiểm tra lại

  // Kiểm tra Dessert (không phải restaurant)
  // Sử dụng TẤT CẢ keywords từ DESSERT_KEYWORDS
  if (!isRestaurant) {
    if (DESSERT_KEYWORDS.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return combined.includes(keywordLower);
    })) {
      if (!categories.includes(CATEGORY_MAP['Dessert'])) {
        categories.push(CATEGORY_MAP['Dessert']);
      }
    }
  }

  // Nếu không xác định được gì cả (tên lạ), mặc định là Vietnamese
  // NHƯNG nếu đã có isRestaurant = true, thêm Restaurant thay vì Vietnamese
  if (categories.length === 0) {
    if (isRestaurant) {
      // Nếu đã set isRestaurant nhưng chưa có category, thêm Restaurant
      categories.push(CATEGORY_MAP['Restaurant']);
    } else {
      categories.push(CATEGORY_MAP['Vietnamese']);
    }
  }

  return categories;
}

/**
 * Main function để fix categories
 */
async function fixCategories() {
  try {
    console.log('🔍 Đang kết nối database...');
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công!\n');

    // Lấy tất cả categories để verify
    const categories = await Category.findAll();
    console.log('📋 Danh sách categories:');
    categories.forEach(cat => {
      console.log(`  - ID ${cat.id}: ${cat.name}`);
    });
    console.log('');

    // Kiểm tra xem category "Restaurant" (ID: 12) đã tồn tại chưa
    const restaurantCategory = categories.find(cat => cat.id === 12 || cat.name === 'Restaurant');
    if (!restaurantCategory) {
      console.warn('⚠️  CẢNH BÁO: Category "Restaurant" (ID: 12) chưa tồn tại trong database!');
      console.warn('⚠️  Vui lòng chạy migration để thêm category này:');
      console.warn('⚠️  npx sequelize-cli db:migrate\n');
      console.warn('⚠️  Script sẽ bỏ qua các restaurant cần category "Restaurant" cho đến khi category này được thêm vào.\n');
    }

    // Lấy tất cả restaurants với categories hiện tại
    const restaurants = await Restaurant.findAll({
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });

    console.log(`📊 Tìm thấy ${restaurants.length} nhà hàng\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    const fixes = [];

    for (const restaurant of restaurants) {
      const currentCategoryId = restaurant.category_id;
      const currentCategoryName = restaurant.category?.name || 'Unknown';
      const currentCategories = restaurant.categories || [];
      const currentCategoryIds = currentCategories.map(cat => cat.id);
      
      const suggestedCategoryIds = determineCategories(restaurant.name, restaurant.description);

      // So sánh mảng categories (không quan tâm thứ tự)
      const currentSet = new Set(currentCategoryIds.sort());
      const suggestedSet = new Set(suggestedCategoryIds.sort());
      const isEqual = currentSet.size === suggestedSet.size && 
                      [...currentSet].every(id => suggestedSet.has(id));

      // Nếu categories đã đúng, bỏ qua
      if (isEqual && currentCategoryId === suggestedCategoryIds[0]) {
        skippedCount++;
        continue;
      }

      // Lấy tên các categories mới
      const newCategoryNames = suggestedCategoryIds
        .map(id => {
          const cat = categories.find(c => c.id === id);
          return cat ? cat.name : 'Unknown';
        })
        .join(', ');

      // Lọc các category IDs hợp lệ (chỉ những category tồn tại trong database)
      const validCategoryIds = suggestedCategoryIds.filter(id => 
        categories.some(cat => cat.id === id)
      );

      if (validCategoryIds.length === 0) {
        console.warn(`⚠️  Restaurant ${restaurant.id} (${restaurant.name}): Không có category nào hợp lệ trong database. Suggested: [${suggestedCategoryIds.join(', ')}]`);
        skippedCount++;
        continue;
      }

      // Xóa tất cả categories cũ trong bảng trung gian
      await restaurant.setCategories([]);

      // Thêm các categories mới (chỉ những category tồn tại trong database)
      const newCategories = categories.filter(cat => validCategoryIds.includes(cat.id));
      await restaurant.setCategories(newCategories);

      // Cập nhật category_id chính (để backward compatibility)
      // Sử dụng category đầu tiên trong danh sách hợp lệ
      const primaryCategoryId = validCategoryIds[0];
      await restaurant.update({ category_id: primaryCategoryId });

      fixes.push({
        id: restaurant.id,
        name: restaurant.name,
        oldCategory: currentCategoryIds.length > 0 
          ? currentCategoryIds.map(id => {
              const cat = categories.find(c => c.id === id);
              return `${id} (${cat?.name || 'Unknown'})`;
            }).join(', ')
          : `${currentCategoryId} (${currentCategoryName})`,
        newCategory: suggestedCategoryIds.map(id => {
          const cat = categories.find(c => c.id === id);
          return `${id} (${cat?.name || 'Unknown'})`;
        }).join(', ')
      });

      fixedCount++;
    }

    // Hiển thị kết quả
    console.log('📝 Kết quả:');
    console.log(`  ✅ Đã sửa: ${fixedCount} nhà hàng`);
    console.log(`  ⏭️  Bỏ qua: ${skippedCount} nhà hàng\n`);

    if (fixes.length > 0) {
      console.log('🔧 Chi tiết các thay đổi:');
      fixes.forEach((fix, index) => {
        console.log(`\n${index + 1}. ${fix.name} (ID: ${fix.id})`);
        console.log(`   Từ: ${fix.oldCategory}`);
        console.log(`   →  ${fix.newCategory}`);
      });
    }

    console.log('\n✅ Hoàn thành!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Chạy script
fixCategories();

