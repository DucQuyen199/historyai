// Script để kiểm tra route đã đăng ký
const app = require('./app');

console.log('Checking all registered routes:');
console.log('------------------------------');

// Lấy tất cả các routes từ Express app
function getAllRoutes(app) {
  const routes = [];
  
  function processStack(stack, basePath = '') {
    stack.forEach(layer => {
      if (layer.route) {
        // Routes registered directly on the app
        const path = basePath + layer.route.path;
        const methods = Object.keys(layer.route.methods)
          .filter(method => layer.route.methods[method])
          .map(method => method.toUpperCase());
          
        routes.push({ path, methods });
      } else if (layer.name === 'router' && layer.handle.stack) {
        // Router middleware
        let routerPath = basePath;
        if (layer.regexp && layer.regexp.source !== '^\\/?$') {
          // Extract path from regexp
          const match = layer.regexp.toString().match(/\\\/([^\\\/\^]*)/);
          if (match) {
            routerPath = basePath + '/' + match[1];
          }
        }
        processStack(layer.handle.stack, routerPath);
      }
    });
  }
  
  processStack(app._router.stack);
  return routes;
}

const routes = getAllRoutes(app);

// In ra tất cả route đã đăng ký
if (routes.length === 0) {
  console.log('No routes registered!');
} else {
  routes.forEach(route => {
    console.log(`[${route.methods.join(', ')}] ${route.path}`);
  });
}

console.log('\nChecking specific routes:');
console.log('------------------------');

// Kiểm tra route cụ thể
const checkRoute = (method, path) => {
  const found = routes.find(r => 
    r.path === path && r.methods.includes(method)
  );
  
  console.log(`${method} ${path}: ${found ? '✅ REGISTERED' : '❌ NOT FOUND'}`);
};

// Kiểm tra các route cần thiết
checkRoute('POST', '/api/auth/register');
checkRoute('POST', '/api/auth/login');
checkRoute('GET', '/api/auth/me');
checkRoute('GET', '/api/debug/db-test'); 