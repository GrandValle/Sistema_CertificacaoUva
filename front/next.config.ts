import os from 'os';
import type { NextConfig } from 'next';

const interfaces = os.networkInterfaces();
const localIps: string[] = ['localhost', '127.0.0.1'];

for (const name of Object.keys(interfaces)) {
  const rede = interfaces[name];
  if (rede) {
    for (const iface of rede) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIps.push(iface.address);
      }
    }
  }
}

const uniqueIps = [...new Set(localIps)];

console.log('🔧 Next.js allowedDevOrigins:', uniqueIps);

const nextConfig: NextConfig = {
  allowedDevOrigins: uniqueIps,
  // outras configurações
};

export default nextConfig;