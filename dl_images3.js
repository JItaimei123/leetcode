// Download all images to repo root images/, fix all references
const fs = require('fs'), path = require('path'), https = require('https');
const repoDir = 'C:/Users/牢大666/leetcode-repo';

// Step 1: collect all image references from all markdown files
const refs = []; // { file: fullpath, url, filename }
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (f === '.git' || f === 'node_modules') continue;
    if (fs.statSync(fp).isDirectory()) { walk(fp); continue; }
    if (!f.endsWith('.md')) continue;
    const content = fs.readFileSync(fp, 'utf-8');
    const re = /!\[([^\]]*)\]\((https:\/\/cdn2\.flowus\.cn\/oss\/[^)]+)\)/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const url = m[2].split('?')[0];
      const filename = url.split('/').pop();
      refs.push({ file: fp, url: m[2], filename, alt: m[1] });
    }
  }
}
walk(repoDir);
console.log('图片引用:', refs.length);

// Step 2: clean old images dirs
for (const d of ['images', '算法精炼/二分查找/images', '算法精炼/位运算/images', '算法精炼/前缀和/images']) {
  const dp = path.join(repoDir, d);
  if (fs.existsSync(dp)) fs.rmSync(dp, { recursive: true, force: true });
}
// Also delete images in any subdir that has them
function cleanImages(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (f === '.git' || f === 'node_modules') continue;
    if (fs.statSync(fp).isDirectory()) {
      if (f === 'images') fs.rmSync(fp, { recursive: true, force: true });
      else cleanImages(fp);
    }
  }
}
cleanImages(repoDir);

// Step 3: create root images dir
const imgDir = path.join(repoDir, 'images');
fs.mkdirSync(imgDir, { recursive: true });

// Step 4: download images (deduplicated)
const seenUrls = new Set();
function download(url, dest) {
  return new Promise((resolve) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { resolve(true); return; }
    const file = fs.createWriteStream(dest);
    const p = new URL(url);
    const opts = {
      hostname: p.hostname, path: p.pathname + p.search,
      method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' }, rejectUnauthorized: false
    };
    const req = https.request(opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); try { fs.unlinkSync(dest); } catch {}
        download(res.headers.location, dest).then(resolve); return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(fs.statSync(dest).size > 0); });
    });
    req.on('error', () => { file.close(); try { fs.unlinkSync(dest); } catch {} resolve(false); });
    req.setTimeout(30000, () => { req.destroy(); file.close(); try { fs.unlinkSync(dest); } catch {} resolve(false); });
    req.end();
  });
}

(async () => {
  let dl = 0, fail = 0;
  for (const ref of refs) {
    const key = ref.url.split('?')[0];
    if (seenUrls.has(key)) continue;
    seenUrls.add(key);
    const dest = path.join(imgDir, ref.filename);
    const ok = await download(ref.url, dest);
    if (ok) dl++; else fail++;
  }
  console.log(`下载: ${dl}, 失败: ${fail}`);

  // Step 5: replace references in files
  let replaced = 0;
  for (const ref of refs) {
    const content = fs.readFileSync(ref.file, 'utf-8');
    // Calculate relative path from file to root images/
    const rel = path.relative(path.dirname(ref.file), imgDir).replace(/\\/g, '/');
    const localPath = rel + '/' + ref.filename;
    const newContent = content.replace(ref.url, localPath);
    if (newContent !== content) {
      fs.writeFileSync(ref.file, newContent, 'utf-8');
      replaced++;
    }
  }
  console.log(`替换引用: ${replaced} 处`);

  // Step 6: verify
  let remain = 0;
  function check(d) {
    if (!fs.existsSync(d)) return;
    for (const f of fs.readdirSync(d)) {
      const fp = path.join(d, f);
      if (f === '.git' || f === 'node_modules') continue;
      if (fs.statSync(fp).isDirectory()) { check(fp); continue; }
      if (f.endsWith('.md') && fs.readFileSync(fp, 'utf-8').includes('cdn2.flowus.cn')) remain++;
    }
  }
  check(repoDir);
  console.log('剩余CDN引用:', remain);
  if (remain === 0) console.log('✅ 全部修复!');
})();
