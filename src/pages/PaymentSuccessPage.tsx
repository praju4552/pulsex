import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { PrototypingHeader } from '../app/components/prototyping/PrototypingHeader';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary selection:bg-[#00cc55]/30">
      <PrototypingHeader />
      
      <div className="flex items-center justify-center p-4 h-[calc(100vh-80px)]">
        <div className="bg-bg-primary border border-[#00cc55]/40 p-10 rounded-[2.5rem] max-w-md w-full text-center flex flex-col items-center shadow-[0_0_80px_rgba(0,204,85,0.15)] animate-fade-in-up">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-[#00cc55] rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,204,85,0.5)]">
            <CheckCircle2 className="w-10 h-10 text-black" />
          </div>
          
          <h2 className="text-3xl font-black text-text-primary mb-2 tracking-tight">Payment Successful!</h2>
          <p className="text-text-secondary text-sm mb-6 max-w-xs">
            Your order has been confirmed and placed into production queuing. You will receive a WhatsApp notification shortly.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => navigate('/prototyping/orders')}
              className="w-full py-4 bg-[#00cc55] text-black font-black uppercase tracking-wider rounded-2xl hover:bg-[#00cc55]/90 transition-all shadow-[0_0_20px_rgba(0,204,85,0.3)] flex justify-center items-center gap-2 group"
            >
              View My Orders
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/prototyping')}
              className="w-full py-3 text-text-secondary hover:text-text-primary font-bold text-sm transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
