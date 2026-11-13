#!/usr/bin/env python3
"""Fonds musicaux doux pour les vidéos Vite & Calé.

Quatre boucles de 13 s, composées ici de zéro (piano électrique, basse, petite mélodie,
batterie feutrée) : aucun échantillon ni morceau existant, donc libres de droits.
Usage : python3 musique.py   (numpy et ffmpeg requis) -> musique/a.m4a ... d.m4a
"""
import os, subprocess, wave
import numpy as np

SR = 44100
DUREE = 13.0
N = int(SR * DUREE)
ICI = os.path.dirname(os.path.abspath(__file__))

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def pose(piste, son, debut, gain=1.0, pan=0.0):
    """Ajoute un son mono dans la piste stéréo, à `debut` secondes."""
    i = int(debut * SR)
    if i >= N: return
    son = son[: N - i]
    piste[i:i + len(son), 0] += son * gain * (1 - max(0, pan))
    piste[i:i + len(son), 1] += son * gain * (1 + min(0, pan))

def piano(f, duree=3.2):
    t = np.arange(int(SR * duree)) / SR
    cloche = 0.9 * np.exp(-5 * t) * np.sin(2 * np.pi * f * 2 * t)          # un peu de brillance à l'attaque
    s = np.sin(2 * np.pi * f * t + cloche) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-3 * t)
    env = np.minimum(1, t / 0.012) * np.exp(-t / 1.3)
    return s * env * (1 + 0.06 * np.sin(2 * np.pi * 4.5 * t))              # léger trémolo

def basse(f, duree=1.4):
    t = np.arange(int(SR * duree)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-6 * t)
    return s * np.minimum(1, t / 0.02) * np.exp(-t / 0.55)

def goutte(f, duree=1.2):
    t = np.arange(int(SR * duree)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-9 * t)
    return s * np.minimum(1, t / 0.006) * np.exp(-t / 0.28)

def grosse_caisse():
    t = np.arange(int(SR * 0.35)) / SR
    phase = 2 * np.pi * (45 * t + (110 - 45) * 0.05 * (1 - np.exp(-t / 0.05)))
    return np.sin(phase) * np.exp(-t / 0.11)

def bruit_filtre(rng, duree, bas, haut, decroit):
    n = int(SR * duree)
    sp = np.fft.rfft(rng.standard_normal(n))
    fr = np.fft.rfftfreq(n, 1 / SR)
    sp[(fr < bas) | (fr > haut)] = 0
    t = np.arange(n) / SR
    return np.fft.irfft(sp, n) * np.exp(-t / decroit)

def echo(piste, retard, retour, mix):
    d = int(retard * SR)
    sortie = piste.copy()
    for i in range(d, N, d):                    # y[n] = x[n] + retour * y[n - d], bloc par bloc
        sortie[i:i + d] += retour * sortie[i - d:i][: len(sortie[i:i + d])]
    return piste + mix * (sortie - piste)

def passe_bas(piste, coupure):
    sp = np.fft.rfft(piste, axis=0)
    fr = np.fft.rfftfreq(N, 1 / SR)
    return np.fft.irfft(sp * (1 / (1 + (fr / coupure) ** 4))[:, None], N, axis=0)

# nom : tempo, accords (notes MIDI), gamme de la mélodie
MORCEAUX = {
    "a": (80, [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 52, 59]], [72, 74, 76, 79, 81, 84]),
    "b": (76, [[41, 48, 52, 57], [38, 45, 48, 53], [46, 53, 57, 62], [36, 43, 46, 53]], [72, 74, 77, 79, 81, 84]),
    "c": (84, [[50, 57, 61, 66], [47, 54, 57, 62], [43, 50, 54, 59], [45, 52, 54, 61]], [74, 76, 78, 81, 83, 86]),
    "d": (72, [[45, 52, 55, 59], [41, 48, 52, 57], [48, 55, 59, 64], [40, 47, 50, 55]], [69, 72, 74, 76, 79, 81]),
}

def compose(nom):
    tempo, accords, gamme = MORCEAUX[nom]
    rng = np.random.default_rng(sum(map(ord, nom)) + 7)
    temps = 60.0 / tempo
    touches = np.zeros((N, 2)); melodie = np.zeros((N, 2)); rythme = np.zeros((N, 2)); graves = np.zeros((N, 2))
    clac = bruit_filtre(rng, 0.12, 1500, 5000, 0.025)
    charley = bruit_filtre(rng, 0.06, 7000, 12000, 0.012)
    gc = grosse_caisse()
    mesures = int(np.ceil(DUREE / (4 * temps)))
    precedente = 2
    for m in range(mesures):
        t0 = m * 4 * temps
        accord = accords[m % len(accords)]
        for k, note in enumerate(accord):                                   # accord égrené, repris plus doucement au 3e temps
            pose(touches, piano(hz(note + 12)), t0 + k * 0.022, 0.20, pan=(k - 1.5) * 0.18)
            pose(touches, piano(hz(note + 12), 2.0), t0 + 2.5 * temps + k * 0.018, 0.10, pan=(1.5 - k) * 0.18)
        pose(graves, basse(hz(accord[0] - 12)), t0, 0.42)
        pose(graves, basse(hz(accord[0] - 12), 0.8), t0 + 2.5 * temps, 0.26)
        for b in range(4):
            if b % 2 == 0: pose(rythme, gc, t0 + b * temps, 0.34)
            else: pose(rythme, clac, t0 + b * temps, 0.10, pan=0.15)
            for demi in (0, 1):                                             # croches un peu balancées
                pose(rythme, charley, t0 + (b + demi * 0.56) * temps, 0.035 if demi else 0.022, pan=-0.25)
        for croche in range(8):
            if rng.random() < (0.42 if croche % 2 == 0 else 0.25):
                precedente = int(np.clip(precedente + rng.integers(-2, 3), 0, len(gamme) - 1))
                pose(melodie, goutte(hz(gamme[precedente])), t0 + croche * temps / 2 * (1.06 if croche % 2 else 1), 0.11, pan=rng.uniform(-0.4, 0.4))
    melodie = echo(melodie, 0.75 * temps, 0.38, 0.5)
    touches = echo(touches, 0.031, 0.25, 0.2)                               # un peu d'air autour du piano
    mix = passe_bas(touches + melodie + graves + rythme, 5500)
    t = np.arange(N) / SR
    mix *= (np.minimum(1, t / 0.08) * np.minimum(1, (DUREE - t) / 1.6))[:, None]   # entrée nette, sortie en fondu
    return mix / np.max(np.abs(mix)) * 0.6

if __name__ == "__main__":
    os.makedirs(os.path.join(ICI, "musique"), exist_ok=True)
    for nom in MORCEAUX:
        wav = os.path.join(ICI, "musique", nom + ".wav")
        with wave.open(wav, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((compose(nom) * 32767).astype("<i2").tobytes())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-c:a", "aac", "-b:a", "160k", wav[:-4] + ".m4a"], check=True)
        os.remove(wav)
        print("musique/" + nom + ".m4a")
