// app/docs/page.tsx
import type { ReactNode } from 'react'
import styles from './docs.module.css'
import CopyButton from '@/components/CopyButton'

const INSTALL_CMD = 'pip install langgraph-approval-hub'

const BASIC_CODE = `from langgraph_approval_hub import request_approval

decision = request_approval(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    agent_name="Finance Agent",
    action_description="Process $4,200 refund for 12 customers",
    assignee="alice@acme.com",
    assignee_type="email",
)

if decision == "approved":
    process_refunds()`

const TEAM_CODE = `decision = request_approval(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    agent_name="Data Pipeline Agent",
    action_description="Drop and recreate the events_staging table",
    assignee="data-team",        # team name from Settings → Teams
    assignee_type="team",
)`

const ESCALATION_CODE = `decision = request_approval(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    agent_name="Billing Agent",
    action_description="Issue $12,000 credit to enterprise account ACME-001",
    assignee="billing@acme.com",
    assignee_type="email",
    escalate_to="cfo@acme.com",  # notified if no response
    timeout_minutes=30,           # escalates after 30 min
)`

const REASONING_CODE = `decision = request_approval(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    agent_name="Customer Service Agent",
    action_description="Issue full refund of $340 to customer #A-4821",
    assignee="support-team",
    assignee_type="team",
    agent_reasoning="""
1. Customer purchased on 2024-03-01, within the 30-day return window.
2. Item returned in original packaging — no restocking fee applies.
3. Customer account has no prior refund requests.
4. Refund amount matches the original charge exactly.
""",
)`

const ERROR_CODE = `try:
    decision = request_approval(
        hub_url="https://your-hub.vercel.app",
        api_token="your-api-secret-token",
        agent_name="Finance Agent",
        action_description="Wire $50,000 to vendor account",
        assignee="finance-team",
        assignee_type="team",
        timeout_minutes=60,
    )
except TimeoutError:
    # Nobody responded — fail safe, do nothing
    notify_team("Approval timed out — no action taken")
    return
except RuntimeError as e:
    # Hub unreachable or rejected the request
    log_error(e)
    raise

if decision == "approved":
    execute_wire_transfer()`

const ASYNC_CODE = `from langgraph_approval_hub import submit_approval, get_decision

# Submit — returns immediately, agent continues
approval_id = submit_approval(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    agent_name="OutreachBot",
    action_description="Send cold email campaign to 200 leads",
    assignee="marketing@company.com",
    assignee_type="email",
)

# ... do other work while waiting ...

# Check the decision later (non-blocking)
result = get_decision(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    approval_id=approval_id,
)
print(result["status"])  # "pending" | "approved" | "rejected" | "expired"`

const LIST_PENDING_CODE = `from langgraph_approval_hub import get_pending

pending = get_pending(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
)
for item in pending:
    print(item["id"], item["agent_name"], item["status"])`

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="relative my-4">
      {label && (
        <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 rounded-t-lg px-4 pt-2 pb-0">
          {label}
        </div>
      )}
      <pre
        className={`bg-slate-900 text-slate-200 rounded-lg ${label ? 'rounded-tl-none' : ''} p-5 overflow-x-auto text-[13px] leading-7 font-mono`}
      >
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  )
}

function Callout({ type, children }: { type: 'tip' | 'warn'; children: ReactNode }) {
  const base = 'rounded-lg p-4 text-sm leading-relaxed flex gap-3 my-4'
  if (type === 'tip')
    return <div className={`${base} bg-green-50 border border-green-200 text-green-900`}><span>ℹ</span><div>{children}</div></div>
  return <div className={`${base} bg-amber-50 border border-amber-200 text-amber-900`}><span>⚠</span><div>{children}</div></div>
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="mb-8">
      <div className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">{eyebrow}</div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-3 leading-tight">{title}</h2>
      <p className="text-slate-500 text-base leading-relaxed max-w-2xl">{sub}</p>
    </div>
  )
}

