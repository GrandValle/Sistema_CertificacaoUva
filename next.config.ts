import os from 'os';
import type { NextConfig } from 'next';

// 1. O sistema vasculha sua máquina e descobre qual é o seu IP de rede hoje
const interfaces = os.networkInterfaces();
const localIps: string[] = [];

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

// 2. Ele avisa pro Next.js: "Libere o acesso para esse IP dinâmico!"
const nextConfig: NextConfig = {
  allowedDevOrigins: localIps,
  // Se você tiver outras configurações no futuro, elas entram aqui embaixo
};

export default nextConfig;