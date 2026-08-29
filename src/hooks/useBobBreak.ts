/**
 * useBobBreak — all the analysis + streaming logic extracted from
 * bob-break-shell (2).html.  Pure React state; no DOM IDs.
 */
import { useEffect, useRef, useCallback, useState } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next', '.cache',
  'coverage', 'venv', '.venv', '__pycache__', 'target', 'vendor',
  '.idea', '.vscode', '.turbo',
])
const CODE_EXT = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'py', 'rb', 'go', 'rs', 'java',
  'c', 'h', 'cpp', 'cs', 'php', 'swift', 'kt', 'css', 'scss', 'less',
  'html', 'vue', 'svelte', 'sh', 'sql', 'r', 'jl', 'scala', 'dart',
])
const TEXT_EXT = new Set([
  ...CODE_EXT, 'json', 'md', 'yml', 'yaml', 'toml', 'txt', 'xml', 'env',
  'ipynb', 'cfg', 'ini',
])
// HASH_COMMENT: used by the vanilla-JS highlight function (kept for future use)
// const HASH_COMMENT = new Set([...])
const MAX_FILES = 1500
const MAX_READ = 160 * 1024
const MAX_TEXT_READS = 500
const MAX_NB_READ = 8 * 1024 * 1024

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScannedFile {
  path: string; name: string; ext: string; size: number
  mtime: number; handle: FileSystemFileHandle; lines: number | null; text: string | null
}

interface BBEvent {
  id: string; ts: number; analyzer: string; phase: string; type: string
  severity: string; title: string; detail: string
  decision: { question: string; options: string[] } | null
}

interface AgentState {
  id: string; name: string; phase: string; done: number; total: number
}

interface Finding { sev: string; text: string }

interface InterruptCard {
  id: string; route: 'decision' | 'alert' | 'blocker'
  event: BBEvent; answered?: string
}

export interface BobBreakState {
  view: 'recovery' | 'ide'
  status: { kind: string; text: string }
  agents: AgentState[]
  total: number; surfaced: number
  interrupts: InterruptCard[]
  report: { files: number; total: number; surfaced: number; pct: number; truncated: boolean; findings: Finding[] } | null
  logLines: { id: string; ts: string; analyzer: string; type: string; severity: string; title: string; detail: string; route: string }[]
  breathLabel: string; breathSecs: number; breathScale: number
  gardenTitle: string
  folderName: string
  hasAPI: boolean
  scanning: boolean
  showEmpty: boolean
  files: ScannedFile[]
}

export interface BobBreakActions {
  setView: (v: 'recovery' | 'ide') => void
  pickFolder: () => Promise<void>
  answerDecision: (cardId: string, option: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getExt = (p: string) => (p.split('.').pop() ?? '').toLowerCase()
const esc = (s: unknown) =>
  String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] ?? c))

let evSeq = 0
function mkEv(analyzer: string, o: Partial<BBEvent>): BBEvent {
  return Object.assign({
    id: 'evt_' + String(++evSeq).padStart(4, '0'),
    ts: Date.now(), analyzer, phase: 'working', type: 'progress',
    severity: 'info', detail: '', decision: null,
  }, o) as BBEvent
}

// ─── Directory walker ─────────────────────────────────────────────────────────
async function walk(
  dir: FileSystemDirectoryHandle, prefix: string, depth: number, out: ScannedFile[], truncated: { v: boolean },
) {
  if (depth > 8 || out.length >= MAX_FILES) return
  for await (const entry of (dir as unknown as { values(): AsyncIterable<FileSystemHandle> }).values()) {
    if (out.length >= MAX_FILES) { truncated.v = true; return }
    if (entry.name.startsWith('.') && entry.kind === 'directory' && !SKIP_DIRS.has(entry.name)) continue
    const path = prefix ? prefix + '/' + entry.name : entry.name
    if (entry.kind === 'directory') {
      if (SKIP_DIRS.has(entry.name)) continue
      await walk(entry as FileSystemDirectoryHandle, path, depth + 1, out, truncated)
    } else {
      let f: File
      try { f = await (entry as FileSystemFileHandle).getFile() } catch { continue }
      out.push({ path, name: entry.name, ext: getExt(entry.name), size: f.size, mtime: f.lastModified, handle: entry as FileSystemFileHandle, lines: null, text: null })
    }
  }
}

