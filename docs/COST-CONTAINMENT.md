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
The protected middleware accepts the login endpoint's signed `auth_token`
cookie as well as explicit bearer tokens. Cookie-authenticated writes require
an Origin equal to the request origin, and the three legacy GET routes with
side effects reject cookie authentication. Their explicit bearer GET callers
remain supported, but must be inventoried. This is not a complete CSRF,
session-revocation, login/refresh or application-wide security review. Confirm
trusted proxy/Host handling, exact signing mode, deployment origin, cookie
settings and remaining routes before restoring browser access.

Recommendation generation checks account ownership in its route and now
filters performance through inner ad/ad-set relationships to the requested
account before using the privileged client. It associates returned results
with that account and treats database read or insert failure as an error. A
local PostgreSQL/PostgREST test exercises two account owners and rejects
cross-account access. The test schema is inferred from the source; the checked
in migration does not create the ad tables. Verify the deployed relationships,
grants, RLS and all other recommendation consumers before relying on this fix.

The dashboard requests the saved account list and a new account-scoped saved
campaign/performance view; it does not automatically call the live bulk sync
or campaigns endpoints. The view checks ownership, bounds its queries and
does not show a performance total when the rows were truncated. Missing
metrics are shown as unavailable. Saved values can be stale, and earlier
versions may have associated performance rows with the wrong ads; historic
data needs reconciliation. Verify the real schema, query relationships,
summary semantics, access controls, time zones and rendered application before
relying on this candidate. A separate authorized owned-hardware execution plan
is needed for live sync. OAuth, OpenAI, other Meta fan-out, account status,
other callers and EverReach integrations require separate review.
