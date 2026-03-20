import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Shield, User, Upload, CheckCircle2, XCircle, X, Coins } from 'lucide-react';

export default function AdminUserManagement() {
    const { token } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{
        message: string;
        created: number;
        skipped: number;
        details: { email: string; status: string; reason?: string }[];
    } | null>(null);

    // Credit Assignment State
    const [assignCreditUserId, setAssignCreditUserId] = useState<string | null>(null);
    const [assignCreditAmount, setAssignCreditAmount] = useState<number | ''>('');
    const [assigningCredits, setAssigningCredits] = useState(false);

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        setUploadResult(null);

        try {
            const res = await fetch('/api/admin/users/bulk', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            setUploadResult(data);
            fetchUsers();
        } catch (err: any) {
            setUploadResult({ message: err.message, created: 0, skipped: 0, details: [] });
        } finally {
            setUploading(false);
            // Reset file input so same file can be re-uploaded if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const fetchUsers = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);



    const handleAssignCredits = async () => {
        if (!assignCreditUserId || !assignCreditAmount || assignCreditAmount <= 0) return;

        setAssigningCredits(true);
        try {
            const res = await fetch(`/api/admin/users/${assignCreditUserId}/credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: Number(assignCreditAmount) })
            });

            if (res.ok) {
                alert(`Successfully assigned ${assignCreditAmount} credits.`);
                setAssignCreditUserId(null);
                setAssignCreditAmount('');
                fetchUsers(); // Refresh the list to show new balance
            } else {
                const data = await res.json();
                alert(`Failed to assign credits: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to assign credits");
        } finally {
            setAssigningCredits(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20">
            <Loader2 className="animate-spin w-10 h-10 text-purple-500" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Row */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-text-primary uppercase tracking-wider">User Management</h2>
                <div className="flex items-center gap-3">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        id="bulk-upload-input"
                        onChange={handleBulkUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 text-sm font-bold rounded-xl transition-all shadow-lg shadow-white/10"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Processing...' : 'Bulk Upload (.xlsx)'}
                    </button>
                </div>
            </div>

            {/* Upload Result Banner */}
            {uploadResult && (
                <div className="bg-bg-surface border border-border-glass rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-text-primary font-bold">{uploadResult.message}</p>
                        <button onClick={() => setUploadResult(null)} className="text-text-muted hover:text-text-primary transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm"><CheckCircle2 className="w-4 h-4" /> {uploadResult.created} Created</span>
                        <span className="flex items-center gap-1.5 text-red-400 font-semibold text-sm"><XCircle className="w-4 h-4" /> {uploadResult.skipped} Skipped</span>
                    </div>
                    {uploadResult.details.length > 0 && (
                        <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                            {uploadResult.details.map((d, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    {d.status === 'created'
                                        ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                        : <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
                                    <span className="text-slate-300 font-medium">{d.email}</span>
                                    {d.reason && <span className="text-slate-500">— {d.reason}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="bg-bg-surface backdrop-blur-sm rounded-2xl border border-border-glass shadow-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-bg-primary/60 text-text-secondary text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Credits</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-text-muted italic">
                                    No users found in the system.
                                </td>
                            </tr>
                        ) : users.map((u) => (
                            <tr key={u.id} className="hover:bg-surface-100 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center border border-border-glass">
                                            <User className="w-5 h-5 text-text-secondary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-primary group-hover:text-text-secondary transition-colors">{u.email}</p>
                                            <p className="text-xs text-text-muted font-medium">ID: {u.id.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {u.role === 'SUPER_ADMIN' ? (
                                        <span className="flex items-center gap-1 text-text-primary font-black text-[10px] bg-surface-100 border border-border-color px-2.5 py-1 rounded-full w-fit uppercase tracking-tighter">
                                            <Shield className="w-3 h-3" /> Admin
                                        </span>
                                    ) : (
                                        <span className="text-text-secondary text-sm font-medium">User</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1.5 text-xs">
                                        <div className="flex items-center justify-between gap-4 bg-black px-2.5 py-1.5 rounded-lg border border-border-glass">
                                            <span className="text-text-muted font-semibold uppercase tracking-wider text-[10px]">Balance</span>
                                            <span className="text-text-primary font-black text-sm">{u.credits || 0}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-text-secondary font-medium">
                                    <div className="flex flex-wrap gap-4">
                                        <span>Prototyping User</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setAssignCreditUserId(u.id)}
                                            className="text-amber-400 hover:bg-amber-400/10 p-2 rounded-xl transition-all"
                                            title="Assign Credits"
                                        >
                                            <Coins className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Assign Credits Modal */}
            {assignCreditUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
                        onClick={() => !assigningCredits && setAssignCreditUserId(null)}
                    />
                    <div className="bg-neutral-950 border border-border-glass p-6 rounded-2xl w-full max-w-sm relative shadow-2xl z-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <Coins className="w-5 h-5 text-amber-400" /> Assign Credits
                            </h3>
                            <button
                                onClick={() => !assigningCredits && setAssignCreditUserId(null)}
                                className="text-text-muted hover:text-text-primary transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wide">
                                    Amount to Assign
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={assignCreditAmount}
                                    onChange={(e) => setAssignCreditAmount(e.target.value ? parseInt(e.target.value) : '')}
                                    className="w-full bg-black border border-border-glass rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 transition-all"
                                    placeholder="e.g., 50"
                                />
                                <p className="text-xs text-text-muted mt-2">
                                    This will immediately increase the user's credit balance and send them a notification.
                                </p>
                            </div>

                            <button
                                onClick={handleAssignCredits}
                                disabled={assigningCredits || !assignCreditAmount || assignCreditAmount <= 0}
                                className="w-full py-3 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-xl flex items-center justify-center gap-2 transition-all mt-6"
                            >
                                {assigningCredits ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                {assigningCredits ? 'Assigning...' : 'Confirm Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