async function readSome(files: ScannedFile[]) {
  let budget = MAX_TEXT_READS
  for (const f of files) {
    if (budget <= 0) break
    const cap = f.ext === 'ipynb' ? MAX_NB_READ : MAX_READ
    if (!TEXT_EXT.has(f.ext) || f.size > cap) continue
    try {
      const t = await (await f.handle.getFile()).text()
      f.text = t; f.lines = t.split('\n').length; budget--
    } catch { /* skip */ }
  }
}

// ─── Analyzers ────────────────────────────────────────────────────────────────
const dep = (name: string, version: string, pinned: boolean) =>
  ({ name: String(name).trim(), version: version ? String(version).trim() : '', pinned: !!pinned })

function analyzeChange(files: ScannedFile[]) {
  const events: BBEvent[] = [], findings: Finding[] = []
  const code = files.filter(f => CODE_EXT.has(f.ext))
  const byExt: Record<string, number> = {}
  code.forEach(f => { byExt[f.ext] = (byExt[f.ext] || 0) + 1 })
  const top = Object.entries(byExt).sort((a, b) => b[1] - a[1]).slice(0, 4)
  events.push(mkEv('change', { title: `Scanning ${files.length} files`, detail: 'walking the directory tree' }))
  top.forEach(([e, n]) => events.push(mkEv('change', { title: `${n} .${e} files`, detail: `extension group .${e}` })))
  const lines = code.reduce((s, f) => s + (f.lines || 0), 0)
  if (lines) events.push(mkEv('change', { title: `${lines.toLocaleString()} lines of source read` }))
  const nbs = files.filter(f => f.ext === 'ipynb')
  if (nbs.length) {
    let cells = 0, withOutputs = 0, unparsed = 0
    nbs.forEach(f => {
      if (!f.text) { unparsed++; return }
      try {
        const cs = (JSON.parse(f.text).cells) || []
        cells += cs.length
        if (cs.some((c: {outputs?: unknown[]; execution_count?: unknown}) => (c.outputs && (c.outputs as unknown[]).length) || c.execution_count != null)) withOutputs++
      } catch { unparsed++ }
    })
    events.push(mkEv('change', { title: `${nbs.length} notebook${nbs.length > 1 ? 's' : ''}, ${cells} cells`, detail: nbs.slice(0, 3).map(f => f.path).join(', ') }))
    if (withOutputs) {
      events.push(mkEv('change', { type: 'risk', severity: 'warn', title: `${withOutputs} notebook${withOutputs > 1 ? 's' : ''} saved with outputs`, detail: 'execution counts and cell outputs are stored inside the file' }))
      findings.push({ sev: 'warn', text: `${withOutputs} notebook(s) carry saved outputs — diffs are noisy and result data ships with the code` })
    }
    if (unparsed) findings.push({ sev: 'info', text: `${unparsed} notebook(s) too large to parse` })
  }
  const recent = [...files].sort((a, b) => b.mtime - a.mtime).slice(0, 3)
  if (recent.length) {
    events.push(mkEv('change', { title: `Most recently changed: ${recent[0].name}`, detail: new Date(recent[0].mtime).toLocaleString() }))
    findings.push({ sev: 'info', text: `Newest file: <code>${esc(recent[0].path)}</code>` })
  }
  const big = code.filter(f => (f.lines || 0) > 400).sort((a, b) => (b.lines || 0) - (a.lines || 0))
  if (big.length) {
    events.push(mkEv('change', { type: 'risk', severity: 'warn', title: `${big.length} file${big.length > 1 ? 's' : ''} over 400 lines`, detail: big.slice(0, 3).map(f => `${f.path} (${f.lines})`).join(', ') }))
    findings.push({ sev: 'warn', text: `${big.length} oversized file(s), largest <code>${esc(big[0].path)}</code> at ${big[0].lines} lines` })
  }
  events.push(mkEv('change', { type: 'complete', phase: 'done', title: 'Change analysis complete' }))
  return { events, findings }
}

