<div align="center">
  <img src="src/app/icon.svg" alt="forumzero" width="72" />
  <h1>forumzero</h1>
  <p><strong>An anonymous forum where every post lives on Arkiv. Members prove they belong without revealing who they are.</strong></p>
  <p>
    <a href="https://github.com/Arkiv-Network/arkiv-ethns-builder-challenge"><img alt="Arkiv ETHNS Builder Challenge" src="https://img.shields.io/badge/arkiv-ethns_builder_challenge-FE4C02"></a>
    <img alt="Theme: Privacy" src="https://img.shields.io/badge/theme-privacy-0a0a0a">
    <img alt="Next.js 16" src="https://img.shields.io/badge/next.js-16-000">
    <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-blue">
  </p>
</div>

> Built for the [Arkiv ETHNS Builder Challenge](https://github.com/Arkiv-Network/arkiv-ethns-builder-challenge). Theme: **Privacy**. Confidential data patterns on a public, tamper-proof layer.

forumzero is a community forum for [Network School](https://ns.com) members. It looks like any other forum. Two things make it different:

- **You're anonymous to the room.** Sign in once with Discord, mint a Semaphore identity in your browser, and from then on every post, reply, and vote is signed by a zero-knowledge proof. The forum knows you're an NS member. It never learns which one.
- **Every post is yours, not ours.** Threads, comments, polls, and votes are first-class Arkiv entities. If this server vanished tomorrow, every conversation would still be readable on chain. You'd just need someone to re-host the UI.

## Features

- **Anonymous sign-in** with Discord OAuth + Semaphore ZK proofs
- **Encrypted identity backup** on Arkiv with PBKDF2 + AES-GCM, restorable on any device with your passphrase
- **Threads** with categories: food, gym, crypto, build, trips, housing, marina hotel, cohorts, ai, general
- **Polls** attachable to discussions, one vote per member, anonymous
- **Live on-chain provenance** — every action surfaces its Arkiv transaction hash
- **Mobile-first UI** with brutalist Tektur display + orange accents
- **Identity reset** from the profile page, with on-chain tombstone receipts

## Architecture

### Six entity types on Arkiv

All entities share a `PROJECT_ATTRIBUTE` so reads and writes stay scoped to this app.

| Entity              | Stores                                                                  | TTL     |
| ------------------- | ----------------------------------------------------------------------- | ------- |
| `group-snapshot`    | Semaphore commitments + Discord subject hashes. Append-only, versioned. | 1 year  |
| `identity-backup`   | Encrypted Semaphore identity. Versioned. Tombstoned on delete.          | 1 year  |
| `thread`            | Title, body, tag, author handle, optional `poll_id`.                    | 30 days |
| `comment`           | Body, parent type, parent ID.                                           | 30 days |
| `poll`              | Question, options, closes-at.                                           | 30 days |
| `vote`              | Poll ID, option index, voter nullifier.                                 | 30 days |

### Relationships

Implemented through shared attribute keys (the [Arkiv pattern](https://github.com/Arkiv-Network/arkiv-ethns-builder-challenge)):

- `thread.poll_id` points at a `poll`
- `comment.parent_id` points at a `thread` or `poll`
- `vote.poll_id` points at a `poll`
- `group-snapshot.version` chains snapshots in append-only order

### Auth flow

```
Discord OAuth          → server cookie (subject_id)
       ↓
Mint Semaphore identity in browser
       ↓
Encrypt with passphrase → PUT /api/backup        → identity-backup entity
       ↓
Add commitment          → POST /api/group/join   → group-snapshot entity
       ↓
Generate ZK proof of membership
       ↓
POST /api/verify-zeropass                        → forum session cookie
       ↓
You're in. The forum can't tell which member you are.
```

On a second device, the browser fetches `GET /api/backup`, prompts for the passphrase, decrypts the identity, and proves membership against the same group root. No re-verifying Discord.

> [!NOTE]
> Three independent privacy properties are preserved:
>
> | Data                          | Public on Arkiv  | Server sees | Linkable to you |
> | ----------------------------- | ---------------- | ----------- | --------------- |
> | Membership commitment         | yes              | no          | no              |
> | Encrypted identity backup     | yes (ciphertext) | no          | no              |
> | Threads / comments / votes    | yes              | no          | no              |

## Tech stack

- **Next.js 16** (App Router, RSC + client components)
- **Arkiv SDK** (`@arkiv-network/sdk`) for entity CRUD on the Braga testnet
- **Semaphore Protocol** (`@semaphore-protocol/core`) for ZK membership proofs
- **Tailwind v4** for styling
- **Discord OAuth** for the one-time NS membership check

## Getting started

### Prerequisites

- Node.js 20+
- A Discord application with OAuth2 set up ([guide](https://discord.com/developers/applications))
- An Arkiv Braga testnet wallet (you can generate one with `node scripts/gen-wallet.mjs`)

### Install

```bash
npm install
```

### Configure environment

Create a `.env` file at the project root:

```env
# Arkiv
ARKIV_PRIVATE_KEY=0x...           # signs all writes
ARKIV_POLL_PROJECT=arkiv_test     # value used for PROJECT_ATTRIBUTE
ARKIV_GROUP_ID=arkiv_test-ns      # group namespace inside the project

# Discord
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=http://localhost:3002/api/auth/discord/callback
NS_GUILD_ID=                      # NS Discord guild ID
NS_MEMBER_ROLE_ID=                # optional, blank accepts any guild member

# Session
FORUM_SESSION_SECRET=             # any 32+ char random string
```

> [!IMPORTANT]
> Add the `DISCORD_REDIRECT_URI` to your Discord app's allowed redirect URIs under **OAuth2 → Redirects**, or callbacks will fail.

### Fund the Arkiv wallet

Hit the Braga faucet for the address derived from your private key:

```
https://braga.hoodi.arkiv.network/faucet/
```

Verify it can write:

```bash
node scripts/arkiv-ping.mjs
```

Expected output:

```
✓ Wrote entity in ~1000ms
  txHash:    0x...
  explorer:  https://explorer.braga.hoodi.arkiv.network/tx/0x...
```

### Run

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) and hit `/auth` to sign in.

> [!TIP]
> The first sign-in walks you through Discord verification, passphrase setup, group join, and proof generation. After that, every action you take posts a real Arkiv transaction with a link you can click straight to the explorer.

## Useful scripts

| Script                          | Purpose                                                       |
| ------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                   | Start the dev server on port 3002                             |
| `npm run build`                 | Production build                                              |
| `npm run start`                 | Start the production server                                   |
| `node scripts/gen-wallet.mjs`   | Generate a fresh Arkiv private key + address                  |
| `node scripts/arkiv-ping.mjs`   | Write a test entity to verify env + wallet are working        |
| `node scripts/arkiv-read.mjs`   | Read the latest block, balance, and nonce status              |

## Project layout

```
src/
├── app/
│   ├── api/
│   │   ├── auth/discord/        Discord OAuth start + callback
│   │   ├── group/               GET snapshot, POST join, POST leave
│   │   ├── backup/              GET, PUT, DELETE encrypted backup
│   │   ├── identity/delete/     Full account wipe
│   │   ├── threads/             GET list, POST create, GET [id]
│   │   ├── comments/            GET list, POST create
│   │   ├── poll/                GET list, POST create, POST cast
│   │   └── verify-zeropass/     Verify ZK proof, set session
│   ├── auth/                    Discord + passphrase flow
│   ├── profile/                 Handle, sign out, delete identity
│   ├── rules/                   Community rules
│   └── page.tsx                 Forum home
├── components/forum/            UI (top bar, composer, toasts, detail)
└── lib/
    ├── arkiv-client.ts          Shared viem clients + PROJECT_ATTRIBUTE
    ├── group-store.ts           group-snapshot CRUD
    ├── backup-store.ts          identity-backup CRUD
    ├── thread-store.ts          thread CRUD
    ├── comment-store.ts         comment CRUD
    ├── poll-store.ts            poll + vote CRUD
    ├── discord.ts               OAuth helpers
    ├── discord-session.ts       Discord-verified cookie
    ├── session.ts               Forum session cookie
    └── zeropass-identity.ts     Semaphore identity in localStorage
```

The walkthrough covers: Discord verify, passphrase setup, post a thread, attach a poll, second member votes, then open the Arkiv explorer from the in-app transaction link.

## Team

| Name      | GitHub  | Wallet  |
| --------- | ------- | ------- |
| Jeefx   | https://github.com/jeefxm  | 0x93fA0E828Ab8b72EEEE42747DE3f9C66D1B43a5c  |

## Roadmap

- Cross-device QR pairing as an alternative to passphrase backup
- Federated groups: other communities running their own forumzero on the same primitives
- Rich-text and image posts (entity payload as bytes)

> [!CAUTION]
> Lose your passphrase and your anonymous identity is gone forever. We can't recover it. Nobody can. Save it somewhere off-device.
