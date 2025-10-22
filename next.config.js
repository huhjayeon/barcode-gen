/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // pdfkit을 위한 설정
    config.resolve.alias = {
      ...config.resolve.alias,
      fs: false,
      path: false,
    };
    
    // resvg 네이티브 바이너리 파일 무시
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    
    // 서버 사이드에서 resvg 외부 모듈로 설정
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@resvg/resvg-js');
    }
    
    return config;
  },
};

module.exports = nextConfig;

