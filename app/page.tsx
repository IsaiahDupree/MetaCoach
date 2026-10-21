import Link from 'next/link'

const product = {
  name: 'MatrixLoop',
  url: 'https://matrixloop.app',
  description:
    'An early-stage workspace for connecting Meta advertising accounts and reviewing campaign performance.',
}

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: product.url,
    description: product.description,
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-bold tracking-tight">MatrixLoop</Link>
        <Link href="/connect" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-white">
          Connect an account
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pb-28 md:pt-24">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Meta advertising workspace</p>
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            See your campaign performance in one place.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            MatrixLoop is an early-stage workspace for Meta advertisers. Connect an eligible ad account to review campaigns, reporting metrics, and account recommendations in a single dashboard.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/connect" className="rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800">
              Connect a Meta account <span aria-hidden="true">→</span>
            </Link>
            <span className="text-sm text-slate-500">Instagram or Facebook account access is required.</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9">
          <p className="text-sm font-semibold text-slate-500">WHAT YOU CAN REVIEW</p>
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="font-semibold">Campaigns and ad accounts</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Choose a connected account and review its available campaign information.</p>
            </div>
            <div>
              <h2 className="font-semibold">Performance reporting</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">View spend, impressions, clicks, conversions, and related summary metrics when the connected account provides them.</p>
            </div>
            <div>
              <h2 className="font-semibold">Account recommendations</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Review recommendations associated with the selected account. Treat estimates as guidance, not a promise of results.</p>
            </div>
          </div>
          <p className="mt-8 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
            MatrixLoop is in an early product stage. Confirm figures in Meta Ads Manager before making spending decisions.
          </p>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
          <div><h2 className="font-semibold">Who it is for</h2><p className="mt-2 text-sm leading-6 text-slate-600">People who manage Meta advertising accounts and want a focused place to review campaign information.</p></div>
          <div><h2 className="font-semibold">How to get started</h2><p className="mt-2 text-sm leading-6 text-slate-600">Use the account connection flow. An eligible Instagram Business or Creator account connected to a Facebook Page may be required.</p></div>
          <div><h2 className="font-semibold">Product status</h2><p className="mt-2 text-sm leading-6 text-slate-600">This is an early-stage product. Available data and features depend on account access and the current application build.</p></div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>MatrixLoop · Meta advertising performance workspace</span>
        <Link href="/connect" className="font-medium text-blue-700 hover:underline">Connect an account</Link>
      </footer>
    </main>
  )
}
