const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const IGNORED_ITEMS = ['backups', '.git', '.DS_Store', 'Thumbs.db'];

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      if (IGNORED_ITEMS.includes(childItemName)) return;
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('[Build] Preparing public/ directory for Vercel deployment...');

// Clean existing public directory to remove stale/unnecessary files
if (fs.existsSync(PUBLIC_DIR)) {
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
}
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Items to copy to public
const itemsToCopy = ['index.html', 'favicon.ico', 'css', 'js', 'assets', 'data'];

for (const item of itemsToCopy) {
  const srcPath = path.join(ROOT_DIR, item);
  const destPath = path.join(PUBLIC_DIR, item);

  if (fs.existsSync(srcPath)) {
    console.log(`[Build] Copying ${item} -> public/${item}`);
    copyRecursiveSync(srcPath, destPath);
  } else {
    console.warn(`[Build] Warning: Source path ${srcPath} does not exist.`);
  }
}

console.log('[Build] Successfully generated public/ directory!');
