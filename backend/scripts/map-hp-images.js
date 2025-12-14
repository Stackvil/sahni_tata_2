import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, '../../public/images/AG_OIL[1]');

function findImages(dir, category = '') {
  const files = [];
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(item)) {
        const relativePath = fullPath.replace(/\\/g, '/').replace(/.*\/public\//, '/images/');
        files.push({
          name: item,
          path: relativePath,
          category: category || path.basename(dir)
        });
      } else if (stat.isDirectory() && !item.includes('Downloads')) {
        files.push(...findImages(fullPath, item));
      }
    });
  } catch (e) {
    console.error(`Error reading ${dir}:`, e.message);
  }
  return files;
}

const images = findImages(baseDir);
console.log(`Found ${images.length} images`);
console.log(JSON.stringify(images.slice(0, 30), null, 2));

