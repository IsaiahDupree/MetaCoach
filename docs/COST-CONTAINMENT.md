# MatrixLoop local containment candidate

This candidate starts from editorial preview commit `f9ba974`. The exact live
production archive, client origins and independent triggers have not been
reconciled. Keep `matrixloop.app`, Meta OAuth callbacks, customer accounts,
tokens, analytics, and existing data intact.

The bulk campaign/ad-set sync and ad-insight fetch routes return 503 after
authentication unless `METACOACH_META_SYNC_ENABLED=1`. The switch is a safety
control, not permission for paid work, a budget cap, or a queue: requests while
disabled are not processed or retained. The ad-insight worker limits parallel
requests to three and retains each returned row's source ad ID. Other Meta
routes still make external requests, including the account listing, campaigns,
health and organic metrics routes. No claim is made that all outbound or paid
work is disabled.

Protected routes no longer accept the known fallback JWT signing secret and
require a configured secret of at least 32 characters and project URL. They
verify HS256, issuer, audience, expiry, subject and authenticated role. This
matches the legacy symmetric-key design already in this source; projects using
asymmetric signing keys require a separately verified JWKS/getClaims design.
The existing browser login sets an `auth_token` cookie but this middleware only
accepts a bearer header. Reconcile the entire session/CSRF flow before use;
this change does not fix session revocation, all routes or account isolation
across the entire application.

Recommendation generation checks account ownership in its route and now
filters performance through inner ad/ad-set relationships to the requested
account before using the privileged client. It associates returned results
with that account and treats database read or insert failure as an error. A
local PostgreSQL/PostgREST test exercises two account owners and rejects
cross-account access. The test schema is inferred from the source; the checked
in migration does not create the ad tables. Verify the deployed relationships,
grants, RLS and all other recommendation consumers before relying on this fix.

Dashboard contracts also need repair: its account caller expects `accounts`
while the inspected endpoint returns `data`; it calls the bulk fetch route on
account/period changes but expects a summary that route does not return, and
passes date parameter names that differ from the handler. Do not paper over
these mismatches with fabricated zeroes. Reconcile real stored schemas and
access controls, build a read-only cached view and require an authorized
owned-hardware execution plan before restoring live sync. OpenAI calls,
other Meta fan-out and EverReach integrations require separate review.
