import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Award, Sparkles } from 'lucide-react';

const ConfidenceGauge = ({ value }) => {
  const angle = (value / 100) * 180;
  const r = 40;
  const cx = 50, cy = 50;
  const startX = cx - r, startY = cy;
  const endAngle = (angle - 180) * (Math.PI / 180);
  const endX = cx + r * Math.cos(endAngle);
  const endY = cy + r * Math.sin(endAngle);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="55" viewBox="0 0 100 55">
        <path d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="6" strokeLinecap="round" />
        {value > 0 && (
          <path d={`M ${startX} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`} fill="none" stroke="#c9a84c" strokeWidth="6" strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(201,168,76,0.6))' }} />
        )}
        <text x="50" y="48" textAnchor="middle" className="text-sm font-bold" fill="#e8c97a" style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}%</text>
      </svg>
      <span className="text-xs text-[#f5f0e8]/50">Confidence</span>
    </div>
  );
};

const AnalysisColumn = ({ title, data }) => (
  <div className="flex-1 bg-white/[0.03] rounded-xl p-4 border border-[#c9a84c]/10">
    <h4 className="text-xs font-semibold text-[#e8c97a] uppercase tracking-wider mb-3">{title}</h4>
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => {
        if (key === 'notable_marks') {
          return (
            <div key={key}>
              <span className="text-xs text-[#f5f0e8]/40 capitalize">{key.replace(/_/g, ' ')}:</span>
              {Array.isArray(value) && value.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {value.map((m, i) => <span key={i} className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">{m}</span>)}
                </div>
              ) : <span className="text-xs text-[#f5f0e8]/30 ml-1">None noted</span>}
            </div>
          );
        }
        return (
          <div key={key} className="flex gap-2">
            <span className="text-xs text-[#f5f0e8]/40 capitalize shrink-0" style={{ minWidth: '80px' }}>{key.replace(/_/g, ' ')}:</span>
            <span className="text-xs text-[#f5f0e8]/80">{value}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export default function AIGradingCard({ grading, onAccept, userGrade }) {
  const [expanded, setExpanded] = useState(true);

  if (!grading) return null;

  const accepted = userGrade === grading.suggested_grade;

  return (
    <div className="rounded-2xl border border-[#c9a84c]/30 overflow-hidden"
      style={{ background: 'rgba(17,24,39,0.8)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r from-[#c9a84c]/10 to-transparent"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#e8c97a]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {grading.suggested_grade}
              </span>
              <span className="text-sm text-[#f5f0e8]/50">{grading.grade_description}</span>
            </div>
            <p className="text-xs text-[#f5f0e8]/40">Range: {grading.estimated_grade_range}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ConfidenceGauge value={grading.confidence} />
          {expanded ? <ChevronUp className="w-4 h-4 text-[#f5f0e8]/40" /> : <ChevronDown className="w-4 h-4 text-[#f5f0e8]/40" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Analysis columns */}
          <div className="flex gap-3">
            <AnalysisColumn title="Obverse Analysis" data={grading.obverse_analysis} />
            <AnalysisColumn title="Reverse Analysis" data={grading.reverse_analysis} />
          </div>

          {/* Rationale */}
          <div className="bg-white/[0.03] rounded-xl p-4 border border-[#c9a84c]/10">
            <h4 className="text-xs font-semibold text-[#e8c97a] uppercase tracking-wider mb-2">Grading Rationale</h4>
            <p className="text-sm text-[#f5f0e8]/70 leading-relaxed">{grading.grading_rationale}</p>
          </div>

          {/* Red flags */}
          {grading.red_flags?.length > 0 && (
            <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Red Flags</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {grading.red_flags.map((flag, i) => (
                  <span key={i} className="text-xs bg-amber-500/10 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/20">{flag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Professional submission */}
          {grading.professional_submission_recommended && (
            <div className="flex items-center gap-2 bg-blue-500/5 rounded-xl p-3 border border-blue-500/20">
              <Award className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Professional submission (PCGS/NGC) recommended for this coin</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => onAccept(grading.suggested_grade)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${accepted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[#c9a84c]/20 text-[#e8c97a] border border-[#c9a84c]/30 hover:bg-[#c9a84c]/30'}`}>
              <CheckCircle className="w-4 h-4" />
              {accepted ? 'Grade Accepted' : `Accept AI Grade (${grading.suggested_grade})`}
            </button>
          </div>

          <p className="text-xs text-[#f5f0e8]/30 italic">
            AI grading is for reference only. Professional grading services provide certified, guaranteed grades.
          </p>
        </div>
      )}
    </div>
  );
}