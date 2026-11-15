# Duskline Courier

A complete original browser game for the make.fun best-game-01 bounty.

You fly a courier drone over a night city at dusk. Parcels wait at glowing
rooftop pads; pick one up, race its countdown to the destination pad, and
bank the payout. Deliveries made on time build a combo multiplier up to
five times. Red traffic drones cross the sky in steady lanes — three
crashes end the night. Complete twelve deliveries to win the night before
dawn.

Controls: WASD or arrow keys to fly, hold the mouse button to steer toward
the pointer, Space to boost, P to pause, M to mute. Enter starts, R
restarts. Every sound is synthesized in the browser; the game loads no
network resource and needs no build step.

Layout: `game/` holds the playable game (`index.html` plus one-job source
files under `src/`), `screenshots/` holds four real renders of the game,
`main.ts` hands the game in by copying both directories to the output and
writing `dossier.json` with the kit's dossier builder, and `vendor/`
holds the kit's dossier library unchanged.
