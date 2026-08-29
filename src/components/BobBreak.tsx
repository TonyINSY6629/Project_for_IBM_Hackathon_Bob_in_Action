/**
 * BobBreak — main UI component.
 * Integrates page (2).tsx logic with the full shell from bob-break-shell (2).html.
 * Uses inline SVGs (same icons as the shell) — no shadcn/ui dependency needed.
 */
import { useRef, useEffect } from 'react'
import { useBobBreak } from '../hooks/useBobBreak'
import '../styles/bob-break.css'

// ─── SVG icon helpers (same paths as bob-break-shell) ─────────────────────────
const EyeIcon = () => (
  <svg className="bb-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const LeafIcon = ({ size = 16 }: { size?: number }) => (
  <svg className="bb-icon" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/>
    <path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"/>
  </svg>
)
const ShieldIcon = () => (
  <svg className="bb-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1Z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
)
const CheckIcon = () => (
  <svg className="bb-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg className="bb-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10.7 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.7"/>
    <path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3.6 7 10 7a10.9 10.9 0 0 0 4.4-.9"/>
    <path d="m2 2 20 20"/>
  </svg>
)

// ─── Stage SVG icons (same as shell STAGE_ICON) ───────────────────────────────
const STAGE_SVG: Record<string, JSX.Element> = {
  seed: <><circle cx="12" cy="12" r="9"/></>,
  sprout: (
    <>
      <path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/>
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8Z"/>
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2Z"/>
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/>
      <path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"/>
    </>
  ),
  flower: (
    <>
      <circle cx="12" cy="12" r="2.6"/>
      <path d="M12 9.4a2.9 2.9 0 1 0-2.6-4.2A2.9 2.9 0 0 0 12 9.4Z"/>
      <path d="M14.6 12a2.9 2.9 0 1 0 4.2-2.6A2.9 2.9 0 0 0 14.6 12Z"/>
      <path d="M12 14.6a2.9 2.9 0 1 0 2.6 4.2A2.9 2.9 0 0 0 12 14.6Z"/>
      <path d="M9.4 12a2.9 2.9 0 1 0-4.2 2.6A2.9 2.9 0 0 0 9.4 12Z"/>
    </>
  ),
}
const ICON_FOR_STAGE: Record<string, string> = { blocked: 'leaf', waiting: 'leaf', seed: 'seed', sprout: 'sprout', leaf: 'leaf', flower: 'flower' }
const PHASE_LABEL: Record<string, string> = { planned: 'Planned', working: 'Growing', waiting: 'Waiting on you', blocked: 'Blocked', done: 'Complete' }

