import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Award, Sparkles } from 'lucide-react';

const ConfidenceGauge = ({ value }) => {
  const angle = (value / 100) * 180;
  const r = 40; const cx = 50; const cy = 50;
  const startX = cx - r; const startY = cy;
  const endAngle = (angle - 180) * (Math.PI / 180);
  const endX = cx + r * Math.cos(endAngle); const endY = cy + r * Math.sin(endAngle);
  const largeArc = angle > 180 ? 1 : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="55" viewBox="0 0 100 55">
        <path d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--cv-accent-border)" strokeWidth="6" strokeLinecap="round" />
        {value > 0 && <path d={`M ${startX} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`} fill="none" stroke="var(--cv-accent-dim)" strokeWidth="6" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px var(--cv-accent-border))' }} />}
        <text x="50" y="48" textAnchor="middle" fill="var(--cv-accent)" style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}%</text>
      </svg>
      <span className="text-xs" style={{ color: 'var(--cv-text-secondary)' }}>Confidence</span>
    </div>
  );
};

const AnalysisColumn = ({ title, data }) => (
  <div className="flex-1 rounded-xl p-4" style={{ background: 'var(--cv-bg-card)', border: '1px solid var(--cv-border)' }}>
    <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--cv-accent)' }}>{title}</h4>
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => {
        if (key === 'notable_marks') return (
          <div key={key}>
            <span className="text-xs capitalize" style={{ color: 'var(--cv-text-muted)' }}>{key.replace(/_/g, ' ')}:</span>
            {Array.isArray(value) && value.length > 0 ? <div className="flex flex-wrap gap-1 mt-1">{value.map((m, i) => <span key={i} className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">{m}</span>)}</div> : <span className="text-xs ml-1" style={{ color: 'var(--cv-text-muted)' }}>None noted</span>}
          </div>
        );
        return (
          <div key={key} className="flex gap-2">
            <span className="text-xs capitalize shrink-0" style={{ minWidth: '80px', color: 'var(--cv-text-muted)' }}>{key.replace(/_/g, ' ')}:</span>
            <span className="text-xs" style={{ color: 'var(--cv-text)' }}>{value}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export default function AIGradingCard({ grading, grade, onAccept, userGrade }) {
  const [expanded, setExpanded] = useState(true);
  // Support both "grading" and "grade" prop names for backward compat
  const data = grading || grade;
  if (!data) return null;
  const accepted = userGrade === data.suggested_grade;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--cv-accent-border)', background: 'var(--cv-bg-elevated)', boxShadow: '0 8px 32px var(--cv-overlay)' }}>
      <div className="flex items-center justify-between p-4 cursor-pointer" style={{ background: 'var(--cv-accent-bg)' }} onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" style={{ color: 'var(--cv-accent)' }} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>{data.suggested_grade}</span>
              <span className="text-sm" style={{ color: 'var(--cv-text-secondary)' }}>{data.grade_description}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>Range: {data.estimated_grade_range}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ConfidenceGauge value={data.confidence} />
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--cv-text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--cv-text-muted)' }} />}
        </div>
      </div>
      {expanded && (
        <div className="p-4 space-y-4">
          {data.obverse_analysis && data.reverse_analysis && (
            <div className="flex flex-col sm:flex-row gap-3">
              <AnalysisColumn title="Obverse Analysis" data={data.obverse_analysis} />
              <AnalysisColumn title="Reverse Analysis" data={data.reverse_analysis} />
            </div>
          )}
          {data.grading_rationale && (
            <div className="rounded-xl p-4" style={{ background: 'var(--cv-bg-card)', border: '1px solid var(--cv-border)' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cv-accent)' }}>Grading Rationale</h4>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--cv-text-secondary)' }}>{data.grading_rationale}</p>
            </div>
          )}
          {data.red_flags?.length > 0 && (
            <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-amber-400" /><h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Red Flags</h4></div>
              <div className="flex flex-wrap gap-2">{data.red_flags.map((flag, i) => <span key={i} className="text-xs bg-amber-500/10 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/20">{flag}</span>)}</div>
            </div>
          )}
          {data.professional_submission_recommended && (
            <div className="flex items-center gap-2 bg-blue-500/5 rounded-xl p-3 border border-blue-500/20">
              <Award className="w-4 h-4 text-blue-400" /><span className="text-sm text-blue-300">Professional submission (PCGS/NGC) recommended</span>
            </div>
          )}
          <div className="pt-1">
            <button onClick={() => onAccept(data.suggested_grade)}
              className={`flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${accepted ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'border'}`}
              style={!accepted ? { background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)', borderColor: 'var(--cv-accent-border)' } : {}}>
              <CheckCircle className="w-4 h-4" /> {accepted ? 'Grade Accepted' : `Accept AI Grade (${data.suggested_grade})`}
            </button>
          </div>
          <p className="text-xs italic" style={{ color: 'var(--cv-text-muted)' }}>AI grading is for reference only. Professional grading services provide certified, guaranteed grades.</p>
        </div>
      )}
    </div>
  );
}