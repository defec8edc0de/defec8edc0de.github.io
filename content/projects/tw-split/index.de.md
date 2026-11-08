---
title: "tw-split"
date: 2026-11-07
description: "Verschlüsselter Speicher für ein TiddlyWiki auf GitHub Pages, eine AES-256-GCM-Datei pro Notiz, geladen erst beim Öffnen."
tags: [security, cryptography, tiddlywiki, privacy]
featured: true
repo: "https://github.com/defec8edc0de/tw-split"
---

Ein passwortgeschütztes TiddlyWiki ist ein tolles privates Notizbuch, bis es groß wird. Die eingebaute Verschlüsselung macht das *gesamte* Wiki samt Bildern und Plugins zu einem einzigen Chiffretext. Bei jedem Aufruf lädst und entschlüsselst du alles, bei jedem Speichern wird alles neu geschrieben.

**tw-split** zerlegt diese Datei. Übrig bleiben eine kleine Ladeseite und **eine AES-256-GCM-verschlüsselte Datei pro Tiddler**, mit nichtssagenden Namen, in einem öffentlichen GitHub-Pages-Repository. Das mitgelieferte Plugin **tw-enc-sync** ist ein ganz normaler TiddlyWiki-*Syncadaptor*. Es lädt beim Start ein verschlüsseltes Manifest, entschlüsselt eine Notiz erst, wenn du sie öffnest, und speichert Änderungen als einen einzigen Git-Commit über die GitHub-API. Kein Server nötig, und der TiddlyWiki-Core bleibt unangetastet.

{{< cast src="demo.cast" title="tw-split: ein Demo-Wiki migrieren" cols=96 rows=26 idle=1.2 speed=1.1 poster="npt:0:14" >}}
# tw-split demo — a synthetic wiki, a throw-away password
$ ls -lh tw.html
2.7M tw.html
# one file, whole wiki encrypted: every open decrypts everything
$ read -rs TW_PASSWORD && export TW_PASSWORD
$ twmigrate migrate --src tw.html --out out --repo you/notes
external tiddlers: 7, plugins kept in stage-1: 3, dropped state/temp: 3
PLAINTEXT in stage-1 (public by design): $:/core, $:/themes/tiddlywiki/snowwhite, $:/themes/tiddlywiki/vanilla
stage-1 size: 2292197 bytes (original 2829983)
$ twmigrate verify --src tw.html --out out
verified 7 tiddlers, mismatches: 0, extra manifest entries: 0, stray files: 0
filename/stage-1 leaks: 0
$ find out -type f
30d7bcb0cead/f466397afa4cda204df18668ef2a233e.bin
4a2c76073e77/a4898b90666f598e5dd01f8358c50b1e.bin
4a2c76073e77/ee913c246de3e2edf730bbf73395676f.bin
a96e93a44c91/1d8c89cb8ce5bab43387821c6819a1a9.bin
a96e93a44c91/33a69fe5edc7ad8233ab41ab7724d1e7.bin
a96e93a44c91/978849bdc8a2058978d0f2f735cc7944.bin
b0f404ef2448/b80a62f996453eae0111326b55603fe0.bin
m/f6165d4b6d74609c13d788c31ff86ff7.bin
tw.html
$ od -A x -t x1z -N 48 out/m/*.bin
000000 54 57 4d 31 00 00 00 00 00 00 00 01 42 dc c5 3a  >TWM1........B..:<
000010 8d 2e e7 29 a0 03 9a 5a d2 c8 ef d7 32 ce ef 7a  >...)...Z....2..z<
000020 61 9b 54 f6 18 48 91 5c d3 61 1b 14 3b c6 7c f9  >a.T..H.\.a..;.|.<
000030
$ grep -rl 'Lorem ipsum' out/ --include='*.bin'
no plaintext in out/
# push out/ to a GitHub Pages repo; the browser decrypts one note at a time
{{< /cast >}}

## So funktioniert es

- **Ein Passwort, ein Schlüssel.** Das Passwort entsperrt einen winzigen Blob im gewohnten TiddlyWiki-Format. Darin steckt ein zufälliger 256-Bit-Datenschlüssel, aus dem HKDF getrennte Schlüssel für Inhalte, Dateinamen und Manifest ableitet.
- **Nichts Lesbares im Repository.** Pfade sehen aus wie `<12 hex>/<32 hex>.bin`, geschlüsselte HMACs von Kategorie und Titel. Titel, Tags und Ordner tauchen nirgends auf, Dateigrößen werden aufgefüllt.
- **Manipulationen fallen auf.** AES-GCM bindet jede Datei an ihre ID und Revision. Das Manifest enthält den Hash jeder Datei und einen Zähler, der nur steigt. Ein Browser, der schon einen neueren Stand gesehen hat, akzeptiert kein Zurücksetzen.
- **Schnell.** Geladen werden nur das Manifest und die Notizen, die du öffnest. Bilder werden erst beim Anzeigen entschlüsselt.
- **Mehrere Speicherwege.** Als GitHub-Commit über die Git-Data-API, direkt in einen lokalen Ordner (File System Access API) oder als Zip mit den geänderten Dateien.
- **Vorsichtige Voreinstellungen.** Das Token liegt nur im Session Storage. Aktives HTML in Notizen wird entschärft. Ein Klartext-Export des ganzen Wikis ist gesperrt. Und das Bedrohungsmodell sagt klar, wo die Grenzen liegen: schwache Passwörter, sichtbare Metadaten wie Commit-Zeiten und die Ladeseite selbst.

## Status

Mein eigenes privates Journal läuft darauf. Ich bereite gerade eine Open-Source-Veröffentlichung unter MIT-Lizenz vor, mit Bedrohungsmodell, Formatspezifikation und den Python- und JavaScript-Testsuiten. Bitte nicht als auditierte Kryptografie verstehen und zuerst das Bedrohungsmodell lesen.
