# QMI · M7 aplicação · métrica de lucro da Sinapse (08/11/2026). Dados: Mapa 1422/1424, Cakto, Gmail.
import math
bruto, liquido = 132.98, 119.34
taxa_liq = liquido / bruto                      # fração que fica depois da Cakto
anuncios = 215.41                               # Meta 01-08/11
F_prov, F_velho = 0.0, 639.45
pacote_liq = 47.0 * taxa_liq
piloto_liq = 497.0 * taxa_liq
cpl = 160.01 / 72                               # custo por lead, Isca acumulado
leads, compras = 48, 1                          # desde 31/10 (Sandro é lead antigo)
amostras = 43

# 1) Lucro comprovado e pior caso
L_prov = liquido - anuncios - F_prov
L_pior = liquido - anuncios - F_velho
assert abs(L_prov - (-96.07)) < 0.01 and abs(L_pior - (-735.52)) < 0.01

# 2) Custo para conseguir 1 cliente (CAC) com a conversão atual
conv = compras / leads
cac = cpl / conv
# 3) Conversão mínima para empatar (lucro por venda = custo de leads)
be_pacote = cpl / pacote_liq                     # fração mínima de leads que precisam comprar
be_piloto = cpl / piloto_liq
assert be_pacote > conv                          # Pacote hoje não se paga
assert be_piloto < conv                          # Piloto se pagaria

# 4) Incerteza da conversão (Wilson 95%) com 1 venda em 43 amostras
def wilson(k, n, z=1.96):
    p = k / n; d = 1 + z*z/n
    c = (p + z*z/(2*n)) / d; h = z*math.sqrt(p*(1-p)/n + z*z/(4*n*n)) / d
    return c - h, c + h
lo, hi = wilson(1, amostras)
assert lo < 1/amostras < hi

# 5) Quantos Pilotos para a meta de R$1.500 (dois ritmos de anúncio por mês)
def pilotos_para(meta, gasto_mes, F=0.0):
    return (meta + gasto_mes + F - liquido) / piloto_liq
ritmo_atual = anuncios / 8 * 30                  # mantém o ritmo 01-08/11
ritmo_80 = 80 * 30                               # se rodar R$80/dia o mês todo
n_atual, n_80 = pilotos_para(1500, ritmo_atual), pilotos_para(1500, ritmo_80)

# 6) Valor esperado da Sandra para alguns p (chance de aprovar) - hipótese, sem dado
ev = {p: round(L_prov + p * piloto_liq, 2) for p in (0.2, 0.4, 0.6)}

print(f"taxa liquida Cakto = {taxa_liq:.4f} | Pacote liq = R$ {pacote_liq:.2f} | Piloto liq = R$ {piloto_liq:.2f}")
print(f"lucro comprovado = R$ {L_prov:.2f} | pior caso = R$ {L_pior:.2f}")
print(f"custo por lead = R$ {cpl:.2f} | conversao lead->compra = {conv:.2%} | CAC = R$ {cac:.2f}")
print(f"empate Pacote: 1 compra a cada {1/be_pacote:.1f} leads ({be_pacote:.1%}) | empate Piloto: 1 a cada {1/be_piloto:.0f} leads ({be_piloto:.2%})")
print(f"conversao amostra->compra 1/43 = {1/43:.1%}, intervalo 95% = {lo:.1%} a {hi:.1%}")
print(f"anuncio no ritmo atual = R$ {ritmo_atual:.0f}/mes -> Pilotos p/ meta = {n_atual:.1f} | a R$80/dia = R$ {ritmo_80}/mes -> {n_80:.1f}")
print("valor esperado do mes com a Sandra (p = chance de aprovar):", ev)
print("TODOS OS TESTES PASSARAM")
