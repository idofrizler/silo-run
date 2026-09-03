# Silo Run

A game layer running directly on Charly Delaroche's mirrored public interactive
Silo 18 visualization.

## Two builds

| Build | Source | Silo geometry | Published? |
| --- | --- | --- | --- |
| **Full** (`npm start`) | `src/original-game.js` | Charly Delaroche's authored scene, mirrored locally into `site/` | Yes — GitHub Pages, copied to `docs/` |
| **Prototype** | `src/main.js`, `world.js`, `player.js` | Our own from-scratch approximation | Local at `/prototype/` |

The full build is deployed publicly. The generated `site/` working directory is
gitignored; `npm run build:pages` builds it and copies the resulting static site
into the tracked `docs/` directory used by GitHub Pages.

Animated residents patrol the current neighborhood and nearby levels, avoiding
the authored walls and recycling around the player as they travel through the
Silo.

## Run

```sh
npm install
npm run mirror
npm start
```

Open <http://127.0.0.1:4173>.

The generated visualization under `site/` is intentionally excluded from this
repository. Each local checkout must create its own reference copy with
`npm run mirror` before the first launch.

Controls:

- `WASD` or arrow keys: move
- Mouse: aim the camera and movement direction
- Mouse wheel: zoom the camera in and out
- `Shift`: toggle walking/running
- `Space`: jump
- `R`: respawn
- `Esc`: release the mouse

The previous simplified prototype remains available at
<http://127.0.0.1:4173/prototype/>.

To refresh that private reference copy:

```sh
npm run mirror
```

## Character asset

The animated adventurer is from Quaternius' [Ultimate Modular Men
Pack](https://quaternius.com/packs/ultimatemodularcharacters.html), released
under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The
original primitive character remains in the game as a loading/error fallback.

## Publishing the full game

```sh
npm run build:pages
```

Rebuilds the full game under `site/`, then copies the complete static artifact
to `docs/` with `.nojekyll`. GitHub Pages serves it from the `main` branch
`/docs` folder. All asset paths are relative, so it works unchanged under the
`/silo-run/` base path.
