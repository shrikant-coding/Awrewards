/** @type {import('next').NextConfig} */
const fs = require('fs');

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    },
  },
};
module.exports = nextConfig;