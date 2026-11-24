const bruto = String($input.first().json.text || '').replace(/```json|```/g, '').trim();
let a = null;
try { const m = bruto.match(/\{[\s\S]*\}/); a = JSON.parse(m ? m[0] : bruto); } catch (e) { a = null; }
if (!a || !a.titulo || !a.corpo) throw new Error('O Redator não devolveu o artigo no formato esperado. Início da resposta: ' + bruto.slice(0, 300));
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
function md(txt) {
  const out = []; let lista = null;
  const fecha = () => { if (lista) { out.push('</' + lista + '>'); lista = null; } };
  for (const raw of String(txt).split(/\r?\n/)) {
    const l = raw.trim();
    if (!l) { fecha(); continue; }
    let m;
    if ((m = l.match(/^###\s+(.*)/))) { fecha(); out.push('<h3>' + inline(m[1]) + '</h3>'); continue; }
    if ((m = l.match(/^##?\s+(.*)/))) { fecha(); out.push('<h2>' + inline(m[1]) + '</h2>'); continue; }
    if ((m = l.match(/^[-*]\s+(.*)/))) { if (lista !== 'ul') { fecha(); out.push('<ul>'); lista = 'ul'; } out.push('<li>' + inline(m[1]) + '</li>'); continue; }
    if ((m = l.match(/^\d+[.)]\s+(.*)/))) { if (lista !== 'ol') { fecha(); out.push('<ol>'); lista = 'ol'; } out.push('<li>' + inline(m[1]) + '</li>'); continue; }
    if ((m = l.match(/^>\s*(.*)/))) { fecha(); out.push('<blockquote>' + inline(m[1]) + '</blockquote>'); continue; }
    fecha(); out.push('<p>' + inline(l) + '</p>');
  }
  fecha(); return out.join('\n');
}
// "Principais lições" no topo (padrão dos blogs que mais vendem no nicho): tira a seção "Resumo rápido" do fim e leva para cima.
let corpo = String(a.corpo);
let licoes = [];
const mRes = corpo.match(/\n#{2,3}\s*Resumo r[aá]pido[^\n]*\n([\s\S]*?)(?=\n#{2,3}\s|\n[^\n*\-\d\s][^\n]*$|$)/i);
if (mRes) {
  licoes = mRes[1].split(/\r?\n/).map(l => l.trim()).filter(l => /^([-*]|\d+[.)])\s+/.test(l)).map(l => l.replace(/^([-*]|\d+[.)])\s+/, '')).slice(0, 5);
  if (licoes.length) corpo = corpo.replace(mRes[0], '\n');
}
const slug = String(a.titulo).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70).replace(/-$/, '');
const chave = Array.from({ length: 24 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)]).join('');
const agora = $now.setZone('America/Sao_Paulo');
const hoje = agora.setLocale('pt-BR').toFormat("dd 'de' LLLL 'de' yyyy");
const dataIso = agora.toFormat('yyyy-MM-dd');
const palavras = corpo.split(/\s+/).length;
const minutos = Math.max(2, Math.round(palavras / 200));
const url = 'https://aisinapse.com.br/blog/' + slug + '/';
const livro = String(a.livro || '').trim();
const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: String(a.titulo), description: String(a.resumo || ''), datePublished: dataIso, dateModified: dataIso, inLanguage: 'pt-BR', mainEntityOfPage: url, image: 'https://aisinapse.com.br/studio/vsl-capa.jpg', author: { '@type': 'Person', name: 'Diego Mendes', url: 'https://aisinapse.com.br/quem/' }, publisher: { '@type': 'Organization', name: 'Sinapse', url: 'https://aisinapse.com.br/' } }).replace(/</g, '\\u003c');
// CTA do meio (app) entra antes do 3º subtítulo; CTA final oferece o Studio e o Reel grátis.
const ctaMeio = '<aside class="mid"><img src="/studio/vsl-capa.jpg" alt="Sinapse Studio no celular" width="90" height="160" loading="lazy"><div><b>Sem tempo para gravar e editar?</b><p>No Sinapse Studio você escolhe o tema e recebe o Reel pronto, com o seu nome e registro. Você revisa e aprova cada um antes de postar.</p><a href="/studio/?origem=blog">Conhecer o Studio →</a></div></aside>';
let artigo = md(corpo);
const partes = artigo.split('<h2>');
if (partes.length > 3) { partes[2] = partes[2] + ctaMeio; artigo = partes.join('<h2>'); } else { artigo += ctaMeio; }
const boxLicoes = licoes.length ? '<div class="lic"><b>Principais lições deste artigo</b><ul>' + licoes.map(l => '<li>' + inline(l) + '</li>').join('') + '</ul></div>' : '';
const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
 + '<title>' + esc(a.titulo) + ' | Blog da Sinapse</title><meta name="description" content="' + esc(a.resumo) + '">'
 + '<link rel="canonical" href="' + url + '"><meta property="og:type" content="article"><meta property="og:title" content="' + esc(a.titulo) + '"><meta property="og:description" content="' + esc(a.resumo) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="https://aisinapse.com.br/studio/vsl-capa.jpg"><meta name="theme-color" content="#0B0F14">'
 + '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Ccircle cx=%2750%27 cy=%2750%27 r=%2740%27 fill=%27%235EEAD4%27/%3E%3Ccircle cx=%2750%27 cy=%2750%27 r=%2714%27 fill=%27%230B0F14%27/%3E%3C/svg%3E">'
 + '<script type="application/ld+json">' + ld + '</script>'
 + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono&display=swap">'
 + '<style>:root{--bg:#0B0F14;--card:#121821;--line:#1F2833;--line2:#2A3441;--tx:#E8ECF1;--tx2:#C9D2DC;--tx3:#8A96A5;--ac:#5EEAD4}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:18px/1.75 "IBM Plex Sans",system-ui,sans-serif}a{color:var(--ac)}img{max-width:100%}'
 + '.wrap{max-width:740px;margin:0 auto;padding:0 22px}nav{display:flex;justify-content:space-between;align-items:center;padding:22px 0}nav a{text-decoration:none;color:var(--tx);font:600 18px Sora,sans-serif}nav a.cta{font:500 15px "IBM Plex Sans",sans-serif;color:#0B0F14;background:var(--ac);padding:10px 18px;border-radius:999px}'
 + '.hero{background:radial-gradient(700px 320px at 20% 0%,#123A52,transparent 70%)}.eyebrow{margin:20px 0 10px;font:13px "IBM Plex Mono",monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--ac)}.eyebrow a{text-decoration:none}h1,h2,h3{font-family:Sora,system-ui,sans-serif;line-height:1.22;text-wrap:balance}h1{font-size:clamp(30px,6vw,42px);margin:0 0 14px;letter-spacing:-.02em}'
 + '.autor{display:flex;align-items:center;gap:12px;color:var(--tx3);font-size:14px;margin:0 0 26px}.autor img{width:44px;height:44px;border-radius:50%;border:2px solid var(--ac)}.autor b{color:var(--tx);font-weight:500}'
 + '.lic{background:var(--card);border:1px solid var(--line2);border-left:4px solid var(--ac);border-radius:14px;padding:18px 22px;margin:0 0 30px}.lic b{font-family:Sora,sans-serif}.lic ul{margin:10px 0 0;padding-left:20px}.lic li{color:var(--tx2);margin:6px 0;font-size:16px}'
 + 'article h2{font-size:25px;margin:38px 0 8px}article h3{font-size:20px;margin:26px 0 6px}article p,article li{color:var(--tx2)}article li{margin:6px 0}blockquote{margin:22px 0;padding:12px 18px;border-left:3px solid var(--ac);background:var(--card);border-radius:0 12px 12px 0}strong{color:var(--tx)}'
 + '.mid{display:flex;gap:18px;align-items:center;margin:34px 0;padding:18px;border:1px solid var(--line2);border-radius:18px;background:linear-gradient(135deg,#10202E,#121821)}.mid img{width:90px;height:160px;object-fit:cover;border-radius:12px;flex:none}.mid b{font-family:Sora,sans-serif;font-size:19px}.mid p{margin:6px 0 10px;font-size:16px;color:var(--tx2)}.mid a{font-weight:500;text-decoration:none}'
 + '.fim{margin:44px 0 20px;padding:28px;border:1px solid var(--ac);border-radius:20px;background:var(--card)}.fim h2{margin:0 0 8px;font-size:24px}.fim p{margin:0 0 18px;color:var(--tx2)}.fim .bts{display:flex;flex-wrap:wrap;gap:12px}.btn{display:inline-block;color:#0B0F14;background:var(--ac);padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:500}.btn-o{display:inline-block;color:var(--tx);border:1px solid var(--line2);padding:14px 24px;border-radius:999px;text-decoration:none}.fim small{display:block;margin-top:14px;color:var(--tx3);font-size:14px}'
 + 'footer{border-top:1px solid var(--line);padding:20px 0 40px;font-size:14px;color:var(--tx3)}@media(max-width:520px){.mid{flex-direction:column;align-items:flex-start}.mid img{display:none}}</style></head><body>'
 + '<div class="hero"><div class="wrap"><nav><a href="/">Sinapse</a><a class="cta" href="/amostra/?origem=blog">Reel grátis</a></nav>'
 + '<p class="eyebrow"><a href="/blog/">Blog da Sinapse</a> · para psicólogas e terapeutas</p><h1>' + esc(a.titulo) + '</h1>'
 + '<div class="autor"><img src="/img/diego.jpg" alt="Diego Mendes" width="44" height="44"><div><b>Diego Mendes</b>, fundador da Sinapse<br>' + hoje + ' · ' + minutos + ' min de leitura' + (livro ? ' · Base: ' + esc(livro) : '') + '</div></div></div></div>'
 + '<div class="wrap">' + boxLicoes + '<article>' + artigo + '</article>'
 + '<div class="fim"><h2>Seu Instagram em dia, sem gravar e sem editar</h2><p>Comece pelo Reel de amostra grátis, com o seu nome. Se gostar, o Sinapse Studio entrega 10 Reels por mês para você revisar e postar.</p><div class="bts"><a class="btn" href="/amostra/?origem=blog">Quero meu Reel grátis</a><a class="btn-o" href="/studio/?origem=blog">Conhecer o Studio</a></div><small>Garantia de 7 dias no Studio. Sem promessa de pacientes: você recebe conteúdo pronto e ético.</small></div>'
 + '<p><a href="/blog/">← Ver todos os artigos</a></p>'
 + '<footer>Sinapse · aisinapse.com.br · Conteúdo educativo para profissionais. Confira sempre as orientações do seu Conselho.</footer></div></body></html>';
return [{ json: { titulo: String(a.titulo), slug, resumo: String(a.resumo || ''), livro, dor: String(a.dor || ''), palavra_chave: String(a.palavra_chave || '').toUpperCase(), corpo: corpo.trim(), html, chave, minutos, data_iso: dataIso, licoes: licoes.join(' | ') } }];
