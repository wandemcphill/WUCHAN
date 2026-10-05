/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@wuchan/contracts', '@wuchan/validation']
};

module.exports = nextConfig;
