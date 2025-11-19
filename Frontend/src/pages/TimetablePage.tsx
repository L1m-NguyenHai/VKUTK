import React, { useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Monitor, Smartphone } from 'lucide-react';

const TimetablePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  const days = [
    { name: 'THỨ HAI', shortName: 'T2', color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100' },
    { name: 'THỨ BA', shortName: 'T3', color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100' },
    { name: 'THỨ TƯ', shortName: 'T4', color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100' },
    { name: 'THỨ NĂM', shortName: 'T5', color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100' },
    { name: 'THỨ SÁU', shortName: 'T6', color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100' },
    { name: 'THỨ BẢY', shortName: 'T7', color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100' },
    { name: 'CHỦ NHẬT', shortName: 'CN', color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100' },
  ];

  const periods = Array.from({ length: 10 }, (_, i) => i + 1);

  const morningTimes = [
    { period: 1, time: '07:30' },
    { period: 2, time: '08:30' },
    { period: 3, time: '09:30' },
    { period: 4, time: '10:30' },
    { period: 5, time: '11:30' },
  ];

  const afternoonTimes = [
    { period: 6, time: '13:00' },
    { period: 7, time: '14:00' },
    { period: 8, time: '15:00' },
    { period: 9, time: '16:00' },
    { period: 10, time: '17:00' },
  ];

  const nextDay = () => {
    setSelectedDay((prev) => (prev + 1) % days.length);
  };

  const prevDay = () => {
    setSelectedDay((prev) => (prev - 1 + days.length) % days.length);
  };

  const currentDay = days[selectedDay];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    Thời Khóa Biểu Mẫu
                  </h1>
                </div>
              </div>
              
              {/* View Mode Toggle */}
              <div className="bg-gray-100 rounded-full p-1 flex gap-1 shadow-inner">
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${
                    viewMode === 'mobile'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${
                    viewMode === 'desktop'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
              </div>
            </div>

            {/* Day Selector - Only show in mobile view */}
            {viewMode === 'mobile' && (
              <>
                <div className="flex items-center justify-between gap-3 mt-4">
                  <button
                    onClick={prevDay}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>

                  <div className={`flex-1 bg-gradient-to-br ${currentDay.color} rounded-xl p-3 shadow-sm`}>
                    <div className="text-center">
                      <div className="text-white font-bold text-base tracking-wide drop-shadow-sm">
                        {currentDay.name}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={nextDay}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                {/* Day Pills */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                  {days.map((day, index) => (
                    <button
                      key={day.shortName}
                      onClick={() => setSelectedDay(index)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${
                        index === selectedDay
                          ? `bg-gradient-to-br ${day.color} text-white shadow-sm scale-105`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.shortName}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Schedule Display */}
        {viewMode === 'mobile' ? (
          /* Mobile View - Single Column */
          <div className="space-y-2.5 max-w-3xl mx-auto">
            {periods.map((period) => {
              const time = period <= 5 ? morningTimes[period - 1].time : afternoonTimes[period - 6].time;
              const isMorning = period <= 5;
              
              return (
                <div
                  key={period}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
                    isMorning ? 'border-blue-100' : 'border-blue-200'
                  }`}
                >
                  <div className="flex items-stretch">
                    {/* Time Badge */}
                    <div className={`w-20 flex-shrink-0 bg-gradient-to-br ${
                      isMorning 
                        ? 'from-blue-500 to-blue-600' 
                        : 'from-blue-600 to-blue-700'
                    } p-3 flex flex-col items-center justify-center`}>
                      <div className="text-white font-bold text-base">
                        Tiết {period}
                      </div>
                      <div className="text-white/90 text-xs mt-0.5 font-medium">
                        {time}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className={`flex-1 p-3 bg-gradient-to-br ${currentDay.bgColor} min-h-[85px] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity`}>
                      <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-1.5 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <span className="text-gray-400 text-xl font-light">+</span>
                        </div>
                        <p className="text-gray-500 text-xs font-medium">Thêm lịch học</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop View - Grid Layout */
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-px bg-gray-200">
              <div className="bg-gray-50 p-3 flex items-center justify-center">
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              {days.map((day) => (
                <div
                  key={day.name}
                  className={`bg-gradient-to-br ${day.color} p-3 text-center relative overflow-hidden`}
                >
                  <div className="relative z-10">
                    <div className="font-bold text-white text-xs tracking-wide drop-shadow-sm">
                      {day.shortName}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-white/10"></div>
                </div>
              ))}
            </div>

            {/* Timetable Grid */}
            <div className="grid grid-cols-8 gap-px bg-gray-200">
              {periods.map((period) => {
                const time = period <= 5 ? morningTimes[period - 1].time : afternoonTimes[period - 6].time;
                
                return (
                  <React.Fragment key={period}>
                    {/* Period Label */}
                    <div className="bg-gray-50 p-2.5 flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-gray-700">
                        Tiết {period}
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {time}
                      </span>
                    </div>

                    {/* Time Slots */}
                    {days.map((day) => (
                      <div
                        key={`${period}-${day.name}`}
                        className="bg-white p-2 min-h-[60px] hover:bg-blue-50 transition-all cursor-pointer group"
                      >
                        <div className="w-full h-full rounded border border-dashed border-gray-200 group-hover:border-blue-400 transition-colors flex items-center justify-center">
                          <span className="text-gray-300 group-hover:text-blue-500 text-xs font-light">+</span>
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Time Legend */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {/* Morning Times */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-gray-800 text-base">Buổi Sáng</h4>
            </div>
            <div className="space-y-1.5">
              {morningTimes.map((item) => (
                <div 
                  key={item.period} 
                  className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm hover:bg-white/90 transition-all"
                >
                  <span className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-400 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                    {item.period}
                  </span>
                  <span className="text-gray-700 font-semibold">Tiết {item.period}</span>
                  <span className="ml-auto text-gray-600 font-medium text-xs">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Afternoon Times */}
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-gray-800 text-base">Buổi Chiều</h4>
            </div>
            <div className="space-y-1.5">
              {afternoonTimes.map((item) => (
                <div 
                  key={item.period} 
                  className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg text-sm hover:bg-white/90 transition-all"
                >
                  <span className="w-7 h-7 bg-gradient-to-br from-red-500 to-rose-500 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                    {item.period}
                  </span>
                  <span className="text-gray-700 font-semibold">Tiết {item.period}</span>
                  <span className="ml-auto text-gray-600 font-medium text-xs">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default TimetablePage;
