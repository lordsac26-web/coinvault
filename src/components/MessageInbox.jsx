import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Inbox, ArrowLeft, Trash2 } from 'lucide-react';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MessageInbox({ currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    // Fetch messages TO or FROM this user
    const [received, sent] = await Promise.all([
      base44.entities.Message.filter({ to_email: currentUser.email }, '-created_date', 100),
      base44.entities.Message.filter({ from_email: currentUser.email }, '-created_date', 100),
    ]);
    const combined = [...received, ...sent].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    // deduplicate by id
    const seen = new Set();
    const deduped = combined.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
    setMessages(deduped);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const unreadCount = messages.filter(m => m.to_email === currentUser.email && !m.is_read).length;

  const markRead = async (msg) => {
    if (!msg.is_read && msg.to_email === currentUser.email) {
      await base44.entities.Message.update(msg.id, { is_read: true });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    }
    setSelected(msg);
    setReply('');
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    const toEmail = selected.from_email === currentUser.email ? selected.to_email : selected.from_email;
    const toName = selected.from_email === currentUser.email ? null : selected.from_name;
    await base44.entities.Message.create({
      listing_id: selected.listing_id,
      listing_title: selected.listing_title,
      from_email: currentUser.email,
      from_name: currentUser.full_name || currentUser.email,
      to_email: toEmail,
      subject: `Re: ${selected.subject || selected.listing_title || 'Coin Exchange'}`,
      body: reply.trim(),
      is_read: false,
      thread_id: selected.thread_id || selected.id,
    });
    setSending(false);
    setReply('');
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Message.delete(id);
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const inbox = messages.filter(m => m.to_email === currentUser.email);
  const sent = messages.filter(m => m.from_email === currentUser.email && m.to_email !== currentUser.email);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="mx-4 sm:mx-auto rounded-2xl max-w-lg max-h-[80vh] overflow-hidden flex flex-col p-0"
        style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0" style={{ borderBottom: '1px solid var(--cv-border)' }}>
          <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
            <Inbox className="w-4 h-4" />
            Messages
            {unreadCount > 0 && (
              <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">{unreadCount}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-5 space-y-4">
              <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-xs"
                style={{ color: 'var(--cv-text-muted)' }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back to inbox
              </button>
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--cv-bg-card)', border: '1px solid var(--cv-border)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--cv-text)' }}>{selected.subject || selected.listing_title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--cv-text-muted)' }}>
                      From: {selected.from_name || selected.from_email} · {timeAgo(selected.created_date)}
                    </p>
                    {selected.listing_title && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--cv-accent)' }}>Re: {selected.listing_title}</p>
                    )}
                  </div>
                  <button onClick={() => handleDelete(selected.id)} className="p-1.5 opacity-50 hover:opacity-100"
                    style={{ color: 'var(--cv-text-faint)' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm leading-relaxed pt-2 border-t" style={{ color: 'var(--cv-text-secondary)', borderColor: 'var(--cv-border)' }}>
                  {selected.body}
                </p>
              </div>
              <div className="space-y-2">
                <Textarea placeholder="Write a reply..." value={reply} onChange={e => setReply(e.target.value)}
                  className="rounded-xl min-h-[80px] text-sm"
                  style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                <Button onClick={handleReply} disabled={sending || !reply.trim()} className="w-full h-10 rounded-xl gap-2"
                  style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--cv-spinner-track)', borderTopColor: 'var(--cv-spinner-head)' }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 px-6">
              <MessageSquare className="w-9 h-9 mx-auto mb-3" style={{ color: 'var(--cv-text-faint)' }} />
              <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>No messages yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--cv-text-faint)' }}>Messages from other collectors will appear here.</p>
            </div>
          ) : (
            <div>
              {inbox.length > 0 && (
                <div>
                  <p className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-text-faint)', background: 'var(--cv-bg-card)' }}>Inbox</p>
                  {inbox.map(msg => (
                    <button key={msg.id} onClick={() => markRead(msg)} className="w-full text-left px-5 py-3 transition-colors hover:bg-[var(--cv-accent-bg)]"
                      style={{ borderBottom: '1px solid var(--cv-border)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {!msg.is_read && <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-blue-400" />}
                          <div className="min-w-0">
                            <p className={`text-sm truncate ${!msg.is_read ? 'font-semibold' : ''}`} style={{ color: 'var(--cv-text)' }}>
                              {msg.subject || msg.listing_title || 'No subject'}
                            </p>
                            <p className="text-xs truncate" style={{ color: 'var(--cv-text-muted)' }}>
                              {msg.from_name || msg.from_email}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] shrink-0" style={{ color: 'var(--cv-text-faint)' }}>{timeAgo(msg.created_date)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {sent.length > 0 && (
                <div>
                  <p className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-text-faint)', background: 'var(--cv-bg-card)' }}>Sent</p>
                  {sent.map(msg => (
                    <button key={msg.id} onClick={() => setSelected(msg)} className="w-full text-left px-5 py-3 transition-colors hover:bg-[var(--cv-accent-bg)]"
                      style={{ borderBottom: '1px solid var(--cv-border)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm truncate" style={{ color: 'var(--cv-text)' }}>
                            {msg.subject || msg.listing_title || 'No subject'}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--cv-text-muted)' }}>To: {msg.to_email}</p>
                        </div>
                        <span className="text-[10px] shrink-0" style={{ color: 'var(--cv-text-faint)' }}>{timeAgo(msg.created_date)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}