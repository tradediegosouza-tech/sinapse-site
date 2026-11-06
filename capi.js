// Sinapse · API de Conversões: manda o mesmo evento do pixel também pelo servidor (n8n), com o mesmo ID (sem contar em dobro).
// E-mail, telefone e nome saem daqui já em hash SHA-256 (nunca em texto puro).
// 05/11: external_id (código anônimo do visitante, o mesmo do pixel) e correspondência manual:
// depois do Lead, e-mail/telefone/nome em hash ficam guardados neste navegador e vão nos próximos eventos.
(function(w,d){
  var URL_CAPI='https://n8n.produtodesaude.com.br/webhook/sinapse-capi';
  var PIXEL='1715800203298037';
  function ck(n){var m=d.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'));return m?decodeURIComponent(m[1]):'';}
  function fbc(){var c=ck('_fbc');if(c)return c;var id=new URLSearchParams(location.search).get('fbclid');return id?('fb.1.'+Date.now()+'.'+id):'';}
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k)||'';localStorage.setItem(k,v);}catch(_){return '';}}
  function hash(v){
    v=String(v||'').trim().toLowerCase();if(!v||!w.crypto||!crypto.subtle)return Promise.resolve('');
    return crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')});
  }
  function ehHash(v){return /^[a-f0-9]{64}$/.test(v||'');}
  w.sinapseCapi=function(nome,id,extra,pessoa){
    pessoa=pessoa||{};extra=extra||{};
    var tel=String(pessoa.telefone||'').replace(/\D/g,'');
    if(tel&&tel.length<=11)tel='55'+tel; // padrão da Meta: telefone com código do país
    return Promise.all([hash(pessoa.email),hash(tel),hash(String(pessoa.nome||'').split(' ')[0]),hash(ls('sx_id'))]).then(function(h){
      // Guarda os dados do lead (em hash) para os próximos eventos e atualiza o pixel na hora
      var novos=false;
      [['em',h[0]],['ph',h[1]],['fn',h[2]]].forEach(function(p){if(ehHash(p[1])){ls('sx_'+p[0],p[1]);novos=true;}});
      var em=h[0]||ls('sx_em'),ph=h[1]||ls('sx_ph'),fn=h[2]||ls('sx_fn');
      if(novos&&w.fbq){try{var ud={external_id:ls('sx_id')};if(ehHash(em))ud.em=em;if(ehHash(ph))ud.ph=ph;if(ehHash(fn))ud.fn=fn;w.sinapseUD=ud;fbq('init',PIXEL,ud);}catch(_){}}
      var corpo={event_name:nome,event_id:id,url:location.href.split('#')[0],fbp:ck('_fbp'),fbc:fbc(),em:ehHash(em)?em:'',ph:ehHash(ph)?ph:'',fn:ehHash(fn)?fn:'',external_id:h[3],value:extra.value,content_name:extra.content_name};
      var teste=new URLSearchParams(location.search).get('teste_capi');if(teste)corpo.test_event_code=teste;
      try{fetch(URL_CAPI,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(corpo),keepalive:true});}catch(_){}
    }).catch(function(){});
  };
})(window,document);