/* simplified dependency parsers */
function parseDeps(f: ScannedFile | undefined, name: string): { deps: ReturnType<typeof dep>[]; dev: ReturnType<typeof dep>[]; version: string | null } | null {
  if (!f?.text) return null
  try {
    if (name === 'package.json' || name === 'composer.json') {
      const j = JSON.parse(f.text)
      const conv = (o: Record<string, string> | undefined) => Object.entries(o ?? {}).map(([k, v]) => dep(k, v, /^\d/.test(String(v))))
      return { deps: conv(j.dependencies ?? j.require), dev: conv(j.devDependencies ?? j['require-dev']), version: j.version ?? null }
    }
    if (name === 'requirements.txt') {
      const deps = f.text.split('\n').map(l => l.split('#')[0].trim()).filter(l => l && !l.startsWith('-')).map(l => {
        const m = l.match(/^([A-Za-z0-9._-]+)\s*(\[.*?\])?\s*(.*)$/)
        if (!m) return null
        const spec = (m[3] ?? '').split(';')[0].trim()
        return dep(m[1], spec, spec.startsWith('=='))
      }).filter(Boolean) as ReturnType<typeof dep>[]
      return { deps, dev: [], version: null }
    }
    return null
  } catch { return null }
}

const MANIFESTS = [
  { name: 'package.json', eco: 'Node' },
  { name: 'requirements.txt', eco: 'Python' },
  { name: 'composer.json', eco: 'PHP' },
]
const LOCKFILES = /^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|Pipfile\.lock|Cargo\.lock|composer\.lock|Gemfile\.lock|go\.sum)$/

function analyzeDeps(files: ScannedFile[]) {
  const events: BBEvent[] = [], findings: Finding[] = []
  events.push(mkEv('deps', { title: 'Looking for a dependency manifest' }))
  const found = MANIFESTS.map(m => ({ m, f: files.find(x => x.name === m.name && x.text) })).filter(x => x.f)
  if (!found.length) {
    events.push(mkEv('deps', { type: 'blocker', severity: 'warn', phase: 'blocked', title: 'No dependency manifest in this project', detail: 'checked package.json, requirements.txt and composer.json' }))
    findings.push({ sev: 'warn', text: 'No dependency manifest — dependency drift could not be assessed' })
    events.push(mkEv('deps', { type: 'complete', phase: 'done', title: 'Dependency scan ended early' }))
    return { events, findings }
  }
  const primary = found[0]
  events.push(mkEv('deps', { title: `${primary.m.eco} project — reading ${primary.m.name}` }))
  const r = parseDeps(primary.f, primary.m.name)
  if (!r) {
    events.push(mkEv('deps', { type: 'risk', severity: 'critical', phase: 'blocked', title: `${primary.m.name} could not be parsed` }))
    findings.push({ sev: 'crit', text: `<code>${esc(primary.m.name)}</code> is malformed` })
    events.push(mkEv('deps', { type: 'complete', phase: 'done', title: 'Dependency scan aborted' }))
    return { events, findings }
  }
  const all = r.deps.concat(r.dev)
  events.push(mkEv('deps', { title: r.dev.length ? `${r.deps.length} dependencies, ${r.dev.length} dev dependencies` : `${r.deps.length} dependencies declared` }))
  if (r.version) findings.push({ sev: 'info', text: `Declared version <code>${esc(r.version)}</code>` })
  const loose = all.filter(d => !d.pinned)
  if (all.length && loose.length) {
    const pct = Math.round(loose.length / all.length * 100)
    if (pct >= 60) {
      events.push(mkEv('deps', { type: 'risk', severity: 'warn', title: 'Most dependencies float — builds are not reproducible' }))
      findings.push({ sev: 'warn', text: `${pct}% of dependencies are unpinned in <code>${esc(primary.m.name)}</code>` })
    }
  }
  const locks = files.filter(f => LOCKFILES.test(f.name))
  const npmLocks = locks.filter(f => /^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(f.name))
  if (npmLocks.length > 1) {
    events.push(mkEv('deps', { type: 'question', phase: 'waiting', severity: 'warn', title: 'More than one lockfile is present', detail: npmLocks.map(l => l.name).join(' · '), decision: { question: `This project contains ${npmLocks.map(l => l.name).join(' and ')}. Which one is authoritative?`, options: [...npmLocks.map(l => l.name), 'Decide later'] } }))
    findings.push({ sev: 'warn', text: `Conflicting lockfiles: ${npmLocks.map(l => '<code>' + esc(l.name) + '</code>').join(', ')}` })
  } else if (!locks.length) {
    events.push(mkEv('deps', { type: 'risk', severity: 'warn', title: 'No lockfile found' }))
    findings.push({ sev: 'warn', text: 'No lockfile — installs are not reproducible' })
  } else {
    events.push(mkEv('deps', { title: `Lockfile present: ${locks[0].name}` }))
  }
  events.push(mkEv('deps', { type: 'complete', phase: 'done', title: 'Dependency scan complete' }))
  return { events, findings }
}

