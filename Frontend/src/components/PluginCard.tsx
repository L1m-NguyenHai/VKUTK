import { LucideIcon } from 'lucide-react';

interface PluginCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
  onClick: () => void;
  isDarkMode?: boolean;
  color?: string;
}

export function PluginCard({ icon: Icon, name, description, onClick, isDarkMode = false, color = 'from-blue-500 to-cyan-500' }: PluginCardProps) {
  return (
    <button
      onClick={onClick}
      className={`${isDarkMode ? 'bg-gray-800 active:bg-gray-750 border-gray-700' : 'bg-white active:bg-gray-50 border-gray-200'} border rounded-xl p-4 md:p-4 transition-all active:scale-95 md:hover:shadow-lg md:hover:scale-105 ${isDarkMode ? 'md:hover:border-gray-600' : 'md:hover:border-gray-300'} text-left group relative overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 md:w-20 md:h-20 bg-gradient-to-br ${color} opacity-10 rounded-full -mr-12 -mt-12 md:-mr-10 md:-mt-10 group-hover:scale-150 transition-transform duration-300`}></div>
      <div className="flex items-start space-x-3 relative z-10">
        <div className={`p-3 md:p-2.5 bg-gradient-to-br ${color} rounded-xl md:rounded-lg transition-all group-hover:scale-110 shadow-md md:shadow-sm`}>
          <Icon className="w-6 h-6 md:w-5 md:h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-base md:text-sm mb-1 md:mb-0.5 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {name}
          </h3>
          <p className={`text-sm md:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
        </div>
      </div>
    </button>
  );
}
