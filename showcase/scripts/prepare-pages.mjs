import { writeFile, access } from 'node:fs/promises';
await access(new URL('../out/index.html', import.meta.url));
await writeFile(new URL('../out/.nojekyll', import.meta.url), '');
