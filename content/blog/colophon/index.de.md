---
title: "Kolophon: Wie diese Website gebaut ist"
slug: "colophon"
date: 2026-11-08
description: "Statisches HTML, keine Cookies, keine Tracker und ein verschlüsseltes Notizbuch, das gleichzeitig mein CMS ist."
tags: [meta, hugo, security]
---

Die Technik hinter dieser Website ist absichtlich langweilig. Der Spaß steckt in ein paar Details obendrauf.

## Nur statische Dateien

Jede Seite ist schlichtes HTML. [Hugo](https://gohugo.io) erzeugt es aus Markdown und ein paar YAML-Dateien, und ein GitHub-Actions-Workflow baut die Seite neu, sobald ich etwas pushe. Der Workflow lädt eine fest eingestellte Hugo-Version, prüft die Prüfsumme, durchsucht die Quellen nach unsichtbarem Unicode und baut erst dann und veröffentlicht auf GitHub Pages.

Es gibt keinen Server, keine Datenbank, kein Login und kein Formular, also auch wenig anzugreifen. Außerdem hat jede Seite eine strikte Content Security Policy: Skripte nur von dieser Domain, keine Inline-Skripte, kein `eval`.

Schriften ([Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont/) und JetBrains Mono) und Skripte kommen von hier, dein Browser redet also mit niemand anderem. Keine Cookies, keine Statistik. Gespeichert wird nur deine Darstellungswahl, und zwar in deinem eigenen Browser.

## Tag und Nacht

Es gibt zwei Darstellungen. Noir ist die dunkle, Daylight eine ruhigere helle auf Basis der hellen GitHub-Farben, gemacht für längeres Lesen. Im Automatikmodus richtet sich die Seite nach deiner Uhrzeit: hell von 7 bis 19 Uhr, sonst dunkel. Neu geprüft wird nur, wenn du zum Tab zurückkommst, damit nichts mitten im Absatz umspringt. Mit dem Knopf oben schaltest du zwischen automatisch, Tag und Nacht.

## Mein Notizbuch ist das CMS

Irgendwo auf dieser Seite liegt ein verschlüsseltes TiddlyWiki, mein privates Journal, gebaut auf [tw-split](/projects/tw-split/). Dort schreibe ich auch. Wenn eine Notiz öffentlich werden soll, markiere ich sie, sehe mir eine Vorschau genau dessen an, was veröffentlicht wird, bestätige, und sie landet hier als Markdown. Hugo übernimmt sie beim nächsten Build. Alles andere bleibt verschlüsselt.

## Kleinigkeiten

`⌘K`, `Strg K` oder `/` öffnen eine Befehlspalette. Terminal-Aufnahmen laufen in einem selbst gehosteten [asciinema](https://asciinema.org)-Player. Und ja, du darfst gern in den Quelltext schauen.
