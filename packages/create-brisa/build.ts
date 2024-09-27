import fs from 'node:fs';
import path from 'node:path';

if(fs.existsSync('examples')) {
  fs.rmSync('examples', { recursive: true, force: true });
}

fs.mkdirSync('examples');
fs.cpSync(path.join('..', '..', 'examples'), 'examples', { recursive: true });
