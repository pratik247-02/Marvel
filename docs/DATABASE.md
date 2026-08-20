# Database Setup

The API talks to MongoDB through Mongoose. It runs against either a local
`mongod` or a MongoDB Atlas cluster — the only difference is the `MONGO_URI` in
`backend/.env`.

## Connection string

```bash
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/marvel?retryWrites=true&w=majority&appName=marvel
```

### What each part means

| Part | Meaning |
|---|---|
| `mongodb+srv://` | DNS seed-list scheme. Atlas uses this; a local server uses plain `mongodb://`. |
| `<user>:<password>` | A **database user**, created under Atlas → Database Access. This is not your Atlas login. |
| `<cluster>.mongodb.net` | Cluster hostname, from Atlas → Connect → Drivers. |
| `/marvel` | **The database name.** Omit it and everything silently lands in a database called `test`. |
| `retryWrites=true` | Retries a write once if it fails from a transient network blip or primary election. |
| `w=majority` | A write is acknowledged only once a majority of replica-set members have it, so it survives failover. |
| `appName=marvel` | A label shown in Atlas metrics and server logs. Cosmetic, but makes it obvious which app a connection belongs to. |

### The two easy mistakes

**Forgetting `/marvel`.** Atlas hands you a string ending in `.mongodb.net/?retryWrites=...`
with no database name. The `/marvel` goes between `.net` and the `?`. Without it
your collections are created in `test`, alongside anything else on that cluster.

**Unencoded passwords.** If the password contains a reserved character it must be
percent-encoded or the URI fails to parse:

| Character | Encode as |
|---|---|
| `@` | `%40` |
| `#` | `%23` |
| `/` | `%2F` |
| `:` | `%3A` |
| `?` | `%3F` |
| `%` | `%25` |

Atlas's **Autogenerate Secure Password** produces alphanumeric passwords, which
avoids the issue entirely.

## Atlas setup

1. **Database Access** → *Add New Database User* → Password auth → Autogenerate
   the password and copy it (Atlas will not show it again) → privileges
   *Read and write to any database*.
2. **Network Access** → *Add IP Address*. Use your current IP, or `0.0.0.0/0`
   for development and for platform hosts that connect from rotating addresses.
3. **Database → Connect → Drivers → Node.js** → copy the string, then apply the
   two edits above.

Note that a cluster's hostname is permanent — Atlas has no rename. The name that
shows up in the app and in the Atlas UI is the *database* (`marvel`), not the
cluster.

## Local MongoDB

```bash
MONGO_URI=mongodb://localhost:27017/marvel
```

No credentials needed for a default local install. Useful for offline work and
for running the seed without touching the cloud data.

## Seeding

```bash
npm run seed:dry     # report what would change, write nothing
npm run seed         # upsert the dataset
npm run seed:fresh   # wipe the collections first, then seed
```

Or target a database explicitly, bypassing `.env`:

```bash
node scripts/seed.js --uri "mongodb+srv://user:pass@cluster.mongodb.net/marvel"
```

The seed is **idempotent** — entities are upserted on a natural key, so repeated
runs converge on the same state instead of duplicating rows.

Relations are resolved in **two passes**. The data is circular (Tony references
Steve, Steve references Tony), so no single-pass insert order exists. Pass 1
upserts every entity without its relations, minting ids; pass 2 maps the slug
keys onto those ids and patches them in with a batched `bulkWrite`.

### Current dataset

| Collection | Documents |
|---|---|
| `characters` | 18 |
| `movies` | 9 |
| `artifacts` | 9 |
| `battles` | 9 |
| `teams` | 3 |

That yields 105 character edges — the graph the Connection Engine traverses.

## Safety

`backend/.env` is gitignored and must never be committed. `backend/.env.example`
holds the shape of the file with no real values, and is the one that is tracked.
