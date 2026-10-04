/**
 * docx-preview ships sourceMappingURL comments but not usable maps (missing src/).
 * CRA's source-map-loader then floods the console. Strip maps + references after install.
 */
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'node_modules', 'docx-preview', 'dist');
if (!fs.existsSync(dist)) process.exit(0);

for (const name of fs.readdirSync(dist)) {
  const file = path.join(dist, name);
  if (name.endsWith('.map')) {
    fs.unlinkSync(file);
    continue;
  }
  if (!/\.(m?js)$/.test(name)) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(/\n?\/\/[#@]\s*sourceMappingURL=.*$/gm, '');
  if (after !== before) fs.writeFileSync(file, after);
}
