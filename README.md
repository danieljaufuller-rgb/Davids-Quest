# David's Quest — A Bible Adventure

A free, kid-friendly (ages 7–14) 2D pixel platformer telling the story of
David the shepherd (1 Samuel 16–17). Run, jump, collect manna and scripture
scrolls (KJV), and face the lion, the bear, and Goliath across three worlds
and nine levels.

## Controls
| Action | Keys |
|---|---|
| Move | ← → or A D |
| Jump (hold = higher) | Z, Space, ↑, or W |
| Sling stone (after power-up) | X or K |
| Pause | P |
| Mute | M |
| Confirm | Enter |

## Run locally
    python -m http.server 8080
    # then open http://localhost:8080
(Any static server works; ES modules do not load from file://.)

## Tests
    node --test tests/

## Deploy
Static site, no build step. On Cloudflare Pages: connect the repo,
leave the build command empty, set output directory to `/`.

## Tech
Vanilla JavaScript (ES modules) + Canvas 2D. All art is original
programmatic pixel data; all audio is WebAudio oscillators. Zero
dependencies, zero asset files. Scripture quotations: King James Version
(public domain).
