import re

with open("vite.config.ts", "r") as f:
    content = f.read()

content = content.replace("workbox: {", "workbox: { maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,")

with open("vite.config.ts", "w") as f:
    f.write(content)
