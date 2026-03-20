

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <style>
        {`
        @keyframes floatMesh {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
            50% { transform: translateY(-30px) scale(1.05); opacity: 1; }
        }

        .ambient-mesh {
            mask-image: radial-gradient(circle at center, black 10%, transparent 80%);
            -webkit-mask-image: radial-gradient(circle at center, black 10%, transparent 80%);
        }

        .animate-ambient-mesh {
            animation: floatMesh 14s ease-in-out infinite;
        }

        .animate-delayed-mesh {
            animation: floatMesh 18s ease-in-out infinite reverse;
            animation-delay: 3s;
        }
        
        @keyframes subtlePulse {
            0%, 100% { opacity: 0.05; }
            50% { opacity: 0.15; }
        }
        .animate-subtle-pulse {
            animation: subtlePulse 8s ease-in-out infinite;
        }
        `}
      </style>

      {/* Structural Mesh */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-60 ambient-mesh object-cover text-[#00cc55]" 
        viewBox="0 0 1000 1000" 
        preserveAspectRatio="xMidYMid slice" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="meshGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"></stop>
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1"></stop>
          </linearGradient>
        </defs>
        
        <path 
          className="transition-colors duration-500" 
          d="M100,200 L400,100 L700,300 L900,150 L850,500 L1000,700 L600,900 L200,800 L0,500 Z" 
          fill="none" 
          stroke="url(#meshGradient)" 
          strokeWidth="2.5"
        ></path>
        
        <path 
          className="transition-colors duration-500 text-blue-500/50" 
          d="M300,50 L600,150 L800,450 L700,800 L400,950 L100,750 L50,400 Z" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
        ></path>
        
        {/* Nodes */}
        <circle className="fill-[#00cc55] animate-ambient-mesh" cx="400" cy="100" r="4.5"></circle>
        <circle className="fill-blue-400 animate-delayed-mesh" cx="700" cy="300" r="3"></circle>
        <circle className="fill-[#00cc55] animate-ambient-mesh" cx="200" cy="800" r="4.5"></circle>
        <circle className="fill-blue-400 animate-delayed-mesh" cx="800" cy="450" r="3"></circle>
      </svg>

      {/* Accent Light Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#00cc55] opacity-[0.05] animate-subtle-pulse rounded-full blur-[140px] transition-opacity duration-500"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500 opacity-[0.05] animate-subtle-pulse rounded-full blur-[160px] transition-opacity duration-500" style={{ animationDelay: '4s', animationFillMode: 'both' }}></div>
    </div>
  );
}
