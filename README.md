# cupsponsor

One coffee cup. One logo. A new photo every morning.

Every morning there is a photograph of a coffee cup. Whoever is holding the
highest bid at 07:30 Oslo time has their logo on it. The site renders that in
3D: the morning photo is real, the white mug on top of it is a WebGL object,
and the sponsor's logo is wrapped around its curve.

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

The photo changes daily, so the 3D mug has to be re-pinned to it daily.

1. Shoot the cup **whole** — the entire mug in frame, nothing cropped by the
   edge. That is the ad space; a cropped cup is a cropped logo.
2. Open `/calibrate`, drop the new photo in, and drag the sliders until the
   white cup covers the real one with nothing peeking out. Ghost the cup with
   the opacity slider to check the edges.
3. Copy the block it prints into `src/lib/scene.ts`.
4. Copy the photo to `public/photo/today.jpg`.

`src/lib/scene.ts` is the only place the placement lives. It maps normalised
photo coordinates (`u` across, `v` down) to a world position along the camera
ray, so the mug lands on the same pixels at every viewport size.

## Layout

- `src/lib/scene.ts` — where the cup sits on the photo, and the maths for it.
- `src/components/mug/` — the WebGL cup: lathe profile, handle, coffee, and the
  logo baked into a full-wrap texture.
- `src/lib/auction.ts` — bids, holds and releases. The only file that decides
  who owns the cup.
- `src/app/api/` — spot, bid, confirm, upload, presence, stats, capture, webhook.
- `src/lib/db.ts` — SQLite. Swap this out for a hosted database before this
  runs anywhere serverless.

## Verifying a change

```bash
node scripts/shoot.mjs http://localhost:3000 shots/page.png 1440 950
node scripts/drive.mjs http://localhost:3000 scripts/fixtures/test-logo.png shots
```

`drive.mjs` uploads a logo, places a bid, reloads, and fails loudly if the
leader does not come back from the server. Look at the shots — the cup has to
cover the real one.

## Known edges

- SQLite on local disk: fine for one machine, wrong for serverless.
- Logos are served straight from `public/logos` with no image processing.
- The live viewer count is server-local; Plausible owns the historical numbers.
