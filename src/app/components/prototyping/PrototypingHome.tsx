import { PrototypingHeader } from './PrototypingHeader';
import { useNavigate } from 'react-router-dom';
import { Box, Cpu, PencilRuler, Zap, Microscope, Lightbulb } from 'lucide-react';
import AmbientBackground from './AmbientBackground';

export default function PrototypingHome() {
  const navigate = useNavigate();

  const services = [
    { 
      icon: Box, 
      title: '3D Printing', 
      desc: 'Transform digital designs into physical objects. FDM & SLA, multiple materials.', 
      features: ['FDM & SLA', 'Multiple Materials', '24-48hr Turnaround'], 
      color: 'from-blue-500 to-cyan-500', 
      soon: false, 
      route: '/prototyping/3d-printing' 
    },
    { 
      icon: PencilRuler, 
      title: 'PCB Design', 
      desc: 'Expert circuit design and PCB layout using industry-standard tools.', 
      features: ['Schematic Design', 'High-Speed Design', 'EMI/EMC'], 
      color: 'from-green-500 to-emerald-500', 
      soon: false, 
      route: '/prototyping/pcb-design' 
    },
    { 
      icon: Cpu, 
      title: 'PCB Printing', 
      desc: 'Professional PCB manufacturing from prototypes to production runs.', 
      features: ['1-12 Layers', 'Fast Prototyping', 'Full Assembly'], 
      color: 'from-purple-500 to-pink-500', 
      soon: false, 
      route: '/prototyping/pcb-printing' 
    },
    { 
      icon: Zap, 
      title: 'Laser Cutting', 
      desc: 'Precision laser cutting and engraving on wood, acrylic, leather, and more.', 
      features: ['0.2mm Precision', 'Multiple Materials', 'Custom Designs'], 
      color: 'from-orange-500 to-red-500', 
      soon: false, 
      route: '/prototyping/laser-cutting' 
    },
    { 
      icon: Microscope, 
      title: 'SEM/TEM Analysis', 
      desc: 'Advanced electron microscopy analysis with EDS and elemental mapping.', 
      features: ['30nm Resolution', 'Elemental Analysis', 'Detailed Reports'], 
      color: 'from-indigo-500 to-blue-500', 
      soon: false, 
      route: '/prototyping/sem-tem' 
    },
    { 
      icon: Lightbulb, 
      title: 'Project Development', 
      desc: 'End-to-end product development from concept to manufacturing.', 
      features: ['Full Lifecycle', 'Expert Team', 'Production Ready'], 
      color: 'from-yellow-500 to-orange-500', 
      soon: false, 
      route: '/prototyping/project-dev' 
    },

  ];

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary relative">
      <AmbientBackground />
      <PrototypingHeader />
      
      {/* Services Grid */}
      <section className="px-6 sm:px-8 pt-12 pb-32 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <div 
                  key={idx} 
                  onClick={() => navigate(svc.route)}
                  className={`group relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden
                    ${svc.soon 
                      ? 'border-border-glass bg-surface-100 opacity-80 hover:border-border-color' 
                      : 'border-border-glass bg-bg-primary/60 hover:border-[#00cc55]/50 hover:shadow-[0_0_30px_rgba(0,204,85,0.15)] backdrop-blur-md'
                    }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${svc.color} p-2.5 flex items-center justify-center shadow-lg`}>
                      <Icon className="w-full h-full text-text-primary" />
                    </div>
                    {svc.soon && (
                      <span className="inline-block text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30 uppercase tracking-wider uppercase">
                        Under Development
                      </span>
                    )}
                    {!svc.soon && (
                      <span className="inline-block text-[10px] font-bold text-[#00cc55] bg-[#00cc55]/10 px-2.5 py-1 rounded-full border border-[#00cc55]/30 uppercase tracking-wider uppercase">
                        Available Now
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-[#00cc55] transition-colors">
                    {svc.title}
                  </h3>
                  
                  <p className="text-text-secondary text-sm leading-relaxed mb-6 h-14">
                    {svc.desc}
                  </p>
                  
                  <div className="space-y-2 pt-4 border-t border-border-glass">
                    {svc.features.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-2 text-xs font-medium text-text-muted">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${svc.color}`} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* Footer with Company Info */}
      <footer className="border-t border-border-glass bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            {/* Brand */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00cc55]/10 border border-[#00cc55]/20">
                <span className="w-2 h-2 rounded-full bg-[#00cc55] animate-pulse" />
                <span className="text-[#00cc55] text-xs font-bold uppercase tracking-widest">Pulse X Solutions</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                Professional prototyping &amp; fabrication services for engineers, researchers, and product teams in India.
              </p>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest">Contact</h4>
              <div className="space-y-2">
                <a href="mailto:pulsewritex@gmail.com" className="flex items-center gap-2 text-sm text-text-secondary hover:text-[#00cc55] transition-colors group">
                  <svg className="w-4 h-4 flex-shrink-0 group-hover:text-[#00cc55]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  pulsewritex@gmail.com
                </a>
                <a href="tel:+918296828948" className="flex items-center gap-2 text-sm text-text-secondary hover:text-[#00cc55] transition-colors group">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  +91 82968 28948
                </a>
              </div>
            </div>

            {/* Address & Registration */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest">Address</h4>
              <div className="space-y-2">
                <p className="text-sm text-text-secondary leading-relaxed">
                  Chettiyavilai, Therivilai,<br />
                  Nithiravilai PO, Kanjampuram via,<br />
                  Kanyakumari 629154<br />
                  Tamil Nadu, India
                </p>
                <div className="pt-2 border-t border-border-glass space-y-1">
                  <p className="text-xs text-text-muted">Company ID: <span className="font-mono text-text-secondary">U26109TN2025PTC176870</span></p>
                  <p className="text-xs text-text-muted">GSTIN: <span className="font-mono text-text-secondary">33AAPCP4334E1ZI</span></p>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-10 pt-6 border-t border-border-glass flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
            <p>@2026 Pulsewritexsolutions Pvt. Ltd.</p>
            <p className="text-center">Registered in Tamil Nadu, India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
