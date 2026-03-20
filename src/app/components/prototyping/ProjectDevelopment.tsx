import { PrototypingHeader } from './PrototypingHeader';
import { PrototypingFAQ } from './PrototypingFAQ';
import { Lightbulb, Cpu, Wrench, Layers, Settings, Truck } from 'lucide-react';
import { useState } from 'react';
import ServiceInquiryModal from './ServiceInquiryModal';

export default function ProjectDevelopment() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const services = [
    { icon: Lightbulb, title: 'Concept & Planning', desc: 'Market analysis, feasibility, roadmap' },
    { icon: Cpu, title: 'Electronics Design', desc: 'Custom PCB, firmware, hardware' },
    { icon: Wrench, title: 'Mechanical Engineering', desc: 'CAD, 3D modeling, testing' },
    { icon: Layers, title: 'Prototyping', desc: 'Rapid prototyping with 3D printing, CNC' },
    { icon: Settings, title: 'Integration & Testing', desc: 'System integration, QA' },
    { icon: Truck, title: 'Manufacturing Support', desc: 'Production planning, scaling' },
  ];

  const phases = [
    { n: '1', title: 'Research', items: ['Market analysis','Feasibility','Requirements'] },
    { n: '2', title: 'Design', items: ['CAD modeling','Schematics','Simulation'] },
    { n: '3', title: 'Prototyping', items: ['3D printing','PCB prototype','Firmware'] },
    { n: '4', title: 'Testing', items: ['Functional','Performance','Reliability'] },
    { n: '5', title: 'Optimization', items: ['Cost','Compliance','Documentation'] },
    { n: '6', title: 'Launch', items: ['Manufacturing','QA','Scaling support'] },
  ];

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <PrototypingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6 sm:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00cc55]/5 via-transparent to-yellow-500/5 pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center space-y-6 relative">
          <div className="inline-block px-4 py-1.5 bg-[#00cc55]/10 rounded-full border border-[#00cc55]/20 text-[#00cc55] font-medium text-xs">
            Project Development Services
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight">
            From Concept to 
            <span className="block bg-gradient-to-r from-[#00cc55] to-emerald-400 bg-clip-text text-transparent">Production-Ready Product</span>
          </h1>
          <p className="text-lg text-text-secondary">Complete development: design, prototyping, testing, and manufacturing support.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-[#00cc55] hover:bg-[#00cc55]/90 text-black font-semibold rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,204,85,0.2)]"
            >
              <Lightbulb className="w-5 h-5" /> Start Project / Get Quote
            </button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6 sm:px-8 bg-glass-bg">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">Development Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s,i) => { 
              const I=s.icon; 
              return (
                <div key={i} className="p-6 rounded-xl border border-border-glass bg-surface-100 hover:border-[#00cc55]/30 transition-all">
                  <I className="w-10 h-10 text-[#00cc55] mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-text-secondary text-sm">{s.desc}</p>
                </div>
              ); 
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">Development Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {phases.map((p,i) => (
              <div key={i} className="p-6 bg-surface-100 rounded-xl border border-border-glass">
                <div className="w-8 h-8 rounded-full bg-[#00cc55]/20 text-[#00cc55] font-bold text-sm flex items-center justify-center mb-3">{p.n}</div>
                <h3 className="font-semibold mb-3">{p.title}</h3>
                <ul className="space-y-1 text-sm text-text-secondary">
                  {p.items.map((x,j) => <li key={j}>• {x}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 px-6 sm:px-8 bg-glass-bg">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-[#00cc55]/20 bg-bg-surface overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border-glass bg-[#00cc55]/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00cc55]/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#00cc55]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-bold text-text-primary">Contact Us</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-glass">
              <div className="flex flex-col gap-1 px-6 py-5">
                <p className="text-[10px] font-bold text-[#00cc55] uppercase tracking-widest mb-1">Email</p>
                <a href="mailto:pulsewritex@gmail.com" className="text-sm font-semibold text-text-primary hover:text-[#00cc55] transition-colors break-all">pulsewritex@gmail.com</a>
              </div>
              <div className="flex flex-col gap-1 px-6 py-5">
                <p className="text-[10px] font-bold text-[#00cc55] uppercase tracking-widest mb-1">Phone</p>
                <a href="tel:+918296828948" className="text-sm font-semibold text-text-primary hover:text-[#00cc55] transition-colors">+91 82968 28948</a>
              </div>
              <div className="flex flex-col gap-1 px-6 py-5">
                <p className="text-[10px] font-bold text-[#00cc55] uppercase tracking-widest mb-1">Address</p>
                <p className="text-sm text-text-secondary leading-relaxed">Chettiyavilai, Therivilai, Nithiravilai PO, Kanjampuram via, Kanyakumari 629154, Tamil Nadu, India</p>
                <p className="text-xs text-text-muted mt-1">Company ID: U26109TN2025PTC176870</p>
                <p className="text-xs text-text-muted">GSTIN: 33AAPCP4334E1ZI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PrototypingFAQ title="Project Dev FAQs" faqs={[

        { question:'What is included in full development?', answer:'All 6 phases: research, design, prototyping, testing, optimization, and launch.' },
        { question:'How long does a project take?', answer:'3-6 months typical. Simple: 8-12 weeks. Complex: 6-12 months.' },
        { question:'Hardware and software?', answer:'Yes — electronics, mechanical, firmware, and software engineers.' },
        { question:'IP and confidentiality?', answer:'Strict NDAs. All designs belong to you.' },
      ]} />

      {/* Shared Inquiry Modal */}
      <ServiceInquiryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        serviceType="PROJECT_DEV" 
        title="Project Development Request" 
      />
    </div>
  );
}
