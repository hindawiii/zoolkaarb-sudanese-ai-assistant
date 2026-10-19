# Architecture rules

- Load feature pages lazily behind a route error boundary to isolate failures and reduce initial downloads.
- Preserve dedicated anime and outfitter routes as the authoritative implementations; generic studio handles only generic tools.
- Keep account-owned data and credits in Cloud with RLS; local data is an offline cache and migration source, not authorization.
- Real ads and rate limiting are deferred; never describe mock rewards as revenue or abuse protection.