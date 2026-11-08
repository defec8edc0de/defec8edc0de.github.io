---
title: "Splitting an encrypted TiddlyWiki into a thousand opaque files"
slug: "tw-split"
date: 2026-11-07
description: "Why I replaced TiddlyWiki's whole-file encryption with one encrypted file per note, and what I learned along the way."
tags: [security, cryptography, tiddlywiki, privacy]
---

For years my private notes lived in a single password-protected TiddlyWiki on GitHub Pages. A public repository serving a private notebook sounds odd, but it works, because TiddlyWiki can encrypt its whole store with your password. It stops being fun once the wiki carries images and a few plugins. Every visit downloads and decrypts megabytes, and every save rewrites the whole file through the GitHub API.

So I built [tw-split](/projects/tw-split/). This post is about the design decisions. It's not about my notes.

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

## Use the extension point, don't fork the core

My first idea was to patch TiddlyWiki's encryption and its GitHub saver. That would break with every core update. Then I noticed that TiddlyWiki already has a public, versioned interface for "my tiddlers live somewhere else": the **syncadaptor**. You implement `getSkinnyTiddlers`, `loadTiddler`, `saveTiddler` and `deleteTiddler`, and the syncer handles everything else. tw-enc-sync is exactly that, a syncadaptor whose backend happens to be a folder full of ciphertext.

## One password, one data key

Deriving a key from the password for every single file would be slow and gains nothing. Instead, the password unlocks a tiny blob in TiddlyWiki's normal encrypted format, so the unlock prompt looks the same as before. Inside that blob is a random 256-bit data key, and HKDF turns it into separate keys for the file contents, the file names and the manifest.

Once the wiki is unlocked, the plugin removes the key tiddler from the store and from the boot kernel's preload array, and throws away the password TiddlyWiki keeps in memory. After that, no other script on the page can ask TiddlyWiki to decrypt the blob again.

## File names leak too

Encryption doesn't help much if the file is called `passwords.tid`. In tw-split every file lives at `<12 hex>/<32 hex>.bin`, and both names are keyed HMACs of the category and the title. File contents are padded to fixed size steps, so a two-line note looks the same as a twenty-line one. What you can still see from the outside is the number of files, their rough sizes and when I commit. The [threat model](https://github.com/defec8edc0de/tw-split) lists all of that.

## Assume the repository is hostile

Anyone with access to a repository can roll it back or swap files around. AES-GCM's associated data ties every file to its id and revision, so you can't move a ciphertext under another title or replay an old version. The manifest lists the hash of every file and has a counter that only goes up. Once a browser has seen counter *n*, it refuses anything older.

## Saving is a single commit

Edits are collected for a few seconds and then written as **one** commit through the Git Data API: blobs, a tree based on `base_tree`, a commit, and a fast-forward of the branch. If someone else pushed in the meantime, the plugin re-reads the branch, merges the manifests and tries again. Because it builds on `base_tree` and only ever writes its own paths, the notebook can live in the same repository as a website. In my case, this website.

## What it can't do

If your password can be guessed, none of this matters. The stage-1 file is public, so an attacker can try passwords offline as fast as their hardware allows. I raised the key derivation cost far above TiddlyWiki's default, but a long random passphrase is still the only real protection. And whoever can change `tw.html` controls the code that receives your password. tw-split protects your data at rest; it can't protect you from a compromised page.

I'm getting the code ready for release under the MIT licence, together with the threat model, the format spec and the test suites.
