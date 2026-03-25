const fs = require('fs');
const path = require('path');

let httpsOptions = {};

if (process.env.NODE_ENV === 'development') {
  try {
    httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'localhost-cert.pem')),
    };
  } catch (err) {
    console.warn("Local HTTPS files not found, skipping...");
  }
}

// Export your Next.js config
const nextConfig = {
  reactStrictMode: true,
  // You can add other Next.js settings here
};

module.exports = nextConfig;