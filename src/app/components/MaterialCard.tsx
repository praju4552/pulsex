import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface MaterialCardProps {
  name: string;
  category: string;
  icon: string;
  onClick: () => void;
}

export function MaterialCard({ name, category, icon, onClick }: MaterialCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl border-2 border-gray-200/80 p-6 text-left transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 active:scale-[0.98] group relative overflow-hidden"
    >
      {/* Subtle gradient accent on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      
      <div className="flex items-start justify-between mb-5 relative">
        <div className="text-5xl drop-shadow-sm">{icon}</div>
        <div className="p-2 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors duration-300">
          <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-0.5 transition-transform duration-300" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors duration-300">
        {name}
      </h3>
      <p className="text-sm text-gray-600">{category}</p>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl" />
    </motion.button>
  );
}