/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // cPanel shared hosting has a low process/thread limit during builds.
    cpus: 1,
    memoryBasedWorkersCount: false,
    staticGenerationMaxConcurrency: 1,
    webpackMemoryOptimizations: true,
  },
};

module.exports = nextConfig;