function stageFor(pct: number, phase: string) {
  if (phase === 'blocked') return 'blocked'
  if (phase === 'waiting') return 'waiting'
  if (pct === 0) return 'seed'
  if (pct === 100) return 'flower'
  return pct < 40 ? 'sprout' : 'leaf'
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function IdeLayer({ files }: { files: import('../hooks/useBobBreak').BobBreakState['files'] }) {
  return (
    <div className="ide-layer">
      <nav className="tree">
        <div className="tree-head">Files · {files.length}</div>
        {files.slice(0, 200).map(f => (
          <div key={f.path} className="node" style={{ paddingLeft: f.path.includes('/') ? 28 : 16 }}>
            <span className="ico">{f.text !== null ? '◦' : '▪'}</span>
            {f.name}
          </div>
        ))}
      </nav>
      <div className="code-pane">
        <div className="code-head">
          <span>select a file to preview</span>
        </div>
        <pre className="code" />
      </div>
      <div className="logpane">
        <div className="log-head">Agent output — every event, unfiltered</div>
      </div>
    </div>
  )
}

function AgentGarden({ agents }: { agents: import('../hooks/useBobBreak').BobBreakState['agents'] }) {
  return (
    <div className="agent-grid">
      {agents.map(a => {
        const pct = a.total ? Math.min(100, Math.round(a.done / a.total * 100)) : 0
        const stage = stageFor(pct, a.phase)
        const growth = Math.max(0.45, pct / 100)
        const iconKey = ICON_FOR_STAGE[stage]
        return (
          <article
            key={a.id}
            className={`agent ${a.phase === 'done' ? 'agent-complete' : ''}`}
            data-phase={a.phase}
          >
            <div
              className={`plant stage-${stage}`}
              style={{ '--growth': growth } as React.CSSProperties}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {STAGE_SVG[iconKey]}
              </svg>
            </div>
            <strong>{a.name}</strong>
            <div
              className="progress-track"
              role="progressbar"
              aria-label={`${a.name} progress`}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${pct}%` }} />
            </div>
            <small><b>{pct}%</b> · {PHASE_LABEL[a.phase] ?? a.phase}</small>
          </article>
        )
      })}
    </div>
  )
}

function InterruptCards({
  interrupts,
  onAnswer,
}: {
  interrupts: import('../hooks/useBobBreak').BobBreakState['interrupts']
  onAnswer: (id: string, opt: string) => void
}) {
  return (
    <>
      {interrupts.map(c => (
        <div key={c.id} className={`card${c.route === 'alert' ? ' crit' : ''}`}>
          <div className="lbl">
            {c.route === 'decision' ? 'Decision required' : c.route === 'alert' ? 'Critical risk' : 'Blocked'}
          </div>
          <h3>{c.event.decision ? c.event.decision.question : c.event.title}</h3>
          {c.event.detail && <p>{c.event.detail}</p>}
          {c.route === 'decision' && c.event.decision && !c.answered && (
            <div className="acts">
              {c.event.decision.options.map((o, i) => (
                <button
                  key={o}
                  className={i === 0 ? 'pri' : ''}
                  onClick={() => onAnswer(c.id, o)}
                  type="button"
                >
                  {o}
                </button>
              ))}
            </div>
          )}
          {c.answered && (
            <div className="acts">
              <span className="answered">Answered: <strong>{c.answered}</strong></span>
            </div>
          )}
        </div>
      ))}
    </>
  )
}

function ReportSection({ report }: { report: import('../hooks/useBobBreak').BobBreakState['report'] }) {
  if (!report) return null
  const groups: Record<string, { sev: string; text: string }[]> = { crit: [], warn: [], info: [] }
  report.findings.forEach(f => (groups[f.sev] ?? groups.info).push(f))

  const sec = (title: string, items: { text: string }[], cls: string) =>
    items.length ? (
      <div className="rsec" key={title}>
        <div className="rt">{title}</div>
        <ul>
          {items.map((item, i) => (
            <li key={i}>
              <span className={`sev ${cls}`}>{cls || 'info'}</span>
              <span dangerouslySetInnerHTML={{ __html: item.text }} />
            </li>
          ))}
        </ul>
      </div>
    ) : null

  return (
    <div className="report">
      <h3>Release readiness report</h3>
      <div className="sub">
        {report.files} files scanned · {report.total} events · {report.surfaced} needed you · {report.pct}% held back
        {report.truncated ? ' · truncated at 1500 files' : ''}
      </div>
      {sec('Needs a decision before release', groups.crit, 'crit')}
      {sec('Worth a look', groups.warn, 'warn')}
      {sec('For the record', groups.info, '')}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BobBreak() {
  const [state, actions] = useBobBreak()
  const logRef = useRef<HTMLDivElement>(null)

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [state.logLines])

  const active = state.agents.filter(a => a.phase === 'working' || a.phase === 'waiting').length
  const completed = state.agents.filter(a => a.phase === 'done').length
  const noisePct = state.total ? Math.round((1 - state.surfaced / state.total) * 100) : 0

  return (
    <>
      {/* ── Empty / onboarding ─────────────────────────────────────────────── */}
      {state.showEmpty && (
        <div className="bb-empty">
          <div className="empty-card">
            <div className="logo">
              <img src="/bob-head.png" alt="" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
            <h1>Point Bob Break at a project</h1>
            <p>
              The shell reads a directory you choose, derives four release-readiness analyzers from
              what is actually in it, and renders the run two ways — the code, or the garden.
            </p>
            <button className="bb-btn" onClick={actions.pickFolder} disabled={!state.hasAPI} type="button">
              Choose folder
            </button>
            <div className="bb-note">Nothing is uploaded. Files are read locally in the browser.</div>
            {!state.hasAPI && (
              <div className="bb-warnbox">
                This browser has no File System Access API. Open in Chrome or Edge to read a local directory.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main demo shell ────────────────────────────────────────────────── */}
      <main
        className={`demo ${state.view === 'recovery' ? 'recovery-on' : 'recovery-off'}`}
        style={{ fontFamily: 'var(--sans)' }}
      >
        {/* IDE background layer */}
        <IdeLayer files={state.files} />

        {/* View switch */}
        <div className="comparison-control">
          <span
            className={`side${state.view === 'ide' ? ' active' : ''}`}
            onClick={() => actions.setView('ide')}
            style={{ cursor: 'pointer' }}
          >
            <EyeIcon /> IDE view
          </span>
          <div className="switch-control">
            <small>Switch view</small>
            <button
              className="mode-switch"
              role="switch"
              aria-checked={String(state.view === 'recovery') as 'true' | 'false'}
              aria-label="Switch between the IDE and Bob Break recovery mode"
              onClick={() => actions.setView(state.view === 'recovery' ? 'ide' : 'recovery')}
              type="button"
            >
              <span className="knob" />
            </button>
          </div>
          <span
            className={`side${state.view === 'recovery' ? ' active' : ''}`}
            onClick={() => actions.setView('recovery')}
            style={{ cursor: 'pointer' }}
          >
            <LeafIcon /> Bob Break
          </span>
        </div>

        {/* Recovery veil */}
        <div className="recovery-veil" aria-hidden={state.view !== 'recovery'} />

        {/* Recovery surface */}
        <section className="recovery-surface" aria-hidden={state.view !== 'recovery'}>
          <header className="surface-header">
            <div className="brand">
              <span className="brand-mark">
                <LeafIcon size={20} />
                <img src="/bob-head.png" alt="" onError={e => (e.currentTarget.style.display = 'none')} />
              </span>
              <div>
                <strong>Bob Break</strong>
                <small>{state.folderName}</small>
              </div>
            </div>
            <div className="safe-status" data-s={state.status.kind}>
              <ShieldIcon />
              <span>{state.status.text}</span>
            </div>
          </header>

          <div className="surface-body">
            {/* ── Garden panel ─────────────────────────────────────────────── */}
            <section className="garden-panel" aria-labelledby="garden-title">
              <p className="overline">Agent garden</p>
              <h1 id="garden-title">{state.gardenTitle}</h1>
              <p className="calm-copy">
                You do not need to monitor every update. Bob Break interrupts only when your attention
                changes the outcome.
              </p>

              <AgentGarden agents={state.agents} />

              <div className="evidence">
                <div><strong>{state.total}</strong><span>events received</span></div>
                <div><strong>{state.surfaced}</strong><span>surfaced</span></div>
                <div className="noise">
                  <strong>{state.total ? `${noisePct}%` : '—'}</strong>
                  <span>less visual noise</span>
                </div>
              </div>

              <InterruptCards interrupts={state.interrupts} onAnswer={actions.answerDecision} />
              <ReportSection report={state.report} />
            </section>

            {/* ── Breathing panel ──────────────────────────────────────────── */}
            <section className="breathing-panel" aria-label="Guided breathing">
              <p className="overline">30-second reset</p>
              <div className="breathing-space">
                <div
                  className="breathing-ring"
                  style={{ transform: `scale(${state.breathScale})`, transitionDuration: `${state.breathSecs}s` }}
                >
                  <div>
                    <span>{state.breathLabel}</span>
                    <small>{state.breathSecs} seconds</small>
                  </div>
                </div>
              </div>
              <div className="essential-status" aria-live="polite">
                <CheckIcon />
                <span>{active} active · {completed} complete</span>
              </div>
              <button
                className="details-button"
                type="button"
                onClick={() => actions.setView('ide')}
              >
                <EyeOffIcon /> Technical details hidden
              </button>
              {!state.showEmpty && (
                <button
                  className="details-button"
                  type="button"
                  onClick={actions.pickFolder}
                >
                  Scan another folder
                </button>
              )}
            </section>
          </div>
        </section>

        {/* IDE log overlay (shown in IDE view) */}
        {state.view === 'ide' && state.logLines.length > 0 && (
          <div
            ref={logRef}
            style={{
              position: 'absolute', bottom: 0, left: 262, right: 0, height: 208,
              background: '#0d0d0d', overflow: 'auto', borderTop: '1px solid #393939', zIndex: 5,
            }}
          >
            <div className="log-head">Agent output — every event, unfiltered</div>
            {state.logLines.map(l => (
              <div key={l.id} className="logline" data-sev={l.severity}>
                <span className="t">{l.ts}</span>{' '}
                <span className="a">[{l.analyzer}]</span>{' '}
                {l.type}/{l.severity} — {l.title}
                {l.detail ? `\n           ${l.detail}` : ''}
                {l.route !== 'silent' ? '  ← surfaced' : ''}
              </div>
            ))}
          </div>
        )}

        {/* Without Bob Break caption */}
        <div className="normal-caption">
          <strong>Without Bob Break</strong>
          <span>Continuous code, logs and agent output compete for attention.</span>
        </div>
      </main>
    </>
  )
}
