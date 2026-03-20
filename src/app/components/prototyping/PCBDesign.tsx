import { PrototypingHeader } from './PrototypingHeader';
import { XPulseLogo } from '../XPulseIcon';
import { PrototypingFAQ } from './PrototypingFAQ';
import { Lightbulb, Code, Layers, Cpu, Settings, Zap, Truck } from 'lucide-react';
import { useState } from 'react';
import ServiceInquiryModal from './ServiceInquiryModal';

export default function PCBDesign() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <PrototypingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6 sm:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00cc55]/5 via-transparent to-amber-500/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-block px-4 py-2 bg-[#00cc55]/10 border border-[#00cc55]/20 text-[#00cc55] font-medium text-sm rounded-full">
              Expert PCB Design Services
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Turn Your Concept Into
              <span className="block bg-gradient-to-r from-[#00cc55] to-emerald-400 bg-clip-text text-transparent">Production-Ready PCB Design</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Full schematic design, PCB layout, EMI/EMC compliance, and design optimization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-[#00cc55] hover:bg-[#00cc55]/90 text-black font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_4px_12px_rgba(0,204,85,0.2)]"
              >
                <Lightbulb className="w-5 h-5" /> Start Design Project
              </button>
              <button className="px-6 py-3 border border-border-color hover:bg-surface-100 font-semibold rounded-lg transition-colors">View Portfolio</button>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6 sm:px-8 bg-glass-bg">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Design Services</h2>
            <p className="text-text-secondary text-lg">Comprehensive PCB design solutions</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Code, title: 'Schematic Design', desc: 'Complete circuit design with optimization' },
              { icon: Layers, title: 'PCB Layout', desc: 'Expert board layout for signal integrity' },
              { icon: Cpu, title: 'High-Speed Design', desc: 'Impedance control, differential pair routing' },
              { icon: Settings, title: 'Power Distribution', desc: 'Advanced power planes and voltage regulation' },
              { icon: Zap, title: 'EMI/EMC Compliance', desc: 'Design for electromagnetic compatibility' },
              { icon: Truck, title: 'DFM Analysis', desc: 'Design for manufacturability review' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="relative p-6 rounded-xl border border-border-glass bg-surface-100 hover:border-[#00cc55]/30 transition-all">
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Design Capabilities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass">
                <h3 className="font-semibold mb-3">Tools & Software</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>• Altium Designer</li><li>• KiCAD Professional</li><li>• EAGLE CAD</li><li>• SI/PI Analysis Tools</li>
                </ul>
              </div>
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass">
                <h3 className="font-semibold mb-3">Technology Support</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>• Microcontrollers & MCUs</li><li>• FPGAs & ASICs</li><li>• RF/Wireless Designs</li><li>• IoT & Embedded Systems</li>
                </ul>
              </div>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass">
                <h3 className="font-semibold mb-3">Design Specifications</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li><span className="text-text-primary font-medium">Layers:</span> Up to 12</li>
                  <li><span className="text-text-primary font-medium">Trace Width:</span> 0.075mm min</li>
                  <li><span className="text-text-primary font-medium">Via Diameter:</span> 0.15mm min</li>
                  <li><span className="text-text-primary font-medium">Impedance:</span> ±5% accuracy</li>
                </ul>
              </div>
              <div className="p-6 bg-surface-100 rounded-xl border border-border-glass">
                <h3 className="font-semibold mb-3">Standards & Compliance</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>• IPC-2221 Design Standards</li><li>• FDA/Medical Device Ready</li><li>• Automotive Grade (AEC-Q)</li><li>• RoHS/REACH Compliance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>


      <PrototypingFAQ title="PCB Design FAQs" description="Common questions about PCB design services" faqs={[
        { question: 'What info do I need to provide?', answer: 'Circuit requirements, component list, performance specs, size constraints, and existing schematics if available.' },
        { question: 'Can you handle high-speed designs?', answer: 'Yes — DDR, LVDS, USB 3.0, mixed-signal, and RF/wireless designs with SI/PI analysis.' },
        { question: 'What tools do you use?', answer: 'Altium Designer, KiCAD, Mentor Graphics PADS, and specialized simulation tools.' },
        { question: 'What is the typical turnaround?', answer: 'Simple designs: 5-10 days. Complex designs: 2-4 weeks. Rush designs available.' },
      ]} />

      <footer className="border-t border-border-glass bg-glass-bg py-12 px-6"><div className="max-w-7xl mx-auto text-center"><p className="text-sm text-text-muted flex items-center justify-center gap-1">&copy; {new Date().getFullYear()} <XPulseLogo textClassName="text-sm font-bold" iconClassName="w-4 h-4" />. All rights reserved.</p></div></footer>

      {/* Shared Inquiry Modal */}
      <ServiceInquiryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        serviceType="PCB_DESIGN" 
        title="PCB Design Request" 
      />
    </div>
  );
}
