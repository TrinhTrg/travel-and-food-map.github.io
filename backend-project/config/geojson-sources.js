'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Cấu hình nguồn dữ liệu GeoJSON
 * Map từ category name hoặc file name đến category ID trong database
 */
const CATEGORY_MAPPING = {
  // Food categories (dùng foodIcon trong MapView)
  'restaurant': 10,    // Restaurant
  'fastfood': 2,       // Fast Food
  'bbq': 3,            // BBQ (Barbecue)
  'seafood': 6,        // Seafood
  'asian_vietnam': 4,  // Vietnamese
  'ice-cream': 7,      // Ice Cream
  // Drink categories (dùng cafeIcon trong MapView)
  'coffee': 1,         // Coffee
  'bar': 8,            // Bar
  'dessert': 5,        // Dessert
  'chè': 9,            // Chè
};

/**
 * Định nghĩa các nguồn dữ liệu GeoJSON
 */
const DATA_SOURCES = {
  food: [
    '/geojson/food/restaurant.geojson',
    '/geojson/food/fastfood.geojson',
    '/geojson/food/bbq.geojson',
    '/geojson/food/seafood.geojson',
    '/geojson/food/asian_vietnam.geojson',
    '/geojson/food/ice-cream.geojson',
  ],
  drink: [
    '/geojson/drink/coffee.geojson',
    '/geojson/drink/bar.geojson',
    '/geojson/drink/dessert.geojson',
    '/geojson/drink/chè.geojson',
  ]
};

/**
 * Lấy category ID từ tên file hoặc category name
 */
const getCategoryIdFromFileName = (fileName) => {
  // Extract base name without extension
  const baseName = path.basename(fileName, '.geojson');
  
  // Try direct mapping
  if (CATEGORY_MAPPING[baseName]) {
    return CATEGORY_MAPPING[baseName];
  }
  
  const normalized = baseName.toLowerCase().replace(/-/g, '_');
  if (CATEGORY_MAPPING[normalized]) {
    return CATEGORY_MAPPING[normalized];
  }
  // 10 danh mục
  return 10;
};

/**
 * Lấy category IDs từ cuisine hoặc amenity
 */
const getCategoryIdsFromProperties = (properties) => {
  const categoryIds = new Set();
  
  // Check cuisine
  if (properties.cuisine) {
    const cuisine = properties.cuisine.toLowerCase();
    
    if (cuisine.includes('vietnamese') || cuisine.includes('vietnam') || cuisine.includes('asian')) {
      categoryIds.add(4); // Vietnamese
    }
    if (cuisine.includes('ice_cream')) {
      categoryIds.add(7); // Ice Cream
    }
    if (cuisine.includes('seafood')) {
      categoryIds.add(6); // Seafood
    }
    if (cuisine.includes('bbq') || cuisine.includes('barbecue')) {
      categoryIds.add(3); // BBQ
    }
    if (cuisine.includes('burger') || cuisine.includes('fast_food') || cuisine.includes('fastfood')) {
      categoryIds.add(2); // Fast Food
    }
    if (cuisine.includes('dessert')) {
      categoryIds.add(5); // Dessert
    }
    if (cuisine.includes('chè')) {
      categoryIds.add(11); // Chè
    }
  }
  
  // Check amenity
  if (properties.amenity) {
    const amenity = properties.amenity.toLowerCase();
    
    if (amenity === 'restaurant') {
      categoryIds.add(12); // Restaurant
    }
    if (amenity === 'cafe' || amenity === 'coffee_shop') {
      categoryIds.add(1); // Coffee & cafe
    }
    if (amenity === 'fast_food') {
      categoryIds.add(2); // Fast Food
    }
    if (amenity === 'pub' || amenity === 'bar') {
      categoryIds.add(9); // Bar
    }
  }
  
  // If no categories found, default to Restaurant
  if (categoryIds.size === 0) {
    categoryIds.add(12); // Restaurant
  }
  
  return Array.from(categoryIds);
};

/**
 * Load tất cả GeoJSON files từ các nguồn
 */
const loadAllGeoJSONFiles = () => {
  const publicPath = path.join(__dirname, '..', 'public');
  const allFeatures = [];
  const fileStats = {};
  
  // Load food files
  DATA_SOURCES.food.forEach(filePath => {
    const fullPath = path.join(publicPath, filePath);
    if (fs.existsSync(fullPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const features = data.features || [];
        features.forEach(feature => {
          feature.properties._sourceFile = filePath;
          feature.properties._sourceType = 'food';
        });
        allFeatures.push(...features);
        fileStats[filePath] = features.length;
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error.message);
        fileStats[filePath] = 0;
      }
    } else {
      console.warn(`File not found: ${fullPath}`);
      fileStats[filePath] = 0;
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
          feature.properties._sourceType = 'drink';
        });
        allFeatures.push(...features);
        fileStats[filePath] = features.length;
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error.message);
        fileStats[filePath] = 0;
      }
    } else {
      console.warn(`File not found: ${fullPath}`);
      fileStats[filePath] = 0;
    }
  });
  
  return {
    features: allFeatures,
    stats: fileStats,
    total: allFeatures.length
  };
};

module.exports = {
  DATA_SOURCES,
  CATEGORY_MAPPING,
  getCategoryIdFromFileName,
  getCategoryIdsFromProperties,
  loadAllGeoJSONFiles
};

