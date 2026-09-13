with open("vite.config.ts", "r") as f:
    content = f.read()

target = """export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // 使用相對路徑，這樣部署到任何子目錄都能正常載入資源
})"""

new_target = """import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({ 
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,pdf}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.pdf$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdf-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  base: './', // 使用相對路徑，這樣部署到任何子目錄都能正常載入資源
})"""

content = content.replace(target, new_target)

with open("vite.config.ts", "w") as f:
    f.write(content)
