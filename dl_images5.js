// Download all images with proper Referer header
const fs = require('fs'), path = require('path'), https = require('https');
const repoDir = 'C:/Users/牢大666/leetcode-repo';

// Get all CDN URLs from FlowUs API
const token = process.env.FLOWUS_TOKEN;
function g(url, retries=10){return new Promise((resolve)=>{function t(n){const q=https.get(url,{headers:{Authorization:'Bearer '+token},rejectUnauthorized:false},(res)=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d))}catch{resolve(d)}})});q.setTimeout(30000);q.on('error',()=>{if(n>0) setTimeout(()=>t(n-1),3000); else resolve(null)});q.on('timeout',()=>{q.destroy();if(n>0) setTimeout(()=>t(n-1),3000); else resolve(null)});}t(retries);});}

function download(url, dest) {
  return new Promise((resolve) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 500) { resolve(true); return; }
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
    const file = fs.createWriteStream(dest);
    const p = new URL(url);
    const opts = {
      hostname: p.hostname, path: p.pathname + p.search,
      method: 'GET', rejectUnauthorized: false,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://flowus.cn/' }
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

async function main() {
  // Get all FlowUs page IDs
  const r1 = await g('https://api.flowus.cn/v2/blocks/263ff5a0-a407-40aa-b30f-138100984847/children?page_size=50');
  const ids = (r1?.results||[]).filter(b=>b.type==='child_page').map(b=>b.id);
  const r2 = await g('https://api.flowus.cn/v2/blocks/cfd7407f-a536-46aa-9928-1066dc5a117b/children?page_size=50');
  for (const b of (r2?.results||[])) if (b.type==='child_page') ids.push(b.id);
  const algoIds = ['c8224112','d3d36b60','1af14cf9','52bc252a','320adb7d','88b69503'];
  for (const aid of algoIds) {
    const r = await g('https://api.flowus.cn/v2/blocks/'+aid+'-dc06-49e8-831b-a198690c0a34/children?page_size=50');
    for (const b of (r?.results||[])) if (b.type==='child_page') ids.push(b.id);
  }

  // Collect all CDN URLs from markdown
  const imgMap = {}; // filename -> cdn url
  for (const id of ids) {
    const md = await g('https://api.flowus.cn/v2/pages/'+id+'/content/markdown');
    if (!md?.markdown) continue;
    const re = /https:\/\/cdn2\.flowus\.cn\/oss\/[^?)]+/g;
    let m;
    while ((m = re.exec(md.markdown)) !== null) {
      const url = m[0];
      const fn = url.split('/').pop();
      if (!imgMap[fn]) imgMap[fn] = url;
    }
  }
  console.log('发现图片:', Object.keys(imgMap).length);

  // Also get CDN URLs with full params from the markdown (they include tokens)
  const urlMap = {}; // filename -> full url with tokens
  for (const id of ids) {
    const md = await g('https://api.flowus.cn/v2/pages/'+id+'/content/markdown');
    if (!md?.markdown) continue;
    const re = /https:\/\/cdn2\.flowus\.cn\/oss\/[^)\s]+/g;
    let m;
    while ((m = re.exec(md.markdown)) !== null) {
      const url = m[0].split(')')[0];
      const fn = url.split('/').pop().split('?')[0];
      // Prefer url with tokens
      if (!urlMap[fn] || url.includes('token=')) urlMap[fn] = url;
    }
  }
  console.log('完整URL映射:', Object.keys(urlMap).length);

  // Download
  const imgDir = path.join(repoDir, 'images');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

  let ok=0, fail=0;
  for (const [fn, url] of Object.entries(urlMap)) {
    const dest = path.join(imgDir, fn);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 500) { ok++; continue; }
    const success = await download(url, dest);
    if (success) ok++; else fail++;
  }
  console.log(`下载: ${ok}, 失败: ${fail}`);

  // Check all local image references
  const reFile = /!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g;
  // collect filenames from all md files
  const neededFns = new Set();
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      if (f === '.git' || f === 'node_modules') continue;
      if (fs.statSync(fp).isDirectory()) { walk(fp); continue; }
      if (!f.endsWith('.md')) continue;
      const c = fs.readFileSync(fp, 'utf-8');
      let m;
      while ((m = reFile.exec(c)) !== null) neededFns.add(m[2]);
    }
  }
  walk(repoDir);
  console.log('本地需求:', neededFns.size);

  let missing = 0;
  for (const fn of neededFns) {
    if (!fs.existsSync(path.join(imgDir, fn)) || fs.statSync(path.join(imgDir, fn)).size < 100) {
      console.log('MISSING:', fn); missing++;
    }
  }
  if (missing === 0) console.log('✅ 全部图片已下载');
  else console.log('缺失:', missing);
}
main().catch(console.error);
