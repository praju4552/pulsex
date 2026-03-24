import { PrototypingHeader } from './PrototypingHeader';
import { useState } from 'react';
import { Send, CheckCircle2, AlertTriangle, Loader2, MessageSquare, Mail, User, FileText, Shield } from 'lucide-react';
import { API_BASE_URL } from '../../../api/config';

const TOPICS = [
  { id: 'ORDER_STATUS', label: 'Order Status' },
  { id: 'PAYMENT_ISSUE', label: 'Payment Issue' },
  { id: 'TECHNICAL_SUPPORT', label: 'Technical Support' },
  { id: 'QUOTE_REQUEST', label: 'Quote Request' },
  { id: 'GENERAL', label: 'General Inquiry' },
];

export default function ContactSupport() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'GENERAL',
    message: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setErrorMsg('Please fill in your name, email, and message.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/service-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'SUPPORT',
          inquiryType: 'SUPPORT_REQUEST',
          name: form.name,
          email: form.email,
          phone: form.phone || 'Not provided',
          requirements: `[${form.topic}] ${form.message}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Submission failed');
      setStatus('success');
      setForm({ name: '', email: '', phone: '', topic: 'GENERAL', message: '' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <PrototypingHeader />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00cc55]/10 rounded-full border border-[#00cc55]/20 text-[#00cc55] font-medium text-xs mb-4">
            <MessageSquare className="w-3.5 h-3.5" /> Support Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Contact Support</h1>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Our team typically responds within 4–8 business hours. Every message goes directly to our admin team.
          </p>
        </div>

        {status === 'success' ? (
          <div className="rounded-2xl border border-[#00cc55]/25 bg-[#00cc55]/5 p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-[#00cc55] mx-auto mb-4" />
            <h2 className="text-xl font-black mb-2">Message Sent!</h2>
            <p className="text-text-secondary text-sm mb-6">Thank you! Our team will review your request and get back to you shortly.</p>
            <button
              onClick={() => setStatus('idle')}
              className="px-6 py-2.5 bg-[#00cc55] text-black font-bold rounded-xl text-sm hover:bg-[#00cc55]/90 transition"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Email row */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 bg-surface-100 border border-border-glass rounded-xl text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-[#00cc55]/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-surface-100 border border-border-glass rounded-xl text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-[#00cc55]/50 transition"
                />
              </div>
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Phone (Optional)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 bg-surface-100 border border-border-glass rounded-xl text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-[#00cc55]/50 transition"
              />
            </div>

            {/* Topic selector */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Support Topic</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set('topic', t.id)}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      form.topic === t.id
                        ? 'border-[#00cc55]/60 bg-[#00cc55]/10 text-[#00cc55]'
                        : 'border-border-glass text-text-secondary hover:border-[#00cc55]/30'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Message <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={e => set('message', e.target.value)}
                placeholder="Describe your issue or question in detail..."
                className="w-full px-4 py-3 bg-surface-100 border border-border-glass rounded-xl text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-[#00cc55]/50 transition resize-none"
              />
            </div>

            {/* Error */}
            {status === 'error' && errorMsg && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full py-4 bg-[#00cc55] hover:bg-[#00cc55]/90 disabled:opacity-60 text-black font-black text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-3 transition shadow-[0_4px_20px_rgba(0,204,85,0.25)]"
            >
              {status === 'sending' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="w-4 h-4" /> Send Message to Support</>
              )}
            </button>

            <p className="text-center text-xs text-text-muted flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Your information is kept secure and confidential.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
