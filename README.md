# defec8edc0.de

My personal site: portfolio, resume and blog. Built with [Hugo](https://gohugo.io) by GitHub Actions and served by GitHub Pages. Static, no cookies, no third-party requests.

There are two ways to change things:

1. **Blog posts** come straight from my encrypted notebook (the vault). See [Publishing from the vault](#publishing-from-the-vault). The vault also works fully locally, see [Using the vault locally](#using-the-vault-locally-with-or-without-github).
2. **Everything else** is Markdown and YAML in this repository. Edit it on github.dev (press `.` on the repo page) or locally, then commit. See [Editing by hand](#editing-by-hand).

Every push to `master` rebuilds the site, which takes about a minute. That includes the vault's own saves.

---

## Publishing from the vault

The vault is at **https://defec8edc0.de/vault/tw.html**. You can also get there via the lock icon in the footer or with `⌘K → unlock vault`.

### One-time setup

In the vault: *Control Panel → Saving → GitHub* → paste a **fine-grained token** limited to this repository, with *Contents: read & write* and *Metadata: read*. The token is kept for this browser tab only.

### Publish a post

1. Write a note as usual. Markdown is the default; WikiText works too if it converts cleanly.
2. Press the **globe** button in the note's toolbar. If the note isn't a blog post yet, you're asked once whether to make it one. That only adds the tag `publish:blog`.
3. A **preview** shows the exact Markdown that becomes public, and where (`content/blog/<slug>/index.md`). Check it and press **Publish…**, then confirm the browser dialog.
4. About a minute later the post is live at `/blog/<slug>/`. A bar under the note now shows the link plus **Update…** and **Unpublish…**.

To change a published post, edit the note and press **Update…** in that bar (or the globe again). It shows a fresh preview and publishes the new version.

### What's filled in automatically

| On the website | Comes from |
|---|---|
| Title | the note's title |
| Date | when the note was created |
| "Updated" date | when the note was last modified |
| Description (lists, search engines) | your first real paragraph |
| URL `/blog/<slug>/` | made from the title, then fixed after the first publish |
| Reading time | calculated by Hugo |
| Blog list, RSS feed, ⌘K search | automatic |

### Optional: the "Blog post" panel

When you edit a note tagged `publish:blog`, a **Blog post** panel appears below the tags:

| Panel field | Note field | What it does |
|---|---|---|
| Summary | `summary` | Description instead of the first paragraph |
| Post tags | `publish-tags` | Tags shown on the post (`kubernetes cloud`, `[[two words]]`). Your vault tags are **never** published |
| Language | `publish-lang` | `en` (default) or `de` (goes to `index.de.md`, shown under `/de/blog/…`) |
| URL | `publish-slug` | Your own slug; fixed after the first publish |
| Images | `publish-media` | Extra images not used in the text (rarely needed) |

### Images, links, languages

- **Images:** import a PNG, JPEG or WebP into the vault (drag and drop) and use it in the text as `![alt text](#Image title)` or `[img[Image title]]`. It's published next to the post automatically. Links to external images are refused, because the site only shows its own images.
- **Links:** `[[Other note]]` becomes a link if that note is published as well. Otherwise it's plain text, so private titles only appear if you wrote them yourself. Normal web links work as usual.
- **German and English versions:** use two notes with the same *URL* slug and set *Language* to Deutsch on the German one. The site links them through the language switch.

### What gets refused, and why

The publisher refuses, outside code blocks:

- transclusions `{{…}}`
- macros `<<…>>`
- widgets `<$…>`
- raw HTML
- invisible or bidi-control Unicode

These could pull private notes into a post or hide content. If a preview is refused, the message says exactly what was found. Code blocks may contain anything.

### Unpublish

Press **Unpublish…** in the bar under the note. The post disappears on the next build. It stays in the git history, so treat anything you once published as public for good.

---

## Using the vault locally (with or without GitHub)

The vault is just files: `tw.html` plus the encrypted `m/` and hex-named folders. You don't need GitHub or a web server to use it. Open it straight from disk, keep the folder anywhere (a git checkout, Dropbox, a USB stick), and publish to GitHub only when you want to, or never.

### Open it from disk (Windows, Chrome)

Browsers normally don't let a local HTML file read its neighbouring files. Start Chrome with a separate profile and file access allowed:

```bat
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --user-data-dir=%TEMP% --allow-file-access-from-files C:\path\to\vault\tw.html
```

- Point the last argument at **your** `tw.html`, e.g. `C:\Users\you\Dropbox\tiddly\tw.html`, or `vault\tw.html` in a checkout of this repository. Other Chrome installs live under `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- `--user-data-dir=%TEMP%` gives that window its own throwaway profile, so the relaxed file access never touches your normal browser. Use that window only for the vault, not for general browsing.
- Unlock with your password as usual.

On Linux/macOS: `google-chrome --user-data-dir=/tmp/vault-profile --allow-file-access-from-files /path/to/vault/tw.html`.

### Where saves go: the save targets

The tiddler `$:/config/ext/enc/SaveTarget` holds a comma-separated list of `github`, `folder` and `zip`. Change it in the vault; it takes effect immediately. If it's empty, the default depends on how you opened the vault:

| Opened from | Default target |
|---|---|
| `https://…` (the website) | `github` |
| `file://…` in Chrome/Edge | `folder` |
| `file://…` in Firefox/Safari | `zip` |

**Ctrl+S**, *Save* and the cloud button write to *all* configured targets. A failing target doesn't stop the others.

#### `folder`: save straight into the folder (Chrome/Edge)

1. Press **Ctrl+S** once. Chrome asks for a folder: pick the folder that contains `tw.html`. Other folders are refused, and an empty one only after you confirm.
2. From then on, every save writes the changed encrypted files and the new manifest right there, and the auto-save does too, a few seconds after you stop typing. Chrome remembers the permission; if it forgets, the next Ctrl+S asks again.
3. Files are written first and the manifest last, so an interrupted save leaves the previous state intact.

#### `zip`: the download saver (any browser)

1. Every **Ctrl+S** downloads `tw-update-<number>.zip`. It contains only what changed since the last save, plus the new manifest and a `_remove.txt` listing files to delete. Auto-save never creates zips; you decide when.
2. To apply one, extract it **into the vault folder** and allow overwriting. Then delete the files listed in `_remove.txt`, and finally `_remove.txt` itself. In PowerShell, in the vault folder:
   ```powershell
   Get-Content _remove.txt | ForEach-Object { Remove-Item -LiteralPath $_ -ErrorAction SilentlyContinue }; Remove-Item _remove.txt
   ```
   On Linux/macOS: `xargs -d '\n' rm -f < _remove.txt && rm _remove.txt`
3. **Apply the zips in order and don't skip one.** Each builds on the previous one. Applying `tw-update-12.zip` without `tw-update-11.zip` leaves the folder inconsistent.
4. If you lose a zip, create a full copy: open the browser console (F12) in the vault and run `$tw.encSync.saveLocal($tw.encTargets.sinks.zip, {full: true})`. That downloads one zip with every file, which you extract over a fresh copy of the folder.

### Getting local changes online (optional)

- **With a token:** press **Publish to GitHub now**, the second button in the page controls. It makes the repository match your local state in a single commit, uploading changed files and removing deleted ones. It never touches `tw.html` or anything outside the vault's own files.
- **Without a token:** if the vault folder is `vault/` in a checkout of this repository, saving with `folder` writes into the git working copy. Then just `git add vault && git commit && git push`, and the site rebuilds as usual.
- **Never:** that works too. The vault runs fine fully offline with `folder` or `zip`.

Two rules:

- **One writer at a time.** If you edit locally and online, publish or pull in between. Two copies that both saved several times without syncing can overwrite each other's changes.
- Blog publishing (the globe button) always talks to GitHub, so it needs the token and a connection, even when the vault is opened locally.

All details: [`docs/DEPLOY.md`](https://github.com/defec8edc0de/tw-split/blob/main/docs/DEPLOY.md) in tw-split.

---

## Editing by hand

All of these work on github.dev. Commit, and the site rebuilds.

### Pages and posts

| What | File(s) |
|---|---|
| Home page hero and quotes | `i18n/en.yaml` / `i18n/de.yaml` (`hero_*`), `data/transmissions.yaml` |
| About | `content/about.md` / `content/about.de.md` |
| Resume intro | `content/resume.md` / `content/resume.de.md` |
| Teaching intro | `content/teaching.md` / `.de.md` |
| Contact | `content/contact.md` / `.de.md` |
| Impressum & privacy | `content/impressum.de.md` (legally binding) and `content/impressum.md` |
| Blog post by hand | new folder `content/blog/<slug>/` with `index.md` (+ `index.de.md`), images next to it |
| Project | new folder `content/projects/<slug>/` with `index.md` (+ `.de.md`), optional `cover.jpg`, `featured: true` puts it on the home page |

A hand-written post looks like this:

```markdown
---
title: "My post"
date: 2026-11-20
description: "One sentence for lists and search engines."
tags: [kubernetes, cloud]
---

Text in Markdown. Images: ![alt](picture.png) with picture.png in the same folder.
```

German version: `index.de.md` in the same folder. Use the same front matter and translate the text.

### Data files (resume, teaching, etc.)

Text in data files has an `en:` and a `de:` version.

| What | File |
|---|---|
| Jobs (newest first) | `data/experience.yaml` |
| Education | `data/education.yaml` |
| Skills, languages | `data/skills.yaml` |
| Cloud & Kubernetes platforms, review cards | `data/platforms.yaml` |
| Trainings ("upcoming"/"past" is automatic from the dates) | `data/trainings.yaml` |
| Publications | `data/publications.yaml` (files in `static/assets/files/publications/`) |
| Posts on other sites (Insinuator) | `data/external_posts.yaml` |
| Profile links (footer, contact) | `data/socials.yaml` |
| Colours of both themes | `data/tokens.yaml` |
| Site-wide settings (day/night hours, e-mail, career start year) | `hugo.toml` → `[params]` |

### Extras

- **Terminal recording:** put a `.cast` file in a page folder and write `{{</* cast src="demo.cast" title="…" */>}}`.
- **AI-agent canaries:** `data/canaries.yaml` explains how to arm them (create tokens on canarytokens.org, paste the URLs, set `params.canaries.enabled = true`).

### Previewing locally (optional)

```bash
hugo server -D                                   # live preview at http://localhost:1313 (without the vault)
HUGO=hugo scripts/build.sh && python3 -m http.server 8765 -d public   # exactly as deployed, incl. /vault/
```

The build fails on purpose if invisible or bidi-control Unicode shows up anywhere in the sources.

---

## Don't touch

`vault/` holds the encrypted notebook ([tw-split](https://defec8edc0.de/projects/tw-split/)):

- `vault/tw.html` is the loader.
- `vault/m/` holds the manifest.
- The hex-named folders hold one encrypted file per note.

The notebook commits to these files itself. The build copies them unchanged and checks them byte for byte. Only `vault/tw.html` is ever replaced by hand, when the plugin is updated (`twmigrate.py restage --repo-base vault/`). Design notes and rules for working on this repository are in `CLAUDE.md`.
