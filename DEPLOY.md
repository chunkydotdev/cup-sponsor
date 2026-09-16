# Deploying cupsponsor to cup.junghard.com

Docker Compose on the VPS, behind the Caddy that is already there.

## Once, on the server

```bash
git clone <repo> /home/dev/cupsponsor && cd /home/dev/cupsponsor
mkdir -p volumes/data
```

`volumes/data` holds the whole of the mutable site: the auction database, the
uploaded sponsor logos and the morning photographs. It seeds itself from the
image the first time it starts, so there is nothing to copy across.

Then write `/home/dev/cupsponsor/.env` — Compose reads it for both the build
args and the runtime environment:

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_TOKEN=<the long random string>
```

`NEXT_PUBLIC_*` is inlined into the browser bundle at build time, not read at
runtime. Change one and you must rebuild, not just restart.

## Bring it up

```bash
docker compose up -d --build
docker compose logs -f cupsponsor
```

It listens on `127.0.0.1:3042`, deliberately unreachable from outside.

## Caddy

If Caddy runs **on the host**, add to the Caddyfile:

```
cup.junghard.com {
    reverse_proxy 127.0.0.1:3042
}
```

If Caddy runs **in a container** it cannot see the host's loopback. Put the two
containers on one network instead:

```bash
docker network connect <caddy-network> cupsponsor   # docker network ls to find it
```

and point Caddy at the container by name, no published port needed:

```
cup.junghard.com {
    reverse_proxy cupsponsor:3000
}
```

Then `docker compose exec -w /etc/caddy <caddy-container> caddy reload`.

## Stripe, in production

The Stripe CLI only forwards to a local machine, so production needs a real
endpoint: Stripe dashboard → Developers → Webhooks → add
`https://cup.junghard.com/api/stripe/webhook`, listening for
`payment_intent.amount_capturable_updated`. Put the signing secret in `.env` as
`STRIPE_WEBHOOK_SECRET` and restart.

Without it the site still works — the browser calls `/api/bid/confirm` itself —
but a bid whose browser dies mid-confirm would sit as `pending` and never take
the cup.

## The morning photo

```bash
scp this-morning.jpg dev@vps:/home/dev/cupsponsor/volumes/data/photo/today.jpg
scp yesterday.jpg    dev@vps:/home/dev/cupsponsor/volumes/data/photo/gallery/2026-09-19.jpg
```

No restart, no rebuild. The page reads the folder on every request and the
files are served straight off the volume by `/api/media`.

They deliberately do **not** go in `public/`: Next serves that from a manifest
built at compile time, so a photograph dropped in there would be listed by the
page and then 404 — a blank frame on the wall.

## 20 September, when bidding closes

```bash
curl -X POST https://cup.junghard.com/api/admin/capture \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

That captures the standing hold — the only moment any money actually moves.
Every losing hold was already cancelled the second it was doubled.

## Updating

```bash
git pull && docker compose up -d --build
```

The volumes are outside the image, so bids, logos and photographs survive.

## Backing up the auction

```bash
tar czf ~/cupsponsor-backup-$(date +%F).tgz volumes/data
```

That is the auction, the logos and every photograph. Treat it that way.
