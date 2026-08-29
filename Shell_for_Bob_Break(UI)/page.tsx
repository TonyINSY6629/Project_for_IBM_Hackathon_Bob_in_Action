"use client";

import { useEffect, useState } from "react";
import { Check, Circle, Eye, EyeOff, Flower2, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const agents = [
  { name: "Diff analysis", delay: 0, rate: 2.2 },
  { name: "Dependencies", delay: 5, rate: 1.8 },
  { name: "Tests", delay: 10, rate: 2.1 },
  { name: "Documentation", delay: 15, rate: 1.9 },
];

export default function Home() {
  const [recovery, setRecovery] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!recovery) return;
    const timer = window.setInterval(() => setTick((value) => (value >= 72 ? 0 : value + 1)), 650);
    return () => window.clearInterval(timer);
  }, [recovery]);
  const progressValues = agents.map(({ delay, rate }) => Math.min(100, Math.max(0, Math.round((tick - delay) * rate))));
  const completed = progressValues.filter((progress) => progress === 100).length;
  const active = progressValues.filter((progress) => progress > 0 && progress < 100).length;
  return (
    <main className={`demo ${recovery ? "recovery-on" : "recovery-off"}`}>
      <img className="ide-background" src="/ide-bob.png" alt="IBM Bob running inside a code editor" />
      <div className="comparison-control">
        <span className={!recovery ? "active" : ""}><Eye size={16} /> IDE view</span>
        <div className="switch-control">
          <small>Switch view</small>
          <Switch className="mode-switch" checked={recovery} onCheckedChange={setRecovery} aria-label="Switch between the normal IDE and Bob Break recovery mode" />
        </div>
        <span className={recovery ? "active" : ""}><Leaf size={16} /> Bob Break</span>
      </div>
      <div className="recovery-veil" aria-hidden={!recovery} />
      <section className="recovery-surface" aria-hidden={!recovery}>
        <header className="surface-header">
          <div><span className="brand-mark"><Leaf size={18} /></span><div><strong>Bob Break</strong><small>Recovery mode</small></div></div>
          <div className="safe-status"><ShieldCheck size={16} /> No action needed</div>
        </header>
        <div className="surface-body">
          <section className="garden-panel" aria-labelledby="garden-title">
            <p className="overline">Agent garden</p>
            <h1 id="garden-title">Bob and the agents are working.</h1>
            <p className="calm-copy">You do not need to monitor every update. We will interrupt only when your attention is required.</p>
            <div className="agent-grid">
              {agents.map(({ name }, index) => {
                const progress = progressValues[index];
                const Icon = progress === 0 ? Circle : progress < 40 ? Sprout : progress < 100 ? Leaf : Flower2;
                const state = progress === 0 ? "Planned" : progress === 100 ? "Complete" : "Growing";
                return (
                <article className={`agent ${progress === 100 ? "agent-complete" : ""}`} key={name}>
                  <div className={`plant stage-${progress === 0 ? "seed" : progress < 40 ? "sprout" : progress < 100 ? "leaf" : "flower"}`} style={{ "--growth": Math.max(.45, progress / 100) } as React.CSSProperties}><Icon size={30} strokeWidth={1.4} /></div>
                  <strong>{name}</strong>
                  <div className="progress-track" role="progressbar" aria-label={`${name} progress`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
                  <small><b>{progress}%</b> · {state}</small>
                </article>
              )})}
            </div>
            <div className="evidence">
              <div><strong>42</strong><span>events received</span></div>
              <div><strong>4</strong><span>surfaced</span></div>
              <div className="noise"><strong>90%</strong><span>less visual noise</span></div>
            </div>
          </section>
          <section className="breathing-panel" aria-label="Guided breathing exercise">
            <p className="overline">30-second reset</p>
            <div className="breathing-space"><div className="breathing-ring"><div><span>Breathe out</span><small>6 seconds</small></div></div></div>
            <div className="essential-status" aria-live="polite"><Check size={16} /><span>{active} active · {completed} complete</span></div>
            <button className="details-button" type="button"><EyeOff size={15} /> Technical details hidden</button>
          </section>
        </div>
      </section>
      {!recovery && <div className="normal-caption"><strong>Without Bob Break</strong><span>Continuous code, logs and agent output compete for attention.</span></div>}
    </main>
  );
}
