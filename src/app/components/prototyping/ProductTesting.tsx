import { PrototypingHeader } from './PrototypingHeader';
import { PrototypingFAQ } from './PrototypingFAQ';
import { XPulseLogo } from '../XPulseIcon';
import { Beaker, BarChart3, Settings, Cpu, Zap, Layers } from 'lucide-react';

export default function ProductTesting() {
  const services = [
    { icon: Beaker, title: 'Functional Testing', desc: 'Verify all features work as designed' },
    { icon: BarChart3, title: 'Performance Testing', desc: 'Load, stress testing, benchmarking' },
    { icon: Settings, title: 'Reliability Testing', desc: 'Accelerated life testing, failure mode analysis' },
    { icon: Cpu, title: 'Environmental Testing', desc: 'Temperature, humidity, vibration compliance' },
    { icon: Zap, title: 'Safety Testing', desc: 'Electrical/mechanical safety, hazard assessment' },
    { icon: Layers, title: 'Compliance Testing', desc: 'FCC, CE, UL, FDA regulatory verification' },
  ];


  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <PrototypingHeader />
      <section className="relative overflow-hidden pt-20 pb-32 px-6 sm:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00cc55]/5 via-transparent to-teal-500/5 pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center space-y-6 relative">
          <div className="inline-block px-4 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-medium text-sm rounded-full">Coming Soon — Product Testing Services</div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">Rigorous Testing & <span className="block bg-gradient-to-r from-[#00cc55] to-emerald-400 bg-clip-text text-transparent">Quality Assurance</span></h1>
          <p className="text-lg text-text-secondary">Complete testing covering functionality, reliability, safety, and performance.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button className="px-6 py-3 bg-[#00cc55] hover:bg-[#00cc55]/90 text-black font-semibold rounded-lg flex items-center justify-center gap-2"><Beaker className="w-5 h-5" /> Request Testing</button>
            <button className="px-6 py-3 border border-border-color hover:bg-surface-100 font-semibold rounded-lg">View Reports</button>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 sm:px-8 bg-glass-bg opacity-75 pointer-events-none">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Testing Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s,i) => { const I=s.icon; return <div key={i} className="p-6 rounded-xl border border-border-glass bg-surface-100 hover:border-[#00cc55]/30 transition-all"><I className="w-10 h-10 text-[#00cc55] mb-4" /><h3 className="font-semibold text-lg mb-2">{s.title}</h3><p className="text-text-secondary text-sm">{s.desc}</p></div>; })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 sm:px-8 opacity-75">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Testing Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass"><h3 className="font-semibold mb-3">Equipment</h3><ul className="space-y-2 text-sm text-text-secondary"><li>• Environmental chambers (-40 to 150°C)</li><li>• High-precision load testers</li><li>• Vibration testing systems</li><li>• Thermal imaging</li></ul></div>
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass"><h3 className="font-semibold mb-3">Testing Types</h3><ul className="space-y-2 text-sm text-text-secondary"><li>• Prototype validation</li><li>• Production testing</li><li>• Failure analysis</li><li>• Field trial monitoring</li></ul></div>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass"><h3 className="font-semibold mb-3">Standards</h3><ul className="space-y-2 text-sm text-text-secondary"><li>• ISO/IEC 17025</li><li>• FCC & CE Mark</li><li>• UL Standards</li><li>• FDA Medical Device</li><li>• RoHS & REACH</li></ul></div>
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass"><h3 className="font-semibold mb-3">Deliverables</h3><ul className="space-y-2 text-sm text-text-secondary"><li>• Detailed test reports</li><li>• Data & graphs</li><li>• Compliance docs</li><li>• Improvement suggestions</li></ul></div>
            </div>
          </div>
        </div>
      </section>


      <PrototypingFAQ title="Testing FAQs" faqs={[
        { question:'What types of testing do you offer?', answer:'Functional, performance, reliability, environmental, safety, and compliance testing.' },
        { question:'How long does testing take?', answer:'Basic: 10 days. Complete: 14 days. Full certification: 4-6 weeks.' },
        { question:'Can you test prototypes?', answer:'Yes — prototypes, pre-production, and finished products.' },
        { question:'Do you provide test reports?', answer:'Detailed reports with data, graphs, analysis, and recommendations.' },
      ]} />
      <footer className="border-t border-border-glass bg-glass-bg py-12 px-6"><div className="max-w-7xl mx-auto text-center"><p className="text-sm text-text-muted flex items-center justify-center gap-1">&copy; {new Date().getFullYear()} <XPulseLogo textClassName="text-sm font-bold" iconClassName="w-4 h-4" />. All rights reserved.</p></div></footer>
    </div>
  );
}
