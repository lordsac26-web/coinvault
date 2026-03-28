import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from 'lucide-react';

const inputStyle = { background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' };

export default function SendMessageDialog({ listing, currentUser, onClose }) {
  const [subject, setSubject] = useState(`Re: ${listing.coin_name}`);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    await base44.entities.Message.create({
      listing_id: listing.id,
      listing_title: listing.coin_name,
      from_email: currentUser.email,
      from_name: currentUser.full_name || currentUser.email,
      to_email: listing.seller_email || listing.created_by,
      subject: subject,
      body: body.trim(),
      is_read: false,
      thread_id: `${listing.id}_${Date.now()}`,
    });
    setSending(false);
    setSent(true);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="mx-4 sm:mx-auto rounded-2xl"
        style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
            <MessageSquare className="w-4 h-4" /> Send Message
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'var(--cv-accent-bg)' }}>
              <Send className="w-5 h-5" style={{ color: 'var(--cv-accent)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--cv-text)' }}>Message sent!</p>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--cv-text-muted)' }}>
              The seller will see your message in their inbox.
            </p>
            <Button onClick={onClose} className="rounded-xl" style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--cv-accent-bg)', border: '1px solid var(--cv-accent-border)' }}>
              <span style={{ color: 'var(--cv-text-muted)' }}>Regarding: </span>
              <strong style={{ color: 'var(--cv-accent)' }}>{listing.coin_name}</strong>
              {listing.asking_price && <span style={{ color: 'var(--cv-text-secondary)' }}> — {listing.asking_price}</span>}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--cv-text-muted)' }}>To</label>
              <Input value={listing.seller_name || listing.seller_email || 'Seller'} disabled
                className="h-9 rounded-xl opacity-60" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--cv-text-muted)' }}>Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} className="h-9 rounded-xl" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--cv-text-muted)' }}>Message</label>
              <Textarea placeholder="Write your message or offer..." value={body} onChange={e => setBody(e.target.value)}
                className="rounded-xl min-h-[100px]" style={inputStyle} autoFocus />
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose} variant="outline" className="flex-1 h-10 rounded-xl"
                style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-border)', color: 'var(--cv-text)' }}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending || !body.trim()} className="flex-1 h-10 rounded-xl gap-2"
                style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}