import { PrototypingHeader } from './PrototypingHeader';
import { PrototypingFAQ } from './PrototypingFAQ';
import { Microscope, Beaker, Cpu, Settings, Layers, Truck } from 'lucide-react';
import { useState } from 'react';
import ServiceInquiryModal from './ServiceInquiryModal';

export default function SEMTEM() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <PrototypingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6 sm:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00cc55]/5 via-transparent to-indigo-500/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-block px-4 py-1.5 bg-[#00cc55]/10 rounded-full border border-[#00cc55]/20 text-[#00cc55] font-medium text-xs">
              Advanced Microscopy Suite
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
              SEM/TEM Analysis &
              <span className="block bg-gradient-to-r from-[#00cc55] to-emerald-400 bg-clip-text text-transparent">Microscopy Services</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Advanced electron microscopy with EDS and elemental analysis for material research, quality control, and failure analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-[#00cc55] hover:bg-[#00cc55]/90 text-black font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_4px_12px_rgba(0,204,85,0.2)]"
              >
                <Beaker className="w-5 h-5" /> Request Analysis / Get Quote
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6 sm:px-8 bg-glass-bg">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Our Analysis Services</h2>
            <p className="text-text-secondary text-sm">Professional laboratory characterization setup</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Microscope, title: 'SEM Imaging', desc: 'High-resolution scanning electron microscopy, 30nm resolution' },
              { icon: Beaker, title: 'TEM Analysis', desc: 'Transmission electron microscopy for atomic-scale imaging' },
              { icon: Cpu, title: 'EDS Analysis', desc: 'Energy Dispersive X-ray Spectroscopy for elemental composition' },
              { icon: Settings, title: 'Failure Analysis', desc: 'Identify root causes of failures in materials' },
              { icon: Layers, title: 'Material Characterization', desc: 'Analysis of material structure and properties' },
              { icon: Truck, title: 'Quality Control', desc: 'Verification of manufacturing quality and specs' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="p-6 rounded-xl border border-border-glass bg-surface-100 hover:border-[#00cc55]/30 transition-all">
                  <Icon className="w-10 h-10 text-[#00cc55] mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-text-secondary text-sm">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-black mb-4">Technical Capabilities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass">
                <h3 className="font-semibold mb-3">Equipment & Specs</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li><span className="text-text-primary font-medium">SEM:</span> 30nm resolution</li>
                  <li><span className="text-text-primary font-medium">Magnification:</span> Up to 500,000x</li>
                  <li><span className="text-text-primary font-medium">TEM:</span> 0.2nm resolution</li>
                  <li><span className="text-text-primary font-medium">EDS:</span> Full spectrum detector</li>
                </ul>
              </div>
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass">
                <h3 className="font-semibold mb-3">Analysis Types</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>• Morphology Analysis</li><li>• Crystalline Structure</li><li>• Surface Topography</li><li>• Particle Size</li><li>• Composition Mapping</li>
                </ul>
              </div>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass">
                <h3 className="font-semibold mb-3">Sample Preparation</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>• Carbon/Gold/Platinum coating</li><li>• FIB sample preparation</li><li>• Ultramicrotomy for TEM</li><li>• Chemical polishing</li>
                </ul>
              </div>
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass">
                <h3 className="font-semibold mb-3">Materials Analyzed</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>• Metals & Alloys</li><li>• Ceramics & Glass</li><li>• Polymers & Composites</li><li>• Semiconductors</li>
                </ul>
              </div>
            </div>
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

      <PrototypingFAQ title="SEM/TEM FAQs" faqs={[

        { question: 'What samples can you analyze?', answer: 'Metals, alloys, ceramics, polymers, composites, semiconductors, biological specimens. Under 25mm.' },
        { question: 'What resolution can you achieve?', answer: 'SEM: 30nm, 500,000x magnification. TEM: 0.2nm for atomic-scale imaging.' },
        { question: 'What is EDS analysis?', answer: 'Identifies elemental composition including relative percentages and spatial distribution mapping.' },
        { question: 'How long does analysis take?', answer: 'Basic SEM: 5 days. Complete analysis: 7-10 days. TEM: 10-14 days.' },
      ]} />

      {/* Shared Inquiry Modal */}
      <ServiceInquiryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        serviceType="SEM_TEM" 
        title="SEM/TEM Analysis Request" 
      />
    </div>
  );
}
