// Quick check that a deployed site is serving the face photos. Plain Node 18+, no browser needed.
//   node docs/proof/check-live.mjs [https://blackpool-brawl.vercel.app/]
// For the title-screen check in a real browser: node docs/proof/verify.mjs https://blackpool-brawl.vercel.app/
const base = process.argv[2] || 'https://blackpool-brawl.vercel.app/';
const at = (p) => new URL(p, base).href;
let bad = 0;
const fail = (msg) => {
  bad++;
  console.log('FAIL', msg);
};

const html = await (await fetch(at('/'), { cache: 'no-store' })).text();
const js = html.match(/\/assets\/[^"]+\.js/)?.[0];
if (!js) fail('no built /assets/*.js in index.html - is Vercel running the build?');
else {
  const code = await (await fetch(at(js))).text();
  console.log(`bundle ${js}: ${code.includes('faces.json') ? 'reads faces/built/faces.json (new face loader)' : 'OLD face loader'}`);
  if (!code.includes('faces.json')) fail('live bundle is the old code - the new commit has not deployed yet');
}

const res = await fetch(at('/faces/built/faces.json'), { cache: 'no-store' });
console.log(`/faces/built/faces.json: ${res.status}`);
const manifest = res.ok ? await res.json() : {};
if (!res.ok) fail('faces.json missing - copy-faces did not run in the build');
for (const [id, file] of Object.entries(manifest)) {
  const r = await fetch(at(`/faces/built/${file}`));
  const buf = new Uint8Array(await r.arrayBuffer());
  const real = buf.length > 1000 && ((buf[0] === 0xff && buf[1] === 0xd8) || buf[0] === 0x89);
  console.log(`  ${id}: /faces/built/${file} ${r.status} ${r.headers.get('content-type')} ${buf.length} bytes${real ? '' : ' NOT A REAL IMAGE'}`);
  if (!r.ok || !real) fail(`${id} photo not served properly`);
}
const missing = ['jonathan', 'phil', 'spencer', 'jordan', 'aaron', 'marcus', 'mark'].filter((n) => !manifest[n]);
console.log(`no photo (cartoon head): ${missing.join(', ') || 'nobody'}`);
console.log(bad ? `LIVE CHECK FAILED (${bad})` : 'LIVE CHECK OK');
process.exitCode = bad ? 1 : 0;