function analyzeTests(files: ScannedFile[]) {
  const events: BBEvent[] = [], findings: Finding[] = []
  const isTest = (f: ScannedFile) =>
    /\.(test|spec)\.[jt]sx?$/.test(f.name) || /(^|\/)(__tests__|tests?)\//i.test(f.path) ||
    /^test_.*\.(py|rb)$/.test(f.name) || /_test\.(py|go|rb|js|ts)$/.test(f.name) ||
    /_spec\.rb$/.test(f.name) || /Test\.java$/.test(f.name)
  const tests = files.filter(isTest)
  const src = files.filter(f => CODE_EXT.has(f.ext) && !isTest(f))
  events.push(mkEv('tests', { title: 'Locating test files' }))
  if (!tests.length) {
    events.push(mkEv('tests', { type: 'blocker', phase: 'blocked', severity: 'warn', title: 'No test files found' }))
    findings.push({ sev: 'warn', text: 'No tests present — release confidence rests on manual checking' })
    events.push(mkEv('tests', { type: 'complete', phase: 'done', title: 'Test scan complete' }))
    return { events, findings }
  }
  events.push(mkEv('tests', { title: `${tests.length} test file${tests.length > 1 ? 's' : ''} found`, detail: tests.slice(0, 4).map(t => t.path).join(', ') }))
  const ratio = src.length ? tests.length / src.length : 0
  events.push(mkEv('tests', { title: `Test-to-source ratio ${(ratio * 100).toFixed(0)}%` }))
  if (ratio < 0.15) {
    events.push(mkEv('tests', { type: 'risk', severity: 'warn', title: 'Thin test coverage for this change surface' }))
    findings.push({ sev: 'warn', text: `Only ${tests.length} test file(s) for ${src.length} source files` })
  } else {
    findings.push({ sev: 'info', text: `${tests.length} test file(s) across ${src.length} source files` })
  }
  events.push(mkEv('tests', { type: 'complete', phase: 'done', title: 'Test scan complete' }))
  return { events, findings }
}

function analyzeDocs(files: ScannedFile[]) {
  const events: BBEvent[] = [], findings: Finding[] = []
  const readme = files.find(f => /^readme(\.md|\.txt)?$/i.test(f.name))
  const change = files.find(f => /^changelog(\.md)?$/i.test(f.name))
  const code = files.filter(f => CODE_EXT.has(f.ext))
  const newest = code.reduce((m, f) => f.mtime > (m?.mtime ?? 0) ? f : m, null as ScannedFile | null)
  events.push(mkEv('docs', { title: 'Checking project documentation' }))
  if (!readme) {
    events.push(mkEv('docs', { type: 'risk', severity: 'warn', title: 'No README found' }))
    findings.push({ sev: 'warn', text: 'No README in the project root' })
  } else {
    events.push(mkEv('docs', { title: `README present (${(readme.size / 1024).toFixed(1)} KB)` }))
    if (newest && newest.mtime - readme.mtime > 7 * 864e5) {
      const days = Math.round((newest.mtime - readme.mtime) / 864e5)
      events.push(mkEv('docs', { type: 'risk', severity: 'warn', title: `README is ${days} days behind the newest source file`, detail: `${newest.path} changed more recently than the README` }))
      findings.push({ sev: 'warn', text: `README trails <code>${esc(newest.path)}</code> by ${days} days` })
    }
  }
  if (!change) {
    events.push(mkEv('docs', { type: 'question', phase: 'waiting', severity: 'warn', title: 'No CHANGELOG in this project', detail: 'release notes would have to be written by hand', decision: { question: 'There is no CHANGELOG. Draft one from the files that changed most recently?', options: ['Draft a CHANGELOG', 'Skip for this release'] } }))
    findings.push({ sev: 'warn', text: 'No <code>CHANGELOG</code> — release notes are manual' })
  } else {
    events.push(mkEv('docs', { title: 'CHANGELOG present' }))
    findings.push({ sev: 'info', text: '<code>CHANGELOG</code> found and readable' })
  }
  events.push(mkEv('docs', { type: 'complete', phase: 'done', title: 'Documentation check complete' }))
  return { events, findings }
}

