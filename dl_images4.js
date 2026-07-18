// Find all ./images/X references and download from FlowUs API
const fs = require('fs'), path = require('path'), https = require('https');
const repoDir = 'C:/Users/牢大666/leetcode-repo';

// Step 1: Find all local image references and their source CDN URLs
// We need the original CDN URLs — they're gone from the markdown now.
// Get them from FlowUs API again.

const token = process.env.FLOWUS_TOKEN;

function g(url, retries=10) {
  return new Promise((resolve) => {
    function t(n) {
      const q = https.get(url, {headers: {Authorization: 'Bearer ' + token}, rejectUnauthorized: false}, (res) => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
      });
      q.setTimeout(30000);
      q.on('error', () => { if (n > 0) setTimeout(() => t(n-1), 3000); else resolve(null); });
      q.on('timeout', () => { q.destroy(); if (n > 0) setTimeout(() => t(n-1), 3000); else resolve(null); });
    }
    t(retries);
  });
}

function download(url, dest) {
  return new Promise((resolve) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 500) { resolve(true); return; }
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
      file.on('finish', () => { file.close(); resolve(fs.statSync(dest).size > 500); });
    });
    req.on('error', () => { file.close(); try { fs.unlinkSync(dest); } catch {} resolve(false); });
    req.setTimeout(30000, () => { req.destroy(); file.close(); try { fs.unlinkSync(dest); } catch {} resolve(false); });
    req.end();
  });
}

// Step 1: Parse all the ./images/ references from markdown files
// Group by file and collect image filenames
const fileRefs = {}; // file -> [filename]
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (f === '.git' || f === 'node_modules') continue;
    if (fs.statSync(fp).isDirectory()) { walk(fp); continue; }
    if (!f.endsWith('.md')) continue;
    const content = fs.readFileSync(fp, 'utf-8');
    const re = /!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      if (!fileRefs[fp]) fileRefs[fp] = [];
      fileRefs[fp].push(m[2].split('?')[0]);
    }
  }
}
walk(repoDir);

// Step 2: Get FlowUs content to find original CDN URLs
// Build a map: filename -> CDN url
(async () => {
  console.log('本地图片引用:', Object.values(fileRefs).flat().length);

  // Get all FlowUs page IDs
  const r1 = await g('https://api.flowus.cn/v2/blocks/263ff5a0-a407-40aa-b30f-138100984847/children?page_size=50');
  const allIds = (r1?.results||[]).filter(b=>b.type==='child_page').map(b=>b.id);

  const r2 = await g('https://api.flowus.cn/v2/blocks/cfd7407f-a536-46aa-9928-1066dc5a117b/children?page_size=50');
  for (const b of (r2?.results||[])) if (b.type==='child_page') allIds.push(b.id);

  const algoIds = ['c8224112-dc06-49e8-831b-a198690c0a34','d3d36b60-3b42-4464-a274-71a8fa8e95b3','1af14cf9-ec2d-4dc1-bb94-9b4aa3abde76','52bc252a-11df-495c-b133-ff7e75b676d1','320adb7d-8ede-42d0-8a27-97495161ff93','88b69503-64f5-4a7f-b974-505b9dbb42f1'];
  for (const aid of algoIds) {
    const r = await g('https://api.flowus.cn/v2/blocks/'+aid+'/children?page_size=50');
    for (const b of (r?.results||[])) if (b.type==='child_page') allIds.push(b.id);
  }

  // Get markdown for each page and extract CDN url -> filename mapping
  const cdnMap = {}; // filename -> cdn url
  for (const id of allIds) {
    const md = await g('https://api.flowus.cn/v2/pages/'+id+'/content/markdown');
    if (!md?.markdown) continue;
    const re = /https:\/\/cdn2\.flowus\.cn\/oss\/([^?)]+)/g;
    let m;
    while ((m = re.exec(md.markdown)) !== null) {
      const url = m[0];
      const filename = url.split('/').pop().split('?')[0];
      // Only store first occurrence
      if (!cdnMap[filename]) cdnMap[filename] = url;
    }
  }
  console.log('CDN映射:', Object.keys(cdnMap).length);

  // Step 3: Download images
  const allFilenames = [...new Set(Object.values(fileRefs).flat())];
  let dl = 0, fail = 0;
  const imgDir = path.join(repoDir, 'images');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

  for (const filename of allFilenames) {
    const dest = path.join(imgDir, filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 500) { continue; }

    // Try each filename until one works
    const cdnUrl = cdnMap[filename];
    if (cdnUrl) {
      const ok = await download(cdnUrl, dest);
      if (ok) dl++;
      else { fail++; console.log('FAIL:', filename); }
    } else {
      fail++;
      console.log('NO CDN:', filename);
    }
  }

  console.log(`下载: ${dl}, 失败: ${fail}`);

  // Step 4: Verify
  // Check images exist
  let imgOk = 0, imgMissing = 0;
  for (const filename of allFilenames) {
    if (fs.existsSync(path.join(imgDir, filename)) && fs.statSync(path.join(imgDir, filename)).size > 500) imgOk++;
    else imgMissing++;
  }
  console.log(`本地图片: ${imgOk}, 缺失: ${imgMissing}`);
})();
