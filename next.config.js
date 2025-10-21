/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdfkit을 위한 설정
    config.resolve.alias = {
      ...config.resolve.alias,
      fs: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig;