function buildRun(files: ScannedFile[]) {
  const parts = [analyzeChange(files), analyzeDeps(files), analyzeTests(files), analyzeDocs(files)]
  const queues = parts.map(p => p.events.slice())
  const findings = parts.flatMap(p => p.findings)
  const out: BBEvent[] = []
  while (queues.some(q => q.length)) {
    queues.forEach(q => { if (q.length) out.push(q.shift()!) })
  }
  return { events: out, findings }
}

function classify(e: BBEvent): 'decision' | 'alert' | 'blocker' | 'silent' {
  if (e.decision) return 'decision'
  if (e.severity === 'critical') return 'alert'
  if (e.type === 'blocker') return 'blocker'
  if (e.type === 'risk' && e.severity === 'warn') return 'blocker'
  return 'silent'
}

// ─── Breathing ────────────────────────────────────────────────────────────────
const BREATH: [string, number][] = [['Breathe in', 4], ['Hold', 2], ['Breathe out', 6]]

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useBobBreak(): [BobBreakState, BobBreakActions] {
  const [view, setView] = useState<'recovery' | 'ide'>('recovery')
  const [status, setStatus] = useState({ kind: 'idle', text: 'Idle' })
  const [agents, setAgents] = useState<AgentState[]>([
    { id: 'change', name: 'Change analysis', phase: 'planned', done: 0, total: 0 },
    { id: 'deps',   name: 'Dependencies',    phase: 'planned', done: 0, total: 0 },
    { id: 'tests',  name: 'Tests',           phase: 'planned', done: 0, total: 0 },
    { id: 'docs',   name: 'Documentation',   phase: 'planned', done: 0, total: 0 },
  ])
  const [total, setTotal] = useState(0)
  const [surfaced, setSurfaced] = useState(0)
  const [interrupts, setInterrupts] = useState<InterruptCard[]>([])
  const [report, setReport] = useState<BobBreakState['report']>(null)
  const [logLines, setLogLines] = useState<BobBreakState['logLines']>([])
  const [breathLabel, setBreathLabel] = useState('Breathe in')
  const [breathSecs, setBreathSecs] = useState(4)
  const [breathScale, setBreathScale] = useState(1.04)
  const [gardenTitle, setGardenTitle] = useState('Ready when you are.')
  const [folderName, setFolderName] = useState('Recovery mode')
  const [scanning, setScanning] = useState(false)
  const [showEmpty, setShowEmpty] = useState(true)
  const [files, setFiles] = useState<ScannedFile[]>([])

  const runRef = useRef<{ events: BBEvent[]; findings: Finding[]; idx: number; paused: boolean; timer: ReturnType<typeof setInterval> | null; agentsMap: Record<string, AgentState>; total: number; surfaced: number; truncated: boolean; fileCount: number }>({
    events: [], findings: [], idx: 0, paused: false, timer: null,
    agentsMap: {
      change: { id: 'change', name: 'Change analysis', phase: 'planned', done: 0, total: 0 },
      deps:   { id: 'deps',   name: 'Dependencies',    phase: 'planned', done: 0, total: 0 },
      tests:  { id: 'tests',  name: 'Tests',           phase: 'planned', done: 0, total: 0 },
      docs:   { id: 'docs',   name: 'Documentation',   phase: 'planned', done: 0, total: 0 },
    },
    total: 0, surfaced: 0, truncated: false, fileCount: 0,
  })

  // ─── Breathing loop ──────────────────────────────────────────────────────────
  const bStepRef = useRef(0)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const tick = () => {
      const [label, secs] = BREATH[bStepRef.current % BREATH.length]
      setBreathLabel(label)
      setBreathSecs(secs)
      setBreathScale(label === 'Breathe out' ? 0.86 : 1.04)
      bStepRef.current++
      t = setTimeout(tick, secs * 1000)
    }
    tick()
    return () => clearTimeout(t)
  }, [])

  // ─── Run step ─────────────────────────────────────────────────────────────────
  const step = useCallback(() => {
    const r = runRef.current
    if (r.paused) return
    if (r.idx >= r.events.length) {
      // finish
      clearInterval(r.timer!); r.timer = null
      Object.values(r.agentsMap).forEach(a => { if (a.phase !== 'blocked') a.phase = 'done' })
      setAgents(Object.values({ ...r.agentsMap }))
      setGardenTitle('Work finished. Here is what matters.')
      setStatus({ kind: 'ok', text: 'Run complete' })
      // build report
      const groups: Record<string, Finding[]> = { crit: [], warn: [], info: [] }
      r.findings.forEach(f => (groups[f.sev] ? groups[f.sev] : groups.info).push(f))
      const pct = r.total ? Math.round((1 - r.surfaced / r.total) * 100) : 0
      setReport({ files: r.fileCount, total: r.total, surfaced: r.surfaced, pct, truncated: r.truncated, findings: r.findings })
      return
    }
    const e = r.events[r.idx++]
    const route = classify(e)
    r.total++
    const a = r.agentsMap[e.analyzer]
    if (a) {
      a.done++
      a.phase = e.phase === 'done' ? 'done' : e.phase === 'blocked' ? 'blocked' : e.phase === 'waiting' ? 'waiting' : 'working'
    }
    // log
    const ts = new Date(e.ts).toLocaleTimeString('en-GB', { hour12: false })
    setLogLines(prev => [...prev.slice(-499), { id: e.id, ts, analyzer: e.analyzer, type: e.type, severity: e.severity, title: e.title, detail: e.detail, route }])
    // surface
    if (route !== 'silent') {
      r.surfaced++
      if (route === 'decision') {
        r.paused = true
        setStatus({ kind: 'decision', text: 'Decision needed' })
        setInterrupts(prev => [...prev, { id: e.id, route, event: e }])
      } else {
        const crit = route === 'alert'
        setInterrupts(prev => [...prev, { id: e.id, route, event: e }])
        setStatus({ kind: crit ? 'blocked' : 'decision', text: crit ? 'Attention required' : 'Blocker raised' })
        setTimeout(() => { if (!r.paused && r.timer) setStatus({ kind: 'ok', text: 'No action needed' }) }, 2600)
      }
    }
    setAgents(Object.values({ ...r.agentsMap }))
    setTotal(r.total)
    setSurfaced(r.surfaced)
  }, [])

  const startRun = useCallback((scannedFiles: ScannedFile[], findings: Finding[], events: BBEvent[], truncated: boolean) => {
    const r = runRef.current
    r.events = events; r.findings = findings; r.idx = 0
    r.total = 0; r.surfaced = 0; r.paused = false; r.truncated = truncated; r.fileCount = scannedFiles.length
    Object.keys(r.agentsMap).forEach(k => { r.agentsMap[k].done = 0; r.agentsMap[k].phase = 'planned'; r.agentsMap[k].total = events.filter(e => e.analyzer === k).length || 1 })
    setTotal(0); setSurfaced(0); setInterrupts([]); setReport(null); setLogLines([])
    setGardenTitle('Bob and the agents are working.')
    setStatus({ kind: 'ok', text: 'No action needed' })
    setAgents(Object.values({ ...r.agentsMap }))
    if (r.timer) clearInterval(r.timer)
    r.timer = setInterval(step, 260)
  }, [step])

  // ─── Pick folder ──────────────────────────────────────────────────────────────
  const pickFolder = useCallback(async () => {
    const w = window as unknown as { showDirectoryPicker?: (opts: unknown) => Promise<FileSystemDirectoryHandle> }
    if (!w.showDirectoryPicker) return
    let dir: FileSystemDirectoryHandle
    try { dir = await w.showDirectoryPicker({ mode: 'read' }) } catch { return }
    setFolderName(dir.name)
    setShowEmpty(false)
    setScanning(true)
    setStatus({ kind: 'idle', text: 'Scanning…' })
    const out: ScannedFile[] = []
    const truncated = { v: false }
    await walk(dir, '', 0, out, truncated)
    out.sort((a, b) => a.path.localeCompare(b.path))
    await readSome(out)
    setFiles(out)
    setScanning(false)
    const { events, findings } = buildRun(out)
    startRun(out, findings, events, truncated.v)
  }, [startRun])

  const answerDecision = useCallback((cardId: string, option: string) => {
    setInterrupts(prev => prev.map(c => c.id === cardId ? { ...c, answered: option } : c))
    runRef.current.findings.push({ sev: 'info', text: `You chose <strong>${esc(option)}</strong>` })
    runRef.current.paused = false
    setStatus({ kind: 'ok', text: 'No action needed' })
  }, [])

  const hasAPI = typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function'

  const state: BobBreakState = {
    view, status, agents, total, surfaced, interrupts, report, logLines,
    breathLabel, breathSecs, breathScale, gardenTitle, folderName,
    hasAPI, scanning, showEmpty, files,
  }
  const actions: BobBreakActions = {
    setView: (v) => setView(v),
    pickFolder,
    answerDecision,
  }
  return [state, actions]
}
