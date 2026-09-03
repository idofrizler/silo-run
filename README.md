# Silo Run

A private game layer running directly on Charly Delaroche's mirrored public
interactive Silo 18 visualization.

## Two builds

| Build | Source | Silo geometry | Published? |
| --- | --- | --- | --- |
| **Full** (`npm start`) | `src/original-game.js` | Charly Delaroche's authored scene, mirrored locally into `site/` | **No** — local only |
| **Prototype** (`npm run build:pages`) | `src/main.js`, `world.js`, `player.js` | Our own from-scratch approximation | Yes — GitHub Pages, `docs/` |

Only the prototype is deployed publicly, because it contains none of the
upstream visualization. The mirrored `site/` directory is third-party work with
no license attached, so it is gitignored and must never be committed or
published. The full build stays on your machine.

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

The mirrored visualization under `site/` is intentionally excluded from this
repository. Each private local checkout must create its own reference copy with
`npm run mirror` before the first launch.

Controls:

- `WASD` or arrow keys: move
- Mouse: aim the camera and movement direction
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

The files under `site/` are third-party compiled code and remain subject to
their original copyright. Keep them private unless the creator grants
permission.

## Character asset

The animated adventurer is from Quaternius' [Ultimate Modular Men
Pack](https://quaternius.com/packs/ultimatemodularcharacters.html), released
under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The
original primitive character remains in the game as a loading/error fallback.

## Publishing the prototype

```sh
npm run build:pages
```

Rebuilds `docs/` (bundled JS, HTML, CSS, `.nojekyll`). GitHub Pages serves it
from the `main` branch `/docs` folder. All asset paths are relative, so it works
unchanged under the `/silo-run/` base path.
