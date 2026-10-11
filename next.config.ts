import type { NextConfig } from "next";
const config: NextConfig = { serverExternalPackages: ["pdf-parse", "pdfjs-dist"], poweredByHeader: false };
export default config;
