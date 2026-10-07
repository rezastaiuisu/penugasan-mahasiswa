import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function createZips() {
  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');
  const publicDir = path.resolve(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Create dist.zip (Production Ready files)
  if (fs.existsSync(distDir)) {
    const zipDist = new JSZip();

    function addFolderToZip(folderPath, zipFolder) {
      const items = fs.readdirSync(folderPath);
      for (const item of items) {
        const fullPath = path.join(folderPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const subZip = zipFolder.folder(item);
          addFolderToZip(fullPath, subZip);
        } else {
          const content = fs.readFileSync(fullPath);
          zipFolder.file(item, content);
        }
      }
    }

    addFolderToZip(distDir, zipDist);
    const distBuffer = await zipDist.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(path.resolve(rootDir, 'dist.zip'), distBuffer);
    fs.writeFileSync(path.join(publicDir, 'dist.zip'), distBuffer);
    console.log(`Created dist.zip (${distBuffer.length} bytes)`);
  }

  // 2. Create source code zip (portal-source-code.zip)
  const zipSource = new JSZip();
  const ignored = ['node_modules', '.git', 'dist', 'dist.zip', 'public'];

  function addSourceFolderToZip(folderPath, zipFolder, relPath = '') {
    const items = fs.readdirSync(folderPath);
    for (const item of items) {
      if (ignored.includes(item)) continue;
      const fullPath = path.join(folderPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const subZip = zipFolder.folder(item);
        addSourceFolderToZip(fullPath, subZip, path.join(relPath, item));
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(item, content);
      }
    }
  }

  addSourceFolderToZip(rootDir, zipSource);
  const sourceBuffer = await zipSource.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(path.resolve(rootDir, 'portal-source-code.zip'), sourceBuffer);
  fs.writeFileSync(path.join(publicDir, 'portal-source-code.zip'), sourceBuffer);
  console.log(`Created portal-source-code.zip (${sourceBuffer.length} bytes)`);
}

createZips().catch(err => {
  console.error(err);
  process.exit(1);
});
