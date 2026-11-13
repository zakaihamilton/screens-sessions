import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['dictionary-en', 'dictionary-he', 'hunspell-asm'],
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
