import { useState } from 'react';
import { X, Loader2, Save, Download } from 'lucide-react';
import { API_BASE_URL } from '../../../api/config';

const STATUSES = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED'];

interface Props {
  inquiry: any;
  onClose: () => void;
  onUpdated: (inq: any) => void;
}

export default function InquiryDetailModal({ inquiry, onClose, onUpdated }: Props) {
  const [status, setStatus] = useState(inquiry.status);
  const [adminNotes, setAdminNotes] = useState(inquiry.adminNotes || '');
  const [saving, setSaving] = useState(false);

  const token = sessionStorage.getItem('cms_token') || '';

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/service-inquiry/${inquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, adminNotes }),
      });
      const data = await res.json();
      if (data.success) onUpdated(data.inquiry);
    } catch (err) {
      alert('Failed to save.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const stColor = (s: string) => {
    const m: Record<string, string> = {
      NEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      CONTACTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      IN_PROGRESS: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      CLOSED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return m[s] || '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

        <div className="sticky top-0 bg-[#111] px-6 py-4 border-b border-[#222] flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-lg">Inquiry Detail</h2>
            <p className="text-gray-500 text-xs mt-0.5">{new Date(inquiry.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <section>
            <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest mb-3">Contact</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div><span className="text-gray-500 text-xs">Name</span><p className="font-semibold">{inquiry.name}</p></div>
              <div><span className="text-gray-500 text-xs">Email</span><p className="font-semibold">{inquiry.email}</p></div>
              <div><span className="text-gray-500 text-xs">Phone</span><p className="font-semibold">{inquiry.phone}</p></div>
            </div>
          </section>

          {/* Inquiry Details */}
          <section>
            <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest mb-3">Details</h4>
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-bold">{inquiry.serviceType === 'SEM_TEM' ? 'SEM/TEM Analysis' : inquiry.serviceType === 'PCB_DESIGN' ? 'PCB Design' : 'Project Development'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-bold">{inquiry.inquiryType.replace(/_/g, ' ')}</span></div>
            </div>
            <div className="mt-3">
              <span className="text-gray-500 text-xs">Requirements</span>
              <p className="mt-1 text-sm text-gray-300 bg-[#0a0a0a] border border-[#222] rounded-xl p-3 whitespace-pre-wrap">{inquiry.requirements}</p>
            </div>
            {inquiry.fileName && (
              <div className="mt-3">
                <span className="text-gray-500 text-xs">Attached File</span>
                <div className="mt-1 flex items-center gap-3">
                  <p className="text-sm text-[#00cc55] font-semibold truncate">{inquiry.fileName}</p>
                  {inquiry.filePath && (
                    <a 
                      href={`${API_BASE_URL.replace('/api', '')}/${inquiry.filePath.replace(/\\/g, '/')}`} 
                      download={inquiry.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00cc55]/15 text-[#00cc55] hover:bg-[#00cc55]/25 border border-[#00cc55]/30 rounded-lg text-xs font-bold transition-all flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Status Updater */}
          <section>
            <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest mb-3">Update Status</h4>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${status === s ? stColor(s) : 'border-[#333] text-gray-500 hover:border-[#555]'}`}>
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </section>

          {/* Admin Notes */}
          <section>
            <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest mb-3">Admin Notes</h4>
            <textarea
              value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00cc55] transition-colors resize-none"
              placeholder="Internal notes..."
            />
          </section>

          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#00cc55] text-black font-bold rounded-xl text-sm hover:bg-[#00cc55]/90 disabled:opacity-50 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
