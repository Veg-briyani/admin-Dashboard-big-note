import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173, // Default port
    allowedHosts: ["kind-donkeys-wait.loca.lt"] // Allow your LocalTunnel domain
  }
});
