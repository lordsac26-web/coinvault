import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ExternalLink, Plus, Search, ScanBarcode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BarcodeScanner from '@/components/BarcodeScanner';

// Parse known certification number patterns from barcode values
function parseCertNumber(rawValue) {
  // Typical PCGS/NGC cert numbers: pure numeric, 7-10+ digits
  const cleaned = rawValue.replace(/\s+/g, '').trim();
  // If it's a URL, try to extract cert number from it
  const urlMatch = cleaned.match(/(?:cert|barcode|id)[=/](\d{5,})/i) ||
                   cleaned.match(/(\d{7,})/);
  if (urlMatch) return urlMatch[1];
  // If just digits, return as-is
  if (/^\d{5,}$/.test(cleaned)) return cleaned;
  return cleaned;
}

export default function ScanLookup({ onClose }) {
  const [showScanner, setShowScanner] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [scanFormat, setScanFormat] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDetected = ({ rawValue, format }) => {
    setShowScanner(false);
    const parsed = parseCertNumber(rawValue);
    setCertNumber(parsed);
    setScanFormat(format);
    lookupCert(parsed, rawValue);
  };

  const handleManualLookup = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    setCertNumber(trimmed);
    setScanFormat('manual');
    lookupCert(trimmed, trimmed);
  };

  const lookupCert = async (certNum, rawValue) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert numismatist. A user scanned a coin certification barcode or QR code and got this value: "${rawValue}".
The parsed certification number is: "${certNum}".

Research this certification number across PCGS (pcgs.com), NGC (ngccoin.com), ANACS, ICG, and CAC databases. 
Look up the coin details associated with this certification number.

If it's a valid cert number, provide the full coin details. If you cannot find an exact match, provide your best interpretation of what this barcode/cert number refers to and suggest what coin it might be.

Be specific with all values. If uncertain, note that in the notes field.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            found: { type: "boolean", description: "Whether a definitive match was found" },
            grading_service: { type: "string", description: "PCGS, NGC, ANACS, ICG, etc." },
            cert_number: { type: "string" },
            coin_name: { type: "string", description: "Full coin name, e.g. '1964 Kennedy Half Dollar'" },
            country: { type: "string" },
            denomination: { type: "string" },
            year: { type: "string" },
            mint_mark: { type: "string" },
            coin_series: { type: "string" },
            composition: { type: "string" },
            grade: { type: "string", description: "Certified grade, e.g. MS-65, PR-69" },
            designation: { type: "string", description: "Special designations like DCAM, RD, FB, etc." },
            estimated_value: { type: "string", description: "Estimated current value" },
            population: { type: "string", description: "Population/census data if available" },
            verification_url: { type: "string", description: "URL to verify this cert on the grading service website" },
            notes: { type: "string", description: "Additional notes or caveats about this lookup" },
          }
        },
        model: "gemini_3_flash"
      });
      setResult(data);
    } catch (err) {
      console.error('Cert lookup failed:', err);
      setError('Lookup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup scanner when overlay is closed externally (e.g., back gesture)
  useEffect(() => {
    return () => setShowScanner(false);
  }, []);

  if (showScanner) {
    return <BarcodeScanner onDetected={handleDetected} onClose={() => { setShowScanner(false); }} />;
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: 'var(--cv-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0" style={{ borderBottom: '1px solid var(--cv-border)' }}>
        <h2 className="text-base font-bold" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
          Cert Scanner
        </h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--cv-input-bg)' }}>
          <X className="w-5 h-5" style={{ color: 'var(--cv-text)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Scan button */}
        <button onClick={() => setShowScanner(true)}
          className="w-full flex flex-col items-center gap-3 py-8 rounded-2xl transition-all active:scale-[0.98]"
          style={{ background: 'var(--cv-accent-bg)', border: '1px solid var(--cv-accent-border)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--cv-accent-dim)' }}>
            <ScanBarcode className="w-7 h-7" style={{ color: 'var(--cv-accent-text)' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: 'var(--cv-accent)' }}>Scan Barcode / QR Code</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--cv-text-muted)' }}>PCGS, NGC, ANACS certification labels</p>
          </div>
        </button>

        {/* Manual entry */}
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: 'var(--cv-text-muted)' }}>Or enter certification number manually</p>
          <div className="flex gap-2">
            <Input value={manualInput} onChange={e => setManualInput(e.target.value)}
              placeholder="e.g. 38714578"
              className="flex-1 h-11 rounded-xl"
              onKeyDown={e => e.key === 'Enter' && handleManualLookup()}
              style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
            <Button onClick={handleManualLookup} disabled={!manualInput.trim() || loading}
              className="h-11 px-4 rounded-xl shrink-0"
              style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-10 gap-3">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--cv-accent)' }} />
            <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>Looking up cert #{certNumber}...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {result.coin_name || 'Unknown Coin'}
                  </h3>
                  {result.grading_service && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--cv-text-muted)' }}>
                      {result.grading_service} #{result.cert_number}
                    </p>
                  )}
                </div>
                {result.found ? (
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg bg-green-500/10 text-green-400">
                    Verified
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg"
                    style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-text-muted)' }}>
                    Best Match
                  </span>
                )}
              </div>

              {/* Grade badge */}
              {result.grade && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold" style={{ color: 'var(--cv-text)' }}>{result.grade}</span>
                  {result.designation && (
                    <span className="text-xs px-2 py-0.5 rounded-lg"
                      style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)', border: '1px solid var(--cv-accent-border)' }}>
                      {result.designation}
                    </span>
                  )}
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {[
                  ['Country', result.country],
                  ['Denomination', result.denomination],
                  ['Year', result.year],
                  ['Mint Mark', result.mint_mark],
                  ['Series', result.coin_series],
                  ['Composition', result.composition],
                  ['Est. Value', result.estimated_value],
                  ['Population', result.population],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label}>
                    <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--cv-text-muted)' }}>{label}</span>
                    <p className="text-sm" style={{ color: 'var(--cv-text)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {result.notes && (
                <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--cv-text-muted)', borderTop: '1px solid var(--cv-border)', paddingTop: '0.75rem' }}>
                  {result.notes}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {result.verification_url && (
                <a href={result.verification_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 h-11 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-colors"
                  style={{ background: 'var(--cv-input-bg)', color: 'var(--cv-text-secondary)', border: '1px solid var(--cv-border)' }}>
                  <ExternalLink className="w-4 h-4" /> Verify Online
                </a>
              )}
              <Button onClick={() => { setShowScanner(true); setResult(null); setCertNumber(''); }}
                className="flex-1 h-11 rounded-xl font-semibold gap-2"
                style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
                <ScanBarcode className="w-4 h-4" /> Scan Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}