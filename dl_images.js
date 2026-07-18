// Download FlowUs CDN images and replace local references
const fs = require('fs'), path = require('path'), https = require('https'), http = require('http');
const repoDir = 'C:/Users/牢大666/leetcode-repo';

// Collect all image references from markdown files
const allRefs = []; // { file, dir, url, filename }

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) { if (f !== 'images') walk(fp); }
    else if (f.endsWith('.md')) {
      const content = fs.readFileSync(fp, 'utf-8');
      const cdnRe = /!\[([^\]]*)\]\((https:\/\/cdn2\.flowus\.cn\/oss\/[^)]+)\)/g;
      let m;
      while ((m = cdnRe.exec(content)) !== null) {
        const url = m[2].split('?')[0]; // remove token params
        const filename = url.split('/').pop();
        allRefs.push({ file: fp, dir: path.dirname(fp), url: m[2], filename, alt: m[1] });
      }
    }
  }
}

walk(repoDir);
console.log('总图片引用:', allRefs.length);

// Deduplicate by URL (without token)
const seen = new Set();
const uniqueRefs = allRefs.filter(r => {
  const key = r.url.split('?')[0];
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
console.log('去重后:', uniqueRefs.length);

// Download images using proxy
function download(url, dest) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const mod = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      rejectUnauthorized: false
    };

    const req = mod.request(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve);
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const stat = fs.statSync(dest);
        resolve(stat.size > 0);
      });
    });
    req.on('error', () => { file.close(); fs.unlinkSync(dest); resolve(false); });
    req.setTimeout(30000, () => { req.destroy(); file.close(); fs.unlinkSync(dest); resolve(false); });
    req.end();
  });
}

(async () => {
  // Download all unique images
  const imagesDir = path.join(repoDir, 'images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

  let downloaded = 0, failed = 0;
  for (const ref of uniqueRefs) {
    const dest = path.join(imagesDir, ref.filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { continue; }
    const ok = await download(ref.url, dest);
    if (ok) downloaded++;
    else failed++;
  }
  console.log(`下载: ${downloaded}, 失败: ${failed}`);

  // Replace references in files
  let replaced = 0;
  for (const ref of allRefs) {
    const content = fs.readFileSync(ref.file, 'utf-8');
    const localPath = './images/' + ref.filename;
    const newContent = content.replace(ref.url, localPath);
    if (newContent !== content) {
      fs.writeFileSync(ref.file, newContent, 'utf-8');
      replaced++;
    }
  }
  console.log(`替换文件数: ${replaced}`);

  // Git add
  const { execSync } = require('child_process');
  execSync('git add -A', { cwd: repoDir });
  console.log('已 git add');
})();
