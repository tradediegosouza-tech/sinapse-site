#!/usr/bin/env bash
# Sinapse · servidor de vídeos na VPS (11/11/2026)
# Cria um container nginx pequeno (64 MB) que serve os Reels em
# https://<host do n8n>/v/...  com suporte a pular no vídeo (Range).
# Envio de arquivo só com a chave (cabeçalho X-Chave). Não mexe no n8n.
# Uso: bash videos-vps.sh CHAVE
set -euo pipefail
KEY="${1:?falta a chave}"
B=/opt/sinapse-videos
C=n8n-main
docker inspect "$C" >/dev/null 2>&1 || { echo "ERRO: container $C não achado"; docker ps --format '{{.Names}}'; exit 1; }
L=$(docker inspect "$C" --format '{{range $k,$v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}')
RULE=$(echo "$L" | grep -m1 '^traefik\.http\.routers\..*\.rule=' | cut -d= -f2- || true)
HOST=$(echo "$RULE" | sed -n 's/.*Host(`\([^`]*\)`).*/\1/p')
EP=$(echo "$L" | grep -m1 '^traefik\.http\.routers\..*\.entrypoints=' | cut -d= -f2- || true)
CR=$(echo "$L" | grep -m1 '\.tls\.certresolver=' | cut -d= -f2- || true)
NET=$(docker inspect "$C" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | awk '{print $1}')
echo "host=$HOST ep=$EP cr=$CR net=$NET"
[ -n "$HOST" ] && [ -n "$EP" ] || { echo "ERRO: não achei as etiquetas do Traefik no n8n"; echo "$L" | grep -i traefik; exit 1; }
mkdir -p "$B/data/v"
chown -R 101:101 "$B/data"
cat > "$B/default.conf" <<EOF
server {
  listen 80;
  client_max_body_size 300m;
  location /v/ {
    root /data;
    set \$w "";
    if (\$request_method ~ ^(PUT|DELETE)\$) { set \$w "1"; }
    if (\$http_x_chave != "$KEY") { set \$w "\${w}x"; }
    if (\$w = "1x") { return 403; }
    dav_methods PUT DELETE;
    create_full_put_path on;
    dav_access user:rw group:r all:r;
    add_header Access-Control-Allow-Origin * always;
    add_header Cache-Control "public, max-age=604800" always;
  }
  location / { return 404; }
}
EOF
docker rm -f sinapse-videos >/dev/null 2>&1 || true
TLS=()
[ -n "$CR" ] && TLS=(--label "traefik.http.routers.sinvid.tls.certresolver=$CR")
docker run -d --name sinapse-videos --restart unless-stopped --memory 64m \
  --network "$NET" \
  -v "$B/data:/data" -v "$B/default.conf:/etc/nginx/conf.d/default.conf:ro" \
  --label traefik.enable=true \
  --label "traefik.http.routers.sinvid.rule=Host(\`$HOST\`) && PathPrefix(\`/v/\`)" \
  --label "traefik.http.routers.sinvid.entrypoints=$EP" \
  --label traefik.http.routers.sinvid.tls=true \
  "${TLS[@]}" \
  --label traefik.http.routers.sinvid.priority=1000 \
  --label traefik.http.services.sinvid.loadbalancer.server.port=80 \
  --label "traefik.docker.network=$NET" \
  nginx:1.27-alpine >/dev/null
sleep 6
echo ok > "$B/data/v/teste.txt"; chown 101:101 "$B/data/v/teste.txt"
R=$(curl -s -o /dev/null -w '%{http_code}' "https://$HOST/v/teste.txt" || true)
echo "teste https = $R"
df -h / | tail -1
[ "$R" = "200" ] && echo "✅ SINAPSE VIDEOS OK" || { echo "⚠️ não respondeu 200"; docker logs --tail 20 sinapse-videos; }