export default function DocsPage() {
  return (
    <div className="space-y-20 pb-20">

      {/* ── WHY THIS EXISTS ── */}
      <section id="why">
        <SectionTitle
          eyebrow="Why this exists"
          title="Your agent is about to wire $50,000. Who approves it?"
          sub="You built the agent. You wired up LangGraph's interrupt() to pause before the irreversible action. Now what? Who gets notified? Where do they decide? What if they're on holiday? You're three days from launch and you're about to build a notification system, a dashboard, and an escalation engine from scratch."
        />

        {/* The gap — what LangGraph gives vs what you still need */}
        <div className="mb-8 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            <div className="p-5">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">What LangGraph gives you</div>
              <div className="space-y-2">
                {[
                  'interrupt() — pause execution',
                  'resume() — continue after decision',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-green-500 font-bold">✓</span> {item}
                  </div>
                ))}
                {[
                  'Notification to the approver',
                  'Dashboard to approve / reject',
                  'Escalation if no response',
                  'Audit trail for compliance',
                  'Team routing',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="text-slate-300 font-bold">✗</span> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 bg-green-50">
              <div className="text-[11px] font-bold uppercase tracking-widest text-green-700 mb-3">What Approval Hub adds</div>
              <div className="space-y-2">
                {[
                  'interrupt() — pause execution',
                  'resume() — continue after decision',
                  'Email + Slack notification instantly',
                  'Clean dashboard to approve / reject',
                  'Auto-escalate after your timeout',
                  'Full append-only audit log',
                  'Route to a person or a named team',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-green-800">
                    <span className="text-green-500 font-bold">✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scenario cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              tag: '💸 Finance Agent',
              tagClass: 'bg-orange-100 text-orange-800',
              title: 'Wire $50,000 to a new vendor account',
              body: 'The agent has verified the details. It needs one human to confirm before it moves the money. With LangGraph alone — nobody knows it\'s waiting.',
              delay: '0.1s',
            },
            {
              tag: '🗂 HR Agent',
              tagClass: 'bg-purple-100 text-purple-800',
              title: 'Send rejection emails to 40 candidates',
              body: 'The pipeline ran overnight. Before it fires 40 emails, someone on the team should review the shortlist. interrupt() paused it. But who got pinged?',
              delay: '0.25s',
            },
            {
              tag: '💬 Developer, production deploy',
              tagClass: 'bg-sky-100 text-sky-800',
              title: '"When a thread is interrupted, nobody gets notified. No email, no Slack, no ping of any kind."',
              body: '',
              delay: '0.4s',
            },
            {
              tag: '💬 Developer, LangGraph community',
              tagClass: 'bg-sky-100 text-sky-800',
              title: '"There\'s no built-in mechanism to say \'if nobody responds in 30 minutes, escalate to the backup approver.\'"',
              body: '',
              delay: '0.55s',
            },
          ].map((card) => (
            <div
              key={card.tag + card.title}
              className={`bg-white border border-slate-200 rounded-xl p-5 ${styles.fadeUp}`}
              style={{ animationDelay: card.delay }}
            >
              <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded mb-3 ${card.tagClass}`}>
                {card.tag}
              </span>
              <p className="text-sm font-semibold text-slate-800 leading-snug">{card.title}</p>
              {card.body && <p className="text-sm text-slate-500 mt-2 leading-relaxed">{card.body}</p>}
            </div>
          ))}
        </div>
        <div
          className={`mt-4 bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4 ${styles.fadeUp}`}
          style={{ animationDelay: '0.7s' }}
        >
          <span className="text-3xl">⚡</span>
          <div>
            <p className="font-bold text-green-900 text-base">Approval Hub fills every gap — deployed in 5 minutes, free forever.</p>
            <p className="text-green-800 text-sm mt-0.5 opacity-90">
              Dashboard · Email · Slack · Audit trail · Escalation · Team routing. Open source, self-hosted.{' '}
              <span className="opacity-75">
                And you&apos;re not alone — <a href="https://www.gartner.com/en/newsroom/press-releases/2025-09-30-gartner-survey-finds-just-15-percent-of-it-application-leaders-are-considering-piloting-or-deploying-fully-autonomous-ai-agents" target="_blank" rel="noopener noreferrer" className="underline">85% of teams building AI agents</a> say human oversight is non-negotiable (Gartner, 2025).
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── GET RUNNING ── */}
      <section>
        <SectionTitle
          eyebrow="Get Running"
          title="Up and running in 5 minutes"
          sub="Four steps. One Vercel deploy, one env var table, one pip install, three lines of Python."
        />

        {/* Step 1 */}
        <div id="deploy" className="flex gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
            <div className="w-0.5 bg-slate-200 flex-1 mt-2" />
          </div>
          <div className="flex-1 pb-8">
            <h3 className="font-bold text-slate-900 text-base mb-1 pt-1">Deploy your hub to Vercel</h3>
            <p className="text-slate-500 text-sm mb-3">One click. Vercel clones the repo and prompts you for env vars during setup.</p>
            <a
              href="https://vercel.com/new/clone?repository-url=https://github.com/suryamr2002/langgraph-approval-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              ▲ Deploy to Vercel
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <div id="env" className="flex gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
            <div className="w-0.5 bg-slate-200 flex-1 mt-2" />
          </div>
          <div className="flex-1 pb-8">
            <h3 className="font-bold text-slate-900 text-base mb-1 pt-1">Set environment variables</h3>
            <p className="text-slate-500 text-sm mb-3">In Vercel → Project Settings → Environment Variables, add:</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-600 text-xs uppercase">Variable</th>
                  <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-600 text-xs uppercase">Where to get it</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['SUPABASE_URL', 'Supabase → Project Settings → API'],
                  ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase → Project Settings → API → service_role'],
                  ['SUPABASE_ANON_KEY', 'Supabase → Project Settings → API → anon/public'],
                  ['API_SECRET_TOKEN', 'Any random string — becomes your auth key'],
                  ['NEXT_PUBLIC_APP_URL', 'Your Vercel deployment URL (e.g. https://my-hub.vercel.app)'],
                  ['RESEND_API_KEY', 'resend.com → API Keys (optional — enables email)'],
                  ['SLACK_WEBHOOK_URL', 'Slack → Incoming Webhooks (optional — enables Slack)'],
                ].map(([key, desc]) => (
                  <tr key={key} className="border-b border-slate-100">
                    <td className="border border-slate-200 px-3 py-2">
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800">{key}</code>
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 3 */}
        <div id="install" className="flex gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
            <div className="w-0.5 bg-slate-200 flex-1 mt-2" />
          </div>
          <div className="flex-1 pb-8">
            <h3 className="font-bold text-slate-900 text-base mb-1 pt-1">Install the SDK</h3>
            <CodeBlock code={INSTALL_CMD} />
            <Callout type="tip">
              Requires Python 3.9+. The only dependency is <code className="bg-green-100 px-1 rounded font-mono text-xs">requests</code> — no LangChain version pinning, no conflicts.
            </Callout>
          </div>
        </div>

        {/* Step 4 */}
        <div id="agent" className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">4</div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-base mb-1 pt-1">Add to your agent</h3>
            <p className="text-slate-500 text-sm mb-2">Three lines. Paste anywhere inside a LangGraph node function.</p>
            <CodeBlock code={BASIC_CODE} label="Python" />
            <Callout type="tip">
              <code className="bg-green-100 px-1 rounded font-mono text-xs">request_approval()</code> blocks until a human decides.
              Alice gets an email with a direct dashboard link. Your agent resumes the moment she clicks Approve or Reject.
            </Callout>
          </div>
        </div>
      </section>

      {/* ── CODE PATTERNS ── */}
      <section>
        <SectionTitle
          eyebrow="Code Patterns"
          title="Real-world examples"
          sub="Every team has slightly different requirements. These patterns cover the most common ones."
        />

        <div id="basic" className="mb-10">
          <h3 className="text-base font-bold text-slate-900 mb-1">Basic approval — person assignee</h3>
          <p className="text-sm text-slate-500 mb-2">The simplest case: one person must approve before the agent continues.</p>
          <CodeBlock code={BASIC_CODE} label="Python" />
        </div>

        <div id="team-routing" className="mb-10">
          <h3 className="text-base font-bold text-slate-900 mb-1">Route to a team</h3>
          <p className="text-sm text-slate-500 mb-2">
            Use <code className="bg-slate-100 px-1 rounded font-mono text-xs">assignee_type=&quot;team&quot;</code> when multiple people share responsibility.
            All team members are notified — first to respond wins.
          </p>
          <CodeBlock code={TEAM_CODE} label="Python" />
        </div>

        <div id="escalation" className="mb-10">
          <h3 className="text-base font-bold text-slate-900 mb-1">Escalate if no response</h3>
          <p className="text-sm text-slate-500 mb-2">
            If the assignee doesn&apos;t respond within <code className="bg-slate-100 px-1 rounded font-mono text-xs">timeout_minutes</code>, the hub
            re-notifies the escalation target and marks the request as Escalated on the dashboard.
          </p>
          <CodeBlock code={ESCALATION_CODE} label="Python" />
        </div>

        <div id="errors" className="mb-4">
          <h3 className="text-base font-bold text-slate-900 mb-1">Show agent reasoning + handle errors</h3>
          <p className="text-sm text-slate-500 mb-2">
            Pass <code className="bg-slate-100 px-1 rounded font-mono text-xs">agent_reasoning</code> to give the approver full context.
            Always wrap in try/except — the SDK raises <code className="bg-slate-100 px-1 rounded font-mono text-xs">TimeoutError</code> and <code className="bg-slate-100 px-1 rounded font-mono text-xs">RuntimeError</code>.
          </p>
          <CodeBlock code={REASONING_CODE} label="With reasoning" />
          <CodeBlock code={ERROR_CODE} label="With error handling" />
          <Callout type="warn">
            <strong>Default safe:</strong> if <code className="bg-amber-100 px-1 rounded font-mono text-xs">decision == &quot;rejected&quot;</code> or an exception is raised, your agent should do nothing.
            Never treat a missing decision as implicit approval.
          </Callout>
        </div>

        <div id="async" className="mb-10">
          <h3 className="text-base font-bold text-slate-900 mb-1">Non-blocking (async) pattern</h3>
          <p className="text-sm text-slate-500 mb-2">
            Use <code className="bg-slate-100 px-1 rounded font-mono text-xs">submit_approval()</code> when
            you want to continue working while waiting for a decision. Check back later with{' '}
            <code className="bg-slate-100 px-1 rounded font-mono text-xs">get_decision()</code>.
          </p>
          <CodeBlock code={ASYNC_CODE} label="Python" />
          <p className="text-sm text-slate-500 mb-2 mt-4">List all pending approvals:</p>
          <CodeBlock code={LIST_PENDING_CODE} label="Python" />
          <Callout type="tip">
            New in v0.2.0. Install with{' '}
            <code className="bg-green-100 px-1 rounded font-mono text-xs">pip install langgraph-approval-hub==0.2.0</code>
          </Callout>
        </div>
      </section>

      {/* ── ENTERPRISE ── */}
      <section>
        <SectionTitle
          eyebrow="Enterprise"
          title="Deploy for your whole org"
          sub="One hub instance handles all your agents. Route approvals to the right team, escalate to managers, export decisions for compliance."
        />

        <div id="enterprise" className="mb-8">
          <h3 className="text-base font-bold text-slate-900 mb-3">How it fits together</h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 font-mono text-xs text-slate-600 leading-8">
            <div><span className="text-green-700 font-bold">Your LangGraph Agent</span> → POST /api/interrupt → Approval Hub (Vercel)</div>
            <div className="pl-8">↓ saves to Supabase</div>
            <div className="pl-8">↓ fires notifications → <span className="text-sky-700">Email (Resend)</span> + <span className="text-purple-700">Slack webhook</span></div>
            <div className="pl-8">↓ Approver opens dashboard link</div>
            <div className="pl-8">↓ Clicks Approve / Reject</div>
            <div className="pl-8">↓ <span className="text-green-700 font-bold">Agent resumes</span> with &quot;approved&quot; or &quot;rejected&quot;</div>
          </div>
        </div>

        <div id="notifications" className="mb-8">
          <h3 className="text-base font-bold text-slate-900 mb-3">Enabling notifications</h3>
          <p className="text-sm text-slate-500 mb-3">Set these two env vars in Vercel — both are free:</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Variable</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Service</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">What it enables</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 px-3 py-2"><code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs text-slate-800">RESEND_API_KEY</code></td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">resend.com — free up to 100 emails/day</td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">Email to assignee (and team members) on every new request</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2"><code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs text-slate-800">SLACK_WEBHOOK_URL</code></td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">Slack Incoming Webhooks — free</td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">Slack message to your channel on every new request + escalation</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="audit-trail">
          <h3 className="text-base font-bold text-slate-900 mb-2">Audit trail</h3>
          <p className="text-sm text-slate-500 mb-2">
            Every decision is recorded — agent name, action, who decided, when, and any note they left.
            Go to the <a href="/audit" className="text-green-700 underline">Audit Log</a> to view or export as JSON.
          </p>
          <Callout type="tip">
            The audit log is append-only. Approved and rejected decisions are both recorded. Use{' '}
            <code className="bg-green-100 px-1 rounded font-mono text-xs">↗ Export JSON</code> for compliance exports.
          </Callout>
        </div>
      </section>

      {/* ── REFERENCE ── */}
      <section>
        <SectionTitle
          eyebrow="Reference"
          title="SDK & API reference"
          sub="Full parameter list and API endpoint table."
        />

        <div id="sdk-params" className="mb-12">
          <h3 className="text-base font-bold text-slate-900 mb-3">SDK parameters</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Parameter</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Required</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['hub_url', 'str', true, 'Your Approval Hub URL'],
                ['api_token', 'str', true, 'Your API_SECRET_TOKEN env var value'],
                ['agent_name', 'str', true, 'Name shown in the dashboard'],
                ['action_description', 'str', true, 'Plain-English description of what the agent wants to do'],
                ['assignee', 'str', true, 'Email address or team name'],
                ['assignee_type', '"email" | "team"', true, 'Whether assignee is an individual or a team'],
                ['agent_reasoning', 'str', false, 'Step-by-step reasoning shown to the approver on the detail page'],
                ['escalate_to', 'str', false, 'Email to escalate to if timeout exceeded'],
                ['timeout_minutes', 'int', false, 'Minutes before escalation triggers (default: 60)'],
                ['poll_interval', 'int', false, 'Seconds between status polls — request_approval() only (default: 5)'],
              ] as [string, string, boolean, string][]).map(([param, type, req, desc]) => (
                <tr key={param} className="border-b border-slate-100">
                  <td className="border border-slate-200 px-3 py-2">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs text-slate-800">{param}</code>
                  </td>
                  <td className="border border-slate-200 px-3 py-2 font-mono text-xs text-slate-600">{type}</td>
                  <td className="border border-slate-200 px-3 py-2">
                    {req
                      ? <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">Required</span>
                      : <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded">Optional</span>
                    }
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div id="api-endpoints">
          <h3 className="text-base font-bold text-slate-900 mb-3">API endpoints</h3>
          <p className="text-sm text-slate-500 mb-3">All endpoints are on your Vercel deployment URL. POST /api/interrupt requires a Bearer token in the Authorization header.</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Method</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Route</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Auth</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['POST', '/api/interrupt', 'Bearer token', 'Create approval request, fire notifications'],
                ['GET', '/api/approvals', 'Bearer token', 'List approvals (?status=pending|escalated)'],
                ['GET', '/api/approvals/[id]', 'Bearer token', 'Get single approval with notification log'],
                ['POST', '/api/approvals/[id]/decide', 'None', 'Submit approve or reject decision'],
                ['GET', '/api/audit', 'None', 'Full audit log — also used for JSON export'],
                ['GET', '/api/teams', 'None', 'List all configured teams'],
                ['POST', '/api/teams', 'None', 'Create or update a team'],
              ] as [string, string, string, string][]).map(([method, route, auth, desc]) => (
                <tr key={method + route} className="border-b border-slate-100">
                  <td className="border border-slate-200 px-3 py-2">
                    <code className={`text-xs font-bold px-1.5 py-0.5 rounded font-mono ${method === 'POST' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{method}</code>
                  </td>
                  <td className="border border-slate-200 px-3 py-2 font-mono text-xs text-slate-700">{route}</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-500 text-xs">{auth}</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
