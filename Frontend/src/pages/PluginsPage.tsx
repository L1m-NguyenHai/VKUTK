import {
  Calendar,
  BarChart3,
  DollarSign,
  BookOpen,
  FileText,
  Bell,
  LucideIcon,
} from "lucide-react";
import { PluginCard } from "../components/PluginCard";

type Page = "plugins" | "info" | "settings" | "schedule";

interface PluginsPageProps {
  isDarkMode: boolean;
  navigateTo: (page: Page) => void;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export function PluginsPage({ isDarkMode, navigateTo }: PluginsPageProps) {
  const plugins: Plugin[] = [
    {
      id: "schedule",
      name: "Lịch học",
      description: "Xem lịch học và lịch thi",
      icon: Calendar,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "grades",
      name: "Điểm số",
      description: "Tra cứu điểm số các môn học",
      icon: BarChart3,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "tuition",
      name: "Học phí",
      description: "Kiểm tra học phí và công nợ",
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "library",
      name: "Thư viện",
      description: "Tra cứu sách và tài liệu",
      icon: BookOpen,
      color: "from-orange-500 to-red-500",
    },
    {
      id: "register",
      name: "Đăng ký môn học",
      description: "Đăng ký các môn học mới",
      icon: FileText,
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "notifications",
      name: "Thông báo",
      description: "Xem thông báo từ nhà trường",
      icon: Bell,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  return (
    <div className="space-y-4">
      <h1
        className={`text-lg md:text-xl font-bold ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}
      >
        Plugins
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {plugins.map((plugin) => (
          <PluginCard
            key={plugin.id}
            icon={plugin.icon}
            name={plugin.name}
            description={plugin.description}
            onClick={() => navigateTo(plugin.id as Page)}
            isDarkMode={isDarkMode}
            color={plugin.color}
          />
        ))}
      </div>
    </div>
  );
}
