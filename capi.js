// Sinapse · API de Conversões: manda o mesmo evento do pixel também pelo servidor (n8n), com o mesmo ID (sem contar em dobro).
// E-mail, telefone e nome saem daqui já em hash SHA-256 (nunca em texto puro).
(function(w,d){
  var URL_CAPI='https://n8n.produtodesaude.com.br/webhook/sinapse-capi';
  function ck(n){var m=d.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'));return m?decodeURIComponent(m[1]):'';}
  function fbc(){var c=ck('_fbc');if(c)return c;var id=new URLSearchParams(location.search).get('fbclid');return id?('fb.1.'+Date.now()+'.'+id):'';}
  function hash(v){
    v=String(v||'').trim().toLowerCase();if(!v||!w.crypto||!crypto.subtle)return Promise.resolve('');
    return crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')});
  }
  w.sinapseCapi=function(nome,id,extra,pessoa){
    pessoa=pessoa||{};extra=extra||{};
    var tel=String(pessoa.telefone||'').replace(/\D/g,'');
    return Promise.all([hash(pessoa.email),hash(tel),hash(String(pessoa.nome||'').split(' ')[0])]).then(function(h){
      var corpo={event_name:nome,event_id:id,url:location.href.split('#')[0],fbp:ck('_fbp'),fbc:fbc(),em:h[0],ph:h[1],fn:h[2],value:extra.value,content_name:extra.content_name};
      var teste=new URLSearchParams(location.search).get('teste_capi');if(teste)corpo.test_event_code=teste;
      try{fetch(URL_CAPI,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(corpo),keepalive:true});}catch(_){}
    }).catch(function(){});
  };
})(window,document);
