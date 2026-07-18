// Download images per-directory, replacing CDN URLs with local paths
const fs = require('fs'), path = require('path'), https = require('https');
const repoDir = 'C:/Users/牢大666/leetcode-repo';

// Collect all image references grouped by directory
const dirRefs = {}; // dir -> [{ url, filename, file }]
let total = 0;

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
      // Disambiguate duplicate filenames: prefix with parent dir name
      const parentDir = path.basename(path.dirname(fp));
      const uniqueName = (parentDir !== 'leetcode-repo' ? parentDir + '-' : '') + filename;

      if (!dirRefs[path.dirname(fp)]) dirRefs[path.dirname(fp)] = [];
      dirRefs[path.dirname(fp)].push({ url: m[2], filename, uniqueName, fullMatch: m[2] });
      total++;
    }
  }
}

walk(repoDir);
console.log('总引用:', total);

function download(url, dest) {
  return new Promise((resolve) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { resolve(true); return; }
    const file = fs.createWriteStream(dest);
    const p = new URL(url);
    const mod = p.protocol === 'https:' ? https : https;
    const opts = {
      hostname: p.hostname, path: p.pathname + p.search,
      method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' }, rejectUnauthorized: false
    };
    const req = mod.request(opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(fs.statSync(dest).size > 0); });
    });
    req.on('error', () => { file.close(); try { fs.unlinkSync(dest); } catch {} resolve(false); });
    req.setTimeout(20000, () => { req.destroy(); file.close(); try { fs.unlinkSync(dest); } catch {} resolve(false); });
    req.end();
  });
}

(async () => {
  let downloaded = 0, failed = 0;
  const replaceMap = {}; // file -> [{ oldText, newText }]

  for (const [dir, refs] of Object.entries(dirRefs)) {
    const imgDir = path.join(dir, 'images');
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

    for (const ref of refs) {
      const dest = path.join(imgDir, ref.uniqueName);
      const ok = await download(ref.url, dest);
      if (ok) downloaded++;
      else failed++;

      if (!replaceMap[ref.file]) replaceMap[ref.file] = [];
      // Only store the unique duplicates if there are multiple image.png in same dir
      const localPath = (dir === repoDir) ? './images/' + ref.uniqueName : './images/' + ref.uniqueName;
      replaceMap[dir].push({ oldUrl: ref.fullMatch, localPath });
    }
  }

  // Actually replace in files
  let replacedFiles = 0;
  for (const [dir, replacements] of Object.entries(replaceMap)) {
    for (const r of replacements) {
      // Read all .md files in this dir
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.md')) continue;
        const fp = path.join(dir, f);
        let content = fs.readFileSync(fp, 'utf-8');
        if (content.includes(r.oldUrl)) {
          content = content.replace(r.oldUrl, r.localPath);
          fs.writeFileSync(fp, content, 'utf-8');
          replacedFiles++;
        }
      }
    }
  }

  // Special: files in root that already had ./images/ - those point to root/images/ which we kept
  // Fix algorithm subdir files: they used ./images/ but need to point to their own images dir
  // Since we already write to ./images/xxx in each dir, the relative path from within that dir works!

  console.log(`下载: ${downloaded}, 失败: ${failed}, 修改文件: ${replacedFiles}`);

  // Check remaining CDN refs
  let remaining = 0;
  walk(repoDir);
  function check(d) {
    if (!fs.existsSync(d)) return;
    for (const f of fs.readdirSync(d)) {
      const fp = path.join(d, f);
      if (f === '.git' || f === 'node_modules') continue;
      if (fs.statSync(fp).isDirectory()) { check(fp); continue; }
      if (f.endsWith('.md') && fs.readFileSync(fp,'utf-8').includes('cdn2.flowus.cn')) remaining++;
    }
  }
  check(repoDir);
  console.log('剩余CDN引用:', remaining);
  if (remaining === 0) console.log('全部修复!');
})();
