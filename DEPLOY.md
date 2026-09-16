# Deploying cupsponsor to cup.junghard.com

Docker Compose on the VPS, behind the Caddy that is already there.

## Once, on the server

```bash
git clone <repo> /home/dev/cupsponsor && cd /home/dev/cupsponsor
mkdir -p volumes/data
```

The container runs as uid 1000, which is the first login user on a typical
Linux host — so a `volumes/data` created by that user is writable as-is. If
your user is not 1000, `sudo chown -R 1000:1000 volumes/data`. A bind mount
shadows whatever the image says about ownership and brings the host
directory's uid with it; get that wrong and sqlite fails with CANTOPEN.

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

Caddy lives in the outlive.lol stack (`~/Projects/Work/outlive.lol` locally) as
a container of its own, and it already has `host.docker.internal:host-gateway`
in its `extra_hosts`. That is how warhorn.app is routed, and this follows it.

Add to `outlive.lol/Caddyfile`:

```
cup.junghard.com {
	reverse_proxy host.docker.internal:3042
}
```

then, in the outlive.lol stack on the VPS:

```bash
docker compose up -d caddy          # picks up the mounted Caddyfile
```

Point `cup.junghard.com`'s DNS A record at the VPS first, or Caddy cannot get a
certificate for it.

Note the port is published on **all** interfaces, not `127.0.0.1`. It has to be:
`host.docker.internal` resolves to the bridge gateway, not the host's loopback,
so a container cannot reach a service bound only to `127.0.0.1`. That is the
same trade-off warhorn.app already makes on 3021.

If you would rather nothing were published at all, put this container on Caddy's
network instead and proxy to it by name:

```bash
docker network ls                                  # find outlive.lol's network
docker network connect <that-network> cupsponsor
```

```
cup.junghard.com {
	reverse_proxy cupsponsor:3000
}
```

and drop the `ports:` block from docker-compose.yml.

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
