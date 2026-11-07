"""
Quantum Mathematical Intelligence · Sessão 1 (07/11/2026)
Exercícios 1-5 da skill: M1 (hermitianas, unitárias), M2 (regra de Born),
M3 (estado de Bell, entropia de von Neumann) e comparação clássica (CHSH).
Rodar: python3 sessao1_m1_m3.py  -> todos os asserts precisam passar.
"""
import numpy as np

rng = np.random.default_rng(7)
TOL = 1e-10
res = {}

# ---------- Ex 1 (M1): autovalores de matriz hermitiana são reais ----------
# Prova: H = H†, H v = λ v  =>  λ <v|v> = <v|H v> = <H v|v> = λ* <v|v>  =>  λ = λ*.
max_imag = 0.0
for _ in range(100):
    n = rng.integers(2, 9)
    A = rng.normal(size=(n, n)) + 1j * rng.normal(size=(n, n))
    H = (A + A.conj().T) / 2
    lam = np.linalg.eigvals(H)  # eigvals genérico, de propósito (não o eigvalsh)
    max_imag = max(max_imag, np.max(np.abs(lam.imag)))
assert max_imag < 1e-9, max_imag
res["ex1_max_parte_imaginaria"] = max_imag

# ---------- Ex 2 (M1): unitária preserva a norma ----------
# Prova: ||U v||² = <v|U†U|v> = <v|v>.
max_err = 0.0
for _ in range(100):
    n = rng.integers(2, 9)
    Z = rng.normal(size=(n, n)) + 1j * rng.normal(size=(n, n))
    Q, R = np.linalg.qr(Z)                     # Q é unitária
    assert np.allclose(Q.conj().T @ Q, np.eye(n), atol=TOL)
    v = rng.normal(size=n) + 1j * rng.normal(size=n)
    max_err = max(max_err, abs(np.linalg.norm(Q @ v) - np.linalg.norm(v)))
assert max_err < 1e-9, max_err
res["ex2_max_erro_norma"] = max_err

# ---------- Ex 3 (M2): |ψ> = (|0> + i|1>)/√2, regra de Born ----------
psi = np.array([1, 1j]) / np.sqrt(2)
assert abs(np.vdot(psi, psi).real - 1) < TOL            # normalizado
p = np.abs(psi) ** 2                                    # Born: p_k = |<k|ψ>|²
assert np.allclose(p, [0.5, 0.5], atol=TOL)
N = 10_000
amostras = rng.choice([0, 1], size=N, p=p)
freq1 = amostras.mean()
erro_padrao = np.sqrt(0.25 / N)                         # 0,005
assert abs(freq1 - 0.5) < 4 * erro_padrao, freq1        # dentro de 4 sigmas
res["ex3_freq_resultado_1"] = float(freq1)

# ---------- Ex 4 (M3): estado de Bell e entropia de von Neumann ----------
bell = np.array([1, 0, 0, 1]) / np.sqrt(2)              # (|00>+|11>)/√2
rho = np.outer(bell, bell.conj())
assert abs(np.trace(rho) - 1) < TOL and abs(np.trace(rho @ rho) - 1) < TOL  # puro
rho_A = rho.reshape(2, 2, 2, 2).trace(axis1=1, axis2=3) # traço parcial em B
assert np.allclose(rho_A, np.eye(2) / 2, atol=TOL)      # maximamente misto
ev = np.linalg.eigvalsh(rho_A)
S = -sum(x * np.log2(x) for x in ev if x > 1e-15)
assert abs(S - 1) < TOL, S                              # 1 bit de emaranhamento
res["ex4_entropia_bits"] = float(S)

# ---------- Ex 5: comparação clássica (desigualdade CHSH) ----------
# Clássico (variáveis ocultas locais): |S| <= 2. Quântico (Tsirelson): até 2√2.
Zm = np.array([[1, 0], [0, -1]]); Xm = np.array([[0, 1], [1, 0]])
def obs(theta):  # medição no plano X-Z
    return np.cos(theta) * Zm + np.sin(theta) * Xm
def E(a, b):
    return np.real(bell.conj() @ np.kron(obs(a), obs(b)) @ bell)
a0, a1, b0, b1 = 0, np.pi / 2, np.pi / 4, -np.pi / 4
S_q = E(a0, b0) + E(a0, b1) + E(a1, b0) - E(a1, b1)
# melhor estratégia clássica determinística: varrer as 16 combinações de ±1
S_c = max(abs(A0*B0 + A0*B1 + A1*B0 - A1*B1)
          for A0 in (1, -1) for A1 in (1, -1) for B0 in (1, -1) for B1 in (1, -1))
assert S_c == 2
assert abs(S_q - 2 * np.sqrt(2)) < 1e-9, S_q
res["ex5_CHSH_classico_max"] = S_c
res["ex5_CHSH_quantico"] = float(S_q)

print("TODOS OS TESTES PASSARAM")
for k, v in res.items():
    print(f"  {k}: {v}")
