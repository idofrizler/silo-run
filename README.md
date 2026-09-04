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
- `E`: talk to residents and inspect quest objects
- `Space`: jump
- `R`: respawn
- `Esc`: release the mouse

On touch devices, use the left joystick to move, drag the 3D view to look
around, pinch to zoom, and use the ACT and JUMP buttons on the right.

Select a named location in the floor menu, then use the button in its detail
card to teleport directly to that floor.

Open the quest tracker to view and select every available quest. **The
Forbidden Relic** begins with Mara on Level 67, **They’re Good in Supply**
begins with Walker on Level 144, and **The Silo's Heart** begins with Shirley on
Generator Level 145. Their starting NPCs are marked with question marks, and
each quest can be completed independently. Mara's trail explicitly begins in
the Gardens on Level 66 before leading to Judicial's relic holding. Walker sends
you to recover GOOD tape from Supply and deliver it to Sheriff's Holding 3
before a prisoner is sent out to clean. Shirley sends you into The Digger on
Level 147 for an original bearing needed to steady the Generator.

At **The Gap**, use the scaffold interaction near Level 90 or Level 92 to cross
the missing stair section safely.

At the bottom of the Great Stair, use the marked service lifts to travel from
Level 144 to the Generator and onward to the Digger. The same lifts return
upward. In The Digger, the quest bearing remains a challenging jump onto the
drill blade. If you fall into the water, use the marked maintenance ladder at
the platform edge to climb back up.

Silo Run is currently locked to **Silo 18**. The flooded Silo 17 scene is
disabled so its controls and rendering cannot interrupt gameplay.

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
