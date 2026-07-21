# RC Replicache v7 rollout (preRecebimentoId-first)

## What changed

- Replicache keyspace for `itemConferido`, `avaria`, and `temperaturaBau` now uses **`preRecebimentoId`** instead of `recebimentoId`.
- Client mutations no longer require `recebimentoId`; the API resolves/creates it server-side via `resolveRecebimentoId`.
- `REPLICACHE_SCHEMA_VERSION` bumped to **`recebimento-rc-v7`**.
- DB unique index on `recebimento.recebimentos.pre_recebimento_id` guarantees 1:1 mapping.

## Deploy order

1. Apply migration `0140_recebimentos_pre_recebimento_unique.sql`.
2. Deploy API (push/pull handlers + snapshot builder).
3. Deploy PWA with updated `@lilog/contracts` and `@lilog/replicache-recebimento`.

## Operator impact

- On first load after deploy, Replicache **drops local IndexedDB** for the new schema version and re-pulls from server.
- **Unsynced offline mutations at deploy time may be lost.** Ask operators to come online and sync before updating the app during a low-traffic window.
- Checklist photo uploads still require server `recebimentoId`; they remain best-effort/retriable and do not block conference flow.

## Verification checklist

- [ ] Save checklist offline → navigate to items without error
- [ ] Confer item offline → item appears in list from Replicache subscription
- [ ] Register avaria/temperatura offline → visible locally
- [ ] Finalize offline → mutation queued; succeeds on reconnect
- [ ] After push+pull, `demand.recebimentoId` populated and checklist photos upload
