"""Transcreve uma narração com o tempo de cada palavra (faster-whisper, roda na CPU).

    ferramentas/.venv/bin/python ferramentas/transcrever.py narracao.mp3 saida.json [--modelo large-v3-turbo]

Só LÊ o áudio: nada é cortado, acelerado ou regravado.
Gera saida.json ({duracao, texto, palavras:[{p, ini, fim, conf}], frases:[...]}) e saida.txt legível.
"""
import argparse, json, os, subprocess, sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
os.environ.setdefault("HF_HOME", str(AQUI / ".modelos"))
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")  # baixa por HTTPS comum (o protocolo Xet usa outro servidor)

import numpy as np  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("audio")
ap.add_argument("saida")
ap.add_argument("--modelo", default="large-v3-turbo")
ap.add_argument("--idioma", default="pt")
a = ap.parse_args()

modelo = WhisperModel(a.modelo, device="cpu", compute_type="int8", cpu_threads=os.cpu_count())
# cópia de análise em memória (16 kHz mono); o arquivo da narração não é tocado
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", a.audio, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                     check=True, capture_output=True).stdout
amostras = np.frombuffer(pcm, dtype=np.float32)
segs, info = modelo.transcribe(amostras, language=a.idioma, word_timestamps=True, beam_size=5,
                               vad_filter=False, condition_on_previous_text=False)
frases, palavras = [], []
for s in segs:
    ws = [{"p": w.word.strip(), "ini": round(w.start, 3), "fim": round(w.end, 3), "conf": round(w.probability, 3)} for w in s.words]
    palavras += ws
    frases.append({"texto": s.text.strip(), "ini": round(s.start, 3), "fim": round(s.end, 3), "palavras": len(ws)})
    print(f"[{s.start:6.2f} → {s.end:6.2f}] {s.text.strip()}", file=sys.stderr)

# Ajuste fino: o Whisper costuma começar frases um pouco antes da voz. Onde um início (ou fim) de palavra
# cai dentro de uma pausa real do áudio, ele é encostado na borda da pausa.
det = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", a.audio, "-af", "silencedetect=n=-38dB:d=0.12", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
import re  # noqa: E402
ini_p = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", det)]
fim_p = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", det)]
pausas = list(zip(ini_p, fim_p))
ajustes = 0
for w in palavras:
    for (pi, pf) in pausas:
        if pi <= w["ini"] < pf and pf < w["fim"]:
            w["ini"] = round(pf, 3); ajustes += 1
        if pi < w["fim"] <= pf and w["ini"] < pi:
            w["fim"] = round(pi, 3); ajustes += 1
# palavra que abre frase e "engole" uma pausa inteira: a voz só começa no fim da pausa
inicios = {sum(fr["palavras"] for fr in frases[:k]) for k in range(len(frases))}
for i in inicios:
    if i >= len(palavras): continue
    w = palavras[i]
    for (pi, pf) in pausas:
        if w["ini"] < pi and pf < w["fim"] and pf - pi >= 0.25:
            w["ini"] = round(pf, 3); ajustes += 1
for f, i0 in zip(frases, [sum(fr["palavras"] for fr in frases[:k]) for k in range(len(frases))]):
    ws = palavras[i0:i0 + f["palavras"]]
    if ws: f["ini"], f["fim"] = ws[0]["ini"], ws[-1]["fim"]
print(f"ajuste fino pelas pausas: {ajustes} bordas", file=sys.stderr)

saida = {"audio": os.path.basename(a.audio), "duracao": round(info.duration, 3), "modelo": a.modelo,
         "texto": " ".join(f["texto"] for f in frases), "pausas": [[round(x, 3), round(y, 3)] for x, y in pausas],
         "frases": frases, "palavras": palavras}
Path(a.saida).write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
with open(Path(a.saida).with_suffix(".txt"), "w", encoding="utf-8") as f:
    for w in palavras:
        f.write(f"{w['ini']:7.3f}  {w['fim']:7.3f}  {w['conf']:.2f}  {w['p']}\n")
print(f"{len(palavras)} palavras, {info.duration:.2f}s → {a.saida}", file=sys.stderr)
