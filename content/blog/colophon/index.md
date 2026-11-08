---
title: "Colophon: how this site is built"
slug: "colophon"
date: 2026-11-08
description: "Static HTML, no cookies, no trackers, and an encrypted notebook that doubles as my CMS."
tags: [meta, hugo, security]
---

The infrastructure behind this site is boring on purpose. The fun is in a few details on top.

## Just static files

Every page is plain HTML. [Hugo](https://gohugo.io) generates it from Markdown and a handful of YAML files, and a GitHub Actions workflow rebuilds the site whenever I push. The workflow downloads a pinned Hugo release, checks its checksum, scans the sources for invisible Unicode and only then builds and deploys to GitHub Pages.

There's no server, no database, no login and no form, so there isn't much to attack. Every page also ships a strict Content Security Policy: scripts only from this domain, no inline scripts and no `eval`.

Fonts ([Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont/) and JetBrains Mono) and scripts are served from here, so your browser never talks to anyone else. No cookies, no analytics. The only thing stored is your theme choice, in your own browser.

## Day and night

There are two themes. Noir is the dark one. Daylight is a calmer light theme based on GitHub's light colours and tuned for longer reading. On auto, the site follows your local time: light from 7:00 to 19:00, dark otherwise. It only checks again when you come back to the tab, so it won't flip on you halfway through a paragraph. The button at the top switches between auto, day and night.

## My notebook is the CMS

Somewhere on this site lives an encrypted TiddlyWiki, my private journal, built on [tw-split](/projects/tw-split/). It's also where I write. When a note is ready to go public, I tag it, look at a preview of exactly what will be published, confirm, and it lands here as Markdown. Hugo picks it up on the next build. Everything else stays encrypted.

## Small things

Press `⌘K`, `Ctrl K` or `/` for a command palette. Terminal recordings play in a self-hosted [asciinema](https://asciinema.org) player. And yes, feel free to read the page source.
