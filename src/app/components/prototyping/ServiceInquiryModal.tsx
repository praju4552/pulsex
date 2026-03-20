import { useState, useRef } from 'react';
import { X, Upload, Loader2, CheckCircle2, AlertTriangle, Shield, PhoneCall, FileText } from 'lucide-react';
import { API_BASE_URL } from '../../../api/config';

interface ServiceInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: 'SEM_TEM' | 'PROJECT_DEV' | 'PCB_DESIGN';
  title: string;
}

export default function ServiceInquiryModal({ isOpen, onClose, serviceType, title }: ServiceInquiryModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requirements, setRequirements] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (inquiryType: 'REQUEST_CALLBACK' | 'GET_QUOTE') => {
    if (!name || !email || !phone || !requirements) {
      setErrorMessage('Please fill in all required fields.');
      setStatus('error');
      return;
    }

    setSubmitting(true);
    setStatus('idle');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('serviceType', serviceType);
    formData.append('inquiryType', inquiryType);
    formData.append('name', name.trim());
    formData.append('email', email.trim());
    formData.append('phone', phone.trim());
    formData.append('requirements', requirements.trim());
    
    if (file) {
      formData.append('attachment', file);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/service-inquiry`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit inquiry.');
      }

      setStatus('success');
    } catch (err) {
      console.error('Submission error:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={status !== 'success' ? onClose : undefined} />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-bg-surface border border-border-glass rounded-2xl shadow-2xl overflow-hidden transform transition-all mx-4">
        
        {status === 'success' ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[#00cc55]/10 border border-[#00cc55]/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#00cc55]" />
            </div>
            <h2 className="text-2xl font-black text-text-primary">Submission Received!</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              We have received your request for <strong className="text-text-primary">{title}</strong>. Our engineering team will review it and get back to you shortly.
            </p>
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-black font-bold rounded-xl text-sm transition-colors mt-4"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-glass flex items-center justify-between">
              <div>
                <h2 className="font-black text-lg text-text-primary">{title}</h2>
                <p className="text-xs text-text-secondary">Provide details about your needs</p>
              </div>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" 
                    className="w-full px-3 py-2 bg-surface-100 border border-border-glass rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" 
                    className="w-full px-3 py-2 bg-surface-100 border border-border-glass rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">Mobile Number *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" 
                  className="w-full px-3 py-2 bg-surface-100 border border-border-glass rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">Requirements *</label>
                <textarea rows={4} value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Describe your project, materials, test conditions..." 
                  className="w-full px-3 py-2 bg-surface-100 border border-border-glass rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary resize-none" />
              </div>

              {/* Optional File Upload */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">Attachment (Optional)</label>
                <div 
                  onClick={() => fileRef.current?.click()}
                  className="border border-dashed border-border-glass rounded-xl p-4 text-center cursor-pointer hover:border-accent-primary/40 hover:bg-surface-100 transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-accent-primary" />
                  <span className="text-xs font-medium text-text-secondary">
                    {file ? file.name : 'Upload sample details / drawings'}
                  </span>
                  <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              <p className="text-center text-[11px] text-text-placeholder flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Info is fully secure and treated under NDA
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-border-glass bg-surface-100/50 flex flex-col sm:flex-row gap-2">
              <button 
                disabled={submitting}
                onClick={() => handleSubmit('REQUEST_CALLBACK')}
                className="flex-1 py-2.5 border border-border-glass hover:border-accent-primary text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-text-primary hover:text-accent-primary disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                Request a Callback
              </button>
              <button 
                disabled={submitting}
                onClick={() => handleSubmit('GET_QUOTE')}
                className="flex-1 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-black text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,204,85,0.15)] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Get Quote
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
