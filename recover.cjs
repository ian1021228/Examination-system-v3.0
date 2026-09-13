const fs = require('fs');
const map = JSON.parse(fs.readFileSync('dist/server.cjs.map', 'utf8'));
const index = map.sources.findIndex(s => s.endsWith('src/features.tsx'));
if (index !== -1) {
    fs.writeFileSync('src/features.tsx.recovered', map.sourcesContent[index]);
    console.log("Recovered features.tsx!");
} else {
    console.log("Not found in sourcemap.");
}
