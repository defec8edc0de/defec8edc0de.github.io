---
title: "tw-split"
date: 2026-11-07
description: "Encrypted storage for a TiddlyWiki on GitHub Pages, one AES-256-GCM file per note, loaded only when you open it."
tags: [security, cryptography, tiddlywiki, privacy]
featured: true
repo: "https://github.com/defec8edc0de/tw-split"
---

A password-protected TiddlyWiki makes a great private notebook until it gets big. Its built-in encryption turns the *whole* wiki, images and plugins included, into a single ciphertext. You download and decrypt all of it on every visit and rewrite all of it on every save.

**tw-split** breaks that file up. What's left is a small loader page plus **one AES-256-GCM encrypted file per tiddler**, with meaningless names, in a public GitHub Pages repository. The plugin that comes with it, **tw-enc-sync**, is an ordinary TiddlyWiki *syncadaptor*. At startup it loads an encrypted manifest, decrypts a note only when you open it, and saves your edits back as a single Git commit through the GitHub API. No server needed, and the TiddlyWiki core stays untouched.

{{< cast src="demo.cast" title="tw-split: migrating a demo wiki" cols=96 rows=26 idle=1.2 speed=1.1 poster="npt:0:14" >}}
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

## How it works

- **One password, one key.** Your password unlocks a tiny blob in TiddlyWiki's usual format. Inside is a random 256-bit data key, and HKDF derives separate keys for contents, file names and the manifest from it.
- **Nothing readable in the repo.** Paths look like `<12 hex>/<32 hex>.bin`, keyed HMACs of category and title. Titles, tags and folders never show up, and file sizes are padded.
- **Tamper-evident.** AES-GCM ties each file to its id and revision. The manifest records every file's hash and a counter that only goes up, so a browser that has seen a newer state won't accept a rollback.
- **Fast.** Only the manifest and the notes you open get downloaded. Images are decrypted when they're shown.
- **Several ways to save.** As a GitHub commit through the Git Data API, straight into a local folder (File System Access API), or as a zip of the changed files.
- **Careful defaults.** The token lives in session storage. Active HTML in notes is neutered. A plaintext export of the whole wiki is blocked. And the threat model is upfront about the limits: weak passwords, visible metadata like commit times, and the loader page itself.

## Status

My own private journal runs on it. I'm preparing it for an open-source release under the MIT licence, with the threat model, a format spec and the Python and JavaScript test suites. Please don't treat it as audited cryptography, and read the threat model first.
