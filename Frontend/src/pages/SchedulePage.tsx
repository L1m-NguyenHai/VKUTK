import { Calendar, Clock } from 'lucide-react';

interface SchedulePageProps {
  isDarkMode?: boolean;
}

export function SchedulePage({ isDarkMode = false }: SchedulePageProps) {
  const schedule = [
    {
      id: 1,
      subject: 'Lập trình Web',
      code: 'IT301',
      time: '07:00 - 09:00',
      room: 'A201',
      day: 'Thứ 2',
      instructor: 'TS. Nguyễn Văn A',
    },
    {
      id: 2,
      subject: 'Cơ sở dữ liệu',
      code: 'IT302',
      time: '09:15 - 11:15',
      room: 'B105',
      day: 'Thứ 2',
      instructor: 'ThS. Trần Thị B',
    },
    {
      id: 3,
      subject: 'Mạng máy tính',
      code: 'IT303',
      time: '13:00 - 15:00',
      room: 'C301',
      day: 'Thứ 3',
      instructor: 'TS. Lê Văn C',
    },
    {
      id: 4,
      subject: 'Phát triển ứng dụng di động',
      code: 'IT304',
      time: '07:00 - 09:00',
      room: 'A302',
      day: 'Thứ 4',
      instructor: 'ThS. Phạm Thị D',
    },
    {
      id: 5,
      subject: 'Trí tuệ nhân tạo',
      code: 'IT305',
      time: '15:15 - 17:15',
      room: 'B201',
      day: 'Thứ 5',
      instructor: 'TS. Hoàng Văn E',
    },
  ];

  const today = 'Thứ 2';
  const todayClasses = schedule.filter(item => item.day === today);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Lịch học</h1>
        <div className={`flex items-center space-x-1.5 md:space-x-2 text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>Tuần 12 - HK1 2024</span>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-800' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'} border rounded-xl md:rounded-lg p-3 md:p-3 shadow-md md:shadow-sm`}>
        <div className="flex items-center space-x-2 mb-3 md:mb-2">
          <div className={`p-2 md:p-1.5 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
            <Clock className={`w-5 h-5 md:w-4 md:h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <span className={`text-base md:text-sm font-semibold ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}>Hôm nay - {today}</span>
        </div>
        <div className="space-y-2">
          {todayClasses.map((item) => (
            <div key={item.id} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-xl md:rounded-lg p-3.5 md:p-3 border shadow-md md:shadow-sm active:scale-95 md:hover:shadow-md transition-all`}>
              <div className="flex justify-between items-start mb-2 md:mb-1">
                <h3 className={`font-semibold text-base md:text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.subject}</h3>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.code}</span>
              </div>
              <div className={`flex items-center justify-between text-sm md:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span>{item.time}</span>
                <span>Phòng {item.room}</span>
              </div>
              <p className={`text-xs mt-1.5 md:mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{item.instructor}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className={`text-base md:text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3 md:mb-2`}>Toàn bộ lịch học</h2>
        <div className="space-y-2">
          {schedule.map((item) => (
            <div
              key={item.id}
              className={`${isDarkMode ? 'bg-gray-800 border-gray-700 md:hover:border-gray-600' : 'bg-white border-gray-200 md:hover:border-gray-300'} border rounded-xl md:rounded-lg p-3.5 md:p-3 active:scale-95 transition-all`}
            >
              <div className="flex justify-between items-start mb-2 md:mb-1">
                <div>
                  <h3 className={`font-semibold text-base md:text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.subject}</h3>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.code}</span>
                </div>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-purple-300 bg-purple-900/30' : 'text-purple-600 bg-purple-50'} px-2.5 md:px-2 py-1 rounded-lg md:rounded`}>
                  {item.day}
                </span>
              </div>
              <div className={`flex items-center justify-between text-sm md:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                <span>{item.time}</span>
                <span>Phòng {item.room}</span>
              </div>
              <p className={`text-xs mt-1.5 md:mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{item.instructor}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
