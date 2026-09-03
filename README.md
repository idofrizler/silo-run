# Silo Run

A private game layer running directly on Charly Delaroche's mirrored public
interactive Silo 18 visualization.

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
