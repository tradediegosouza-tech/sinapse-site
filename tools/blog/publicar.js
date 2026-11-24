// Publica artigos do Blog da Sinapse no site (GitHub Pages).
// Uso: node tools/blog/publicar.js artigos.json   (lista de {titulo,resumo,livro,dor,corpo,data_iso?})
// Gera blog/<slug>/index.html com o modelo do Redator, atualiza blog/posts.json, a lista em blog/index.html e o sitemap.xml.
const fs = require('fs'), path = require('path');
const raiz = path.resolve(__dirname, '..', '..');
const modelo = fs.readFileSync(path.join(__dirname, 'modelo-artigo.js'), 'utf8');
const render = new Function('$input', '$now', modelo);
const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const entrada = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const regPath = path.join(raiz, 'blog', 'posts.json');
const reg = fs.existsSync(regPath) ? JSON.parse(fs.readFileSync(regPath, 'utf8')) : [];
for (const a of entrada) {
  const iso = a.data_iso || new Date().toISOString().slice(0, 10);
  const [y, m, d] = iso.split('-');
  const now = { setZone() { return this; }, setLocale() { return this; }, toFormat(f) { return f === 'yyyy-MM-dd' ? iso : d + ' de ' + meses[Number(m) - 1] + ' de ' + y; } };
  const text = JSON.stringify({ titulo: a.titulo, resumo: a.resumo, livro: a.livro || '', dor: a.dor || '', palavra_chave: a.palavra_chave || '', corpo: a.corpo });
  const out = render({ first: () => ({ json: { text } }) }, now)[0].json;
  const dir = path.join(raiz, 'blog', out.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), out.html);
  const i = reg.findIndex(r => r.slug === out.slug);
  const item = { slug: out.slug, titulo: out.titulo, resumo: out.resumo, data_iso: iso, minutos: out.minutos };
  if (i >= 0) reg[i] = item; else reg.push(item);
  console.log('publicado:', '/blog/' + out.slug + '/');
}
reg.sort((x, y) => (y.data_iso || '').localeCompare(x.data_iso || ''));
fs.writeFileSync(regPath, JSON.stringify(reg, null, 1));
const lista = reg.map(r => { const [y, m, d] = r.data_iso.split('-'); return '<a class="post" href="/blog/' + r.slug + '/"><h2>' + esc(r.titulo) + '</h2><p>' + esc(r.resumo) + '</p><small>' + d + ' de ' + meses[Number(m) - 1] + ' de ' + y + ' · ' + r.minutos + ' min de leitura</small></a>'; }).join('\n');
const idxPath = path.join(raiz, 'blog', 'index.html');
fs.writeFileSync(idxPath, fs.readFileSync(idxPath, 'utf8').replace(/<!--POSTS-->[\s\S]*?<!--\/POSTS-->/, '<!--POSTS-->\n' + (lista || '<p class="vazio">Os primeiros artigos estão chegando.</p>') + '\n<!--/POSTS-->'));
const smPath = path.join(raiz, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8').replace(/\n<url><loc>https:\/\/aisinapse\.com\.br\/blog\/[^<]+\/<\/loc><lastmod>[^<]*<\/lastmod><\/url>/g, '');
sm = sm.replace('<!--BLOG-->', reg.map(r => '<url><loc>https://aisinapse.com.br/blog/' + r.slug + '/</loc><lastmod>' + r.data_iso + '</lastmod></url>').join('\n') + '\n<!--BLOG-->');
fs.writeFileSync(smPath, sm);
