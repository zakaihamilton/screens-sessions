/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['dictionary-en', 'dictionary-he', 'hunspell-asm'],
};

export default nextConfig;
