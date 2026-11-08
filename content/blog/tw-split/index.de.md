---
title: "Ein verschlüsseltes TiddlyWiki in tausend undurchsichtige Dateien zerlegen"
slug: "tw-split"
date: 2026-11-07
description: "Warum ich die Ganz-Datei-Verschlüsselung von TiddlyWiki durch eine verschlüsselte Datei pro Notiz ersetzt habe und was ich dabei gelernt habe."
tags: [security, cryptography, tiddlywiki, privacy]
---

Jahrelang lagen meine privaten Notizen in einem einzigen passwortgeschützten TiddlyWiki auf GitHub Pages. Ein öffentliches Repository, das ein privates Notizbuch ausliefert, klingt seltsam, funktioniert aber, weil TiddlyWiki den ganzen Speicher mit dem Passwort verschlüsseln kann. Unangenehm wird es, sobald Bilder und ein paar Plugins dazukommen. Jeder Aufruf lädt und entschlüsselt Megabytes, und jedes Speichern schreibt die ganze Datei über die GitHub-API neu.

Also habe ich [tw-split](/projects/tw-split/) gebaut. In diesem Beitrag geht es um die Entscheidungen beim Entwurf, nicht um meine Notizen.

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

## Den Erweiterungspunkt nutzen statt den Core zu forken

Meine erste Idee war, die Verschlüsselung und den GitHub-Saver von TiddlyWiki zu patchen. Das wäre bei jedem Core-Update kaputtgegangen. Dann ist mir aufgefallen, dass TiddlyWiki schon eine öffentliche, versionierte Schnittstelle für „meine Tiddler liegen woanders“ hat: den **Syncadaptor**. Man implementiert `getSkinnyTiddlers`, `loadTiddler`, `saveTiddler` und `deleteTiddler`, um den Rest kümmert sich der Syncer. tw-enc-sync ist genau das, ein Syncadaptor, dessen Speicher eben ein Ordner voller Chiffretext ist.

## Ein Passwort, ein Datenschlüssel

Für jede einzelne Datei einen Schlüssel aus dem Passwort abzuleiten, wäre langsam und bringt nichts. Stattdessen entsperrt das Passwort einen winzigen Blob im normalen Verschlüsselungsformat von TiddlyWiki, der Entsperrdialog sieht also aus wie vorher. In diesem Blob steckt ein zufälliger 256-Bit-Datenschlüssel, aus dem HKDF getrennte Schlüssel für Dateiinhalte, Dateinamen und Manifest ableitet.

Nach dem Entsperren entfernt das Plugin den Schlüssel-Tiddler aus dem Speicher und aus dem Preload-Array des Boot-Kernels und wirft das Passwort weg, das TiddlyWiki im Speicher hält. Danach kann kein anderes Skript auf der Seite TiddlyWiki mehr dazu bringen, den Blob zu entschlüsseln.

## Auch Dateinamen verraten etwas

Verschlüsselung hilft wenig, wenn die Datei `passwoerter.tid` heißt. Bei tw-split liegt jede Datei unter `<12 hex>/<32 hex>.bin`, und beide Namen sind geschlüsselte HMACs von Kategorie und Titel. Inhalte werden auf feste Größenstufen aufgefüllt, eine zweizeilige Notiz sieht also aus wie eine mit zwanzig Zeilen. Von außen sichtbar bleiben die Anzahl der Dateien, ihre ungefähre Größe und wann ich committe. Das [Bedrohungsmodell](https://github.com/defec8edc0de/tw-split) zählt das alles auf.

## Das Repository als Gegner betrachten

Wer Zugriff auf ein Repository hat, kann es zurücksetzen oder Dateien vertauschen. Die Associated Data von AES-GCM bindet jede Datei an ihre ID und Revision, man kann einen Chiffretext also weder unter einem anderen Titel unterschieben noch eine alte Version einspielen. Das Manifest enthält den Hash jeder Datei und einen Zähler, der nur steigt. Hat ein Browser einmal Zähler *n* gesehen, lehnt er alles Ältere ab.

## Speichern ist ein einziger Commit

Änderungen werden ein paar Sekunden gesammelt und dann als **ein** Commit über die Git-Data-API geschrieben: Blobs, ein Tree auf Basis von `base_tree`, ein Commit und ein Fast-Forward des Branches. Hat zwischendurch jemand anderes gepusht, liest das Plugin den Branch neu, führt die Manifeste zusammen und versucht es noch einmal. Weil es auf `base_tree` aufbaut und nur seine eigenen Pfade schreibt, kann das Notizbuch im selben Repository liegen wie eine Website. Bei mir ist das diese Website.

## Was es nicht kann

Wenn dein Passwort erratbar ist, ist alles andere egal. Die Stage-1-Datei ist öffentlich, ein Angreifer kann also offline so schnell raten, wie seine Hardware es hergibt. Ich habe die Kosten der Schlüsselableitung weit über den Standard von TiddlyWiki angehoben, trotzdem schützt nur eine lange, zufällige Passphrase wirklich. Und wer `tw.html` verändern kann, kontrolliert den Code, der dein Passwort entgegennimmt. tw-split schützt gespeicherte Daten, aber nicht vor einer manipulierten Seite.

Den Code bereite ich gerade für die Veröffentlichung unter MIT-Lizenz vor, zusammen mit Bedrohungsmodell, Formatspezifikation und Testsuiten.
