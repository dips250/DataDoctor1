'use client';

import { useEffect, useRef, useState } from 'react';
import { EvidenceGraph } from './EvidenceGraph';
import type { AnalysisResult } from '@/lib/types';

type ServiceStatus = { llm: boolean; publicRecords: boolean; voice: boolean };

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ServiceStatus>({ llm: false, publicRecords: false, voice: false });
  const [activeTab, setActiveTab] = useState<'symptoms' | 'chain'>('symptoms');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [briefBusy, setBriefBusy] = useState(false);
  const [briefError, setBriefError] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/status').then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  async function demo() {
    await run('/api/demo');
  }

  async function run(url: string, files?: File[]) {
    setBusy(true);
    setError('');
    try {
      let response: Response;
      if (files) {
        const fd = new FormData();
        files.forEach((file) => fd.append('files', file));
        fd.set('primaryIndex', '0');
        response = await fetch('/api/analyze', { method: 'POST', body: fd });
      } else {
        response = await fetch(url);
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'The analysis could not be completed.');
      setResult(data);
      setActiveTab('symptoms');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The analysis could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  function filesChosen(files: FileList | null) {
    if (files?.length) void run('/api/analyze', Array.from(files));
  }

  async function createBrief() {
    if (!result) return;
    setBriefBusy(true);
    setBriefError('');
    try {
      const summary = `Evidence Health score ${result.score.overall}. Findings: ${result.findings.map((f) => `${f.title}. ${f.whatWasFound}.`).join(' ')} ${result.score.meaning}`;
      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: summary }),
      });
      if (!response.ok) {
        const body = await response.json();
        if (body.privacy) {
          setResult((current) => current ? { ...current, privacy: { ...current.privacy, externalCalls: [...current.privacy.externalCalls, body.privacy] } } : current);
        }
        throw new Error(body.error ?? 'The spoken briefing is unavailable.');
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const blob = await response.blob();
      setAudioUrl(URL.createObjectURL(blob));
      let redactions: Record<string, number> = {};
      try { redactions = JSON.parse(response.headers.get('x-redaction-counts') ?? '{}'); } catch { /* Header is advisory. */ }
      setResult((current) => current ? {
        ...current,
        privacy: {
          ...current.privacy,
          externalCalls: [...current.privacy.externalCalls, {
            service: response.headers.get('x-privacy-service') ?? 'ElevenLabs',
            purpose: response.headers.get('x-privacy-purpose') ?? 'Spoken briefing',
            redactions,
          }],
        },
      } : current);
    } catch (cause) {
      setBriefError(cause instanceof Error ? cause.message : 'The spoken briefing is unavailable.');
    } finally {
      setBriefBusy(false);
    }
  }

  const labelTone = (label: string) => label === 'POTENTIAL_CONCERN' ? 'concern' : label === 'UNKNOWN' ? 'unknown' : label === 'INTERPRETATION' ? 'interpretation' : 'fact';

  return (
    <main className="shell">
      <header className="top">
        <a className="brand" href="#top" aria-label="EvidenceDoctor home">
          <span className="brandmark" aria-hidden="true"><i /><i /><i /></span>
          <span>evidence<span className="brandlight">doctor</span></span>
          <span className="brandtag">FIELD INTELLIGENCE</span>
        </a>
        <div className="topright">
          <span className="live-indicator"><i /> SYSTEM READY</span>
          <a href="#about">How it works <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      {!result ? (
        <section className="intake" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrowline" /> EVIDENCE INVESTIGATION <span className="eyebrowsep">/</span> CYBERSECURITY &amp; PRIVACY</p>
            <h1>Trust is earned.<br /><span>Evidence is examined.</span></h1>
            <p className="lede">Trace a report back to the sources beneath it. Surface gaps, conflicts, and hidden instructions before the claims shape a decision.</p>
            <div className="hero-actions">
              <button className="button primary-cta" onClick={demo} disabled={busy}>
                <span>{busy ? 'Investigating…' : 'Launch demo investigation'}</span><span className="buttonarrow" aria-hidden="true">↗</span>
              </button>
              <a className="download" href="/demo/primary-report.pdf" download>Get the sample report <span aria-hidden="true">↓</span></a>
            </div>
            <div className="trust-note"><span className="shield-icon" aria-hidden="true">◇</span><span><b>Private by design</b><small>Processed in memory. Nothing is stored.</small></span></div>
          </div>

          <div className="intake-side">
            <div className="side-meta"><span>INVESTIGATION CONSOLE</span><span>ED / 001</span></div>
            <div className={`drop ${drag ? 'drag' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); filesChosen(e.dataTransfer.files); }}>
              <div className="drop-orbit" aria-hidden="true"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><span className="upload-glyph">↑</span></div>
              <p className="drop-kicker">START WITH THE SOURCE</p>
              <h2>Bring the evidence<br />into focus.</h2>
              <p className="drop-copy">Choose a report and, if available, the sources it cites.</p>
              <button className="button secondary browse" onClick={() => input.current?.click()} disabled={busy}>Select documents <span aria-hidden="true">＋</span></button>
              <input ref={input} hidden type="file" multiple accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={(e) => filesChosen(e.target.files)} />
              <p className="file-limit">PDF, TXT, MD <span>·</span> 10 MB each <span>·</span> up to 6 files</p>
            </div>
            <div className="console-footer"><span><i className="statusdot" /> READY FOR INPUT</span><span>DROP FILES TO BEGIN</span></div>
          </div>

          {error && <div role="alert" className="error"><b>We couldn’t analyze that document</b><p>{error}</p></div>}

          <div className="capabilities">
            <div className="cap-intro"><span className="eyebrowline" /> REVIEW CAPABILITIES</div>
            <div className="capability"><span className="cap-number">01</span><span><b>Trace sources</b><small>Follow claims to their roots</small></span><span className="cap-arrow">↗</span></div>
            <div className="capability"><span className="cap-number">02</span><span><b>Surface signals</b><small>Spot gaps and relationships</small></span><span className="cap-arrow">↗</span></div>
            <div className="capability"><span className="cap-number">03</span><span><b>Inspect the unseen</b><small>Reveal hidden AI instructions</small></span><span className="cap-arrow">↗</span></div>
          </div>
          <div className="service-strip">
            <span className="service-label">OPTIONAL CONNECTIONS</span>
            <ServicePill label="AI extraction" active={status.llm} />
            <ServicePill label="Public records" active={status.publicRecords} />
            <ServicePill label="Voice briefing" active={status.voice} />
            <span className="service-note">OFFLINE-CAPABLE CORE</span>
          </div>
        </section>
      ) : (
        <section className="results">
          <div className="resulthead">
            <div>
              <p className="eyebrow"><span className="eyebrowline" /> INVESTIGATION REPORT <span className="eyebrowsep">/</span> CASE FILE</p>
              <h1>{result.docs.find((doc) => doc.role === 'primary')?.pages[0]?.text.match(/^#\s*(.+)$/m)?.[1] ?? result.docs.find((doc) => doc.role === 'primary')?.fileName}</h1>
              <p className="muted"><span className="resultpulse" /> {result.docs.length} document{result.docs.length === 1 ? '' : 's'} reviewed <span className="dotsep">·</span> Analysis completed in memory</p>
            </div>
            <button className="button secondary new-review" onClick={() => { setResult(null); setError(''); }}>＋ New investigation</button>
          </div>

          <div className="scoregrid">
            <div className="scorecard">
              <div className="score-ring-wrap"><span className="score-orbit" /><div className="ring" style={{ '--score': `${result.score.overall}%` } as React.CSSProperties}><span>{result.score.overall}<small>/100</small></span></div><span className="ring-caption">EVIDENCE HEALTH</span></div>
              <div className="score-copy"><p className="eyebrow">SIGNAL SUMMARY</p><h2>Evidence Health</h2><p>{result.score.meaning}</p><span className="score-caveat">A review signal, not a measure of truth. Not scientifically validated.</span></div>
            </div>
            <div className="categories"><div className="categories-head"><span>REVIEW DIMENSIONS</span><span>SCORE</span></div>{result.score.categories.map((category, index) => <details key={category.name} open={index === 0}><summary><span>{category.name}</span><b>{category.score}<small>/100</small></b></summary><div className="bar"><i style={{ width: `${category.score}%` }} /></div>{category.reasons.length > 0 ? <ul>{category.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : <p>No score deductions in this category.</p>}</details>)}</div>
          </div>

          {result.findings.filter((finding) => finding.type === 'hidden_instruction').map((finding) => (
            <article className="hiddenalert" key={finding.id}>
              <div className="alerticon">!</div><div className="alertbody"><p className="eyebrow">HIDDEN TEXT REVEALED <span className="eyebrowsep">/</span> PAGE {finding.evidence[0]?.page}</p><h2>{finding.title}</h2>
                <blockquote>{finding.evidence[0]?.quote}</blockquote>
                <button className="textbutton" onClick={() => { setSelectedFindingId(finding.id); setActiveTab('chain'); }}>Trace in evidence chain <span>↗</span></button>
                <p className="alert-method">Detection method: {finding.evidence[0]?.method}. Hidden text was excluded from claim extraction.</p><Evidence f={finding} />
              </div>
            </article>
          ))}

          <div className="tabrow" role="tablist" aria-label="Investigation views"><div className="tabs-label">INVESTIGATION DETAIL</div><button role="tab" aria-selected={activeTab === 'symptoms'} className={activeTab === 'symptoms' ? 'selected' : ''} onClick={() => setActiveTab('symptoms')}><span className="tab-icon">⌁</span> Findings <small>{result.findings.length}</small></button><button role="tab" aria-selected={activeTab === 'chain'} className={activeTab === 'chain' ? 'selected' : ''} onClick={() => setActiveTab('chain')}><span className="tab-icon">⌘</span> Evidence chain</button><span className="graph-count">{result.graph.nodes.length} NODES <i /> {result.graph.edges.length} LINKS</span></div>
          {activeTab === 'symptoms' ? <div className="findings">{[...result.findings].filter((finding) => finding.type !== 'hidden_instruction').sort((a, b) => ({ high: 0, medium: 1, low: 2, info: 3 }[a.severity] - ({ high: 0, medium: 1, low: 2, info: 3 }[b.severity]))).map((finding, index) => <article className="finding" key={finding.id}>
            <div className="findingtop"><span className="finding-index">SIGNAL {String(index + 1).padStart(2, '0')}</span><span className={`chip ${labelTone(finding.label)}`}><i />{finding.label.replace('_', ' ')}</span><span className={`severity severity-${finding.severity}`}>{finding.severity}</span></div>
            <h3>{finding.title}</h3><p>{finding.whatWasFound}</p><div className="why"><b>WHY IT MATTERS</b><p>{finding.whyItMatters}</p></div><p className="uncertain"><span>LIMITS</span> {finding.uncertainty}</p>
            <details className="finding-evidence"><summary><span>Evidence references</span><b>{String(finding.evidence.length).padStart(2, '0')} <i>＋</i></b></summary><Evidence f={finding} /></details>
            <button className="textbutton" onClick={() => { setSelectedFindingId(finding.id); setActiveTab('chain'); }}>Trace finding <span>↗</span></button>
          </article>)}</div> : <EvidenceGraph result={result} selectedFindingId={selectedFindingId} />}

          <div className="sectiontitle"><div><p className="eyebrow"><span className="eyebrowline" /> RECOMMENDED ACTIONS</p><h2>Treatment plan</h2></div><span>YOUR NEXT INVESTIGATION STEPS</span></div>
          <div className="treatment">{[...new Set(result.findings.flatMap((finding) => finding.recommendedActions))].map((action, index) => <label key={index}><input type="checkbox"/><span className="treatment-no">{String(index + 1).padStart(2, '0')}</span><span>{action}</span><i>↗</i></label>)}</div>

          <div className="twocol"><section><div className="sectiontitle"><div><p className="eyebrow"><span className="eyebrowline" /> PROCESS TRACE</p><h2>Lab log</h2></div></div><div className="log">{result.labLog.map((entry, index) => <div key={index}><span className="log-index">{String(index + 1).padStart(2, '0')}</span><span className="log-stage">{entry.stage}</span><span>{entry.detail}</span><b>{entry.ms}<small> ms</small></b></div>)}</div></section><section><div className="sectiontitle"><div><p className="eyebrow"><span className="eyebrowline" /> TRANSPARENCY RECORD</p><h2>Privacy receipt</h2></div></div><div className="receipt"><div className="receipt-seal">◇</div><div><span className="receipt-status"><i /> IN-MEMORY SESSION</span><b>{result.privacy.statement}</b><p>Storage status <strong>None</strong></p><p>{result.privacy.externalCalls.length ? result.privacy.externalCalls.map((call) => `${call.service}: ${call.purpose}`).join(' · ') : 'No external services were contacted.'}</p></div></div></section></div>

          <div className="printrow">{result.mode.voice && <div className="briefing"><button className="button secondary" onClick={createBrief} disabled={briefBusy}>{briefBusy ? 'Preparing briefing…' : 'Create spoken briefing'}</button>{audioUrl && <audio controls src={audioUrl} aria-label="Doctor's briefing audio" />}{briefError && <p role="alert">{briefError}</p>}</div>}<button className="button secondary print-button" onClick={() => window.print()}><span>↗</span> Export report</button></div>
        </section>
      )}

      <footer id="about"><span>EvidenceDoctor <i>—</i> Evidence, examined.</span><p>EvidenceDoctor does not tell you what to believe. It tells you what to investigate before you believe it.</p><span className="footer-right">PRIVACY FIRST <i /> DOCUMENTS ARE ANALYZED IN MEMORY</span></footer>
    </main>
  );
}

function ServicePill({ label, active }: { label: string; active: boolean }) {
  return <span className={`service-pill ${active ? 'active' : ''}`}><i />{label}<small>{active ? 'ON' : 'OFF'}</small></span>;
}

function Evidence({ f }: { f: AnalysisResult['findings'][number] }) {
  return <ul className="evidence">{f.evidence.map((evidence, index) => <li key={index}>{evidence.kind === 'quote' ? <><blockquote>“{evidence.quote}”</blockquote><span>{evidence.fileName}{evidence.page ? ` · page ${evidence.page}` : ''}{evidence.method ? ` · ${evidence.method}` : ''}</span></> : <a href={evidence.url} target="_blank" rel="noreferrer">{evidence.note ?? evidence.url}</a>}</li>)}</ul>;
}
