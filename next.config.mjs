import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";
import createNextIntlPlugin from 'next-intl/plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** Collect all local network IPs so the dev server accepts cross-origin
 *  requests from LAN, Tailscale, or any non-localhost address. */
function getLocalIPs() {
  const ips = [];
  const interfaces = networkInterfaces();
  for (const addrs of Object.values(interfaces)) {
    for (const addr of addrs) {
      if (!addr.internal) ips.push(addr.address);
    }
  }
  return ips;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev", ...getLocalIPs()],
};

export default withNextIntl(nextConfig);
