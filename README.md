# cupsponsor

One coffee cup. One logo. A new photo every morning.

Every morning there is a photograph of a coffee cup. Whoever is holding the
highest bid at 07:30 Oslo time has their logo on it.

The site is one room. A dark kitchen before anyone else is up: window light
across a wooden table, dust in the beam, this morning's photograph framed on
the wall — and the cup itself, in 3D, centre of the table, wearing the current
sponsor's logo. Drag it to spin it. Everything else is chrome in the corners.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

With no environment set the site runs in **demo mode** — bids take the cup
immediately, no card, no money. That is the mode to build in.

## How a bid works

1. A sponsor uploads a logo and names a price above the standing bid.
2. Stripe authorises the card (`capture_method: "manual"`). It is a hold, not
   a charge.
3. The moment a higher bid is authorised, the previous hold is **cancelled** —
   the money goes straight back.
4. At 07:30 the standing hold is captured and the photo goes out.

There are no accounts. Everything on the page is public: the standing bid, the
sponsor list, the view counts.

```bash
# take the money from whoever is holding the cup — run it when the photo goes out
curl -X POST localhost:3000/api/admin/capture -H "Authorization: Bearer $ADMIN_TOKEN"
```

## The morning ritual

Copy the new photograph to `public/photo/today.jpg`. That is the whole ritual —
the photo hangs on the wall in the scene, so its framing is free. Shoot it
however you like.

## Layout

- `src/components/stage/` — the room. Wall, table and shadows are baked canvas
  textures rather than lights, because the shape of the light is what sells it
  and baking costs nothing. The shaft from the window is a few nested additive
  cones that fade where they turn away from the camera, with the dust hanging
  inside it; the steam is additive puffs that fade in and out over their life.
- `src/components/mug/` — the WebGL cup: lathe profile, tube handle, coffee,
  and the logo baked into a full-wrap texture. The wrap canvas is built to the
  band's own aspect ratio; get that wrong and every logo comes out stretched.
- `src/lib/auction.ts` — bids, holds and releases. The only file that decides
  who owns the cup.
- `src/app/terms/` and `src/app/privacy/` — the legal pages. Company details
  live in one place, `src/components/Legal.tsx`, and the rules modal and bid
  panel link to both.
- `src/app/api/` — spot, bid, confirm, upload, presence, stats, capture, webhook.
- `src/lib/db.ts` — SQLite. Swap this out for a hosted database before this
  runs anywhere serverless.

## Verifying a change

```bash
node scripts/shoot.mjs http://localhost:3000 shots/page.png 1440 950
node scripts/drive.mjs http://localhost:3000 scripts/fixtures/test-logo.png shots
```

`drive.mjs` opens the bid panel, uploads a logo, places a bid, reloads, and
fails loudly if the leader does not come back from the server. Look at the
shots — the logo has to be on the cup, unstretched, and the cup has to stay
visible while the panel is open.

## Known edges

- SQLite on local disk: fine for one machine, wrong for serverless.
- Logos are served straight from `public/logos` with no image processing, and
  SVG uploads are accepted as-is.
- The live viewer count is server-local; Plausible owns the historical numbers.
