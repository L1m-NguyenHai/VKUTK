import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Trash2,
} from "lucide-react";
import {
  getSavedTimetables,
  processTimetableData,
  deleteTimetable,
  type SavedTimetable,
  type ProcessedSession,
} from "../utils/timetableUtils";

const TimetablePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");
  const [savedTimetables, setSavedTimetables] = useState<SavedTimetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] =
    useState<SavedTimetable | null>(null);
  const [processedSessions, setProcessedSessions] = useState<
    ProcessedSession[]
  >([]);

  const days = [
    {
      name: "THỨ HAI",
      shortName: "T2",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
    },
    {
      name: "THỨ BA",
      shortName: "T3",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
    },
    {
      name: "THỨ TƯ",
      shortName: "T4",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
    },
    {
      name: "THỨ NĂM",
      shortName: "T5",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
    },
    {
      name: "THỨ SÁU",
      shortName: "T6",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
    },
    {
      name: "THỨ BẢY",
      shortName: "T7",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
    },
    {
      name: "CHỦ NHẬT",
      shortName: "CN",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
    },
  ];

  const periods = Array.from({ length: 10 }, (_, i) => i + 1);

  const morningTimes = [
    { period: 1, time: "07:30" },
    { period: 2, time: "08:30" },
    { period: 3, time: "09:30" },
    { period: 4, time: "10:30" },
    { period: 5, time: "11:30" },
  ];

  const afternoonTimes = [
    { period: 6, time: "13:00" },
    { period: 7, time: "14:00" },
    { period: 8, time: "15:00" },
    { period: 9, time: "16:00" },
    { period: 10, time: "17:00" },
  ];

  // Load saved timetables on mount
  useEffect(() => {
    const timetables = getSavedTimetables();
    console.log("Loaded timetables:", timetables);
    setSavedTimetables(timetables);

    // Auto-load latest timetable
    if (timetables.length > 0) {
      const latest = timetables[0];
      console.log("Latest timetable:", latest);
      setSelectedTimetable(latest);
      const processed = processTimetableData(latest.data);
      console.log("Processed sessions:", processed);
      setProcessedSessions(processed);
    }
  }, []);

  // Handle timetable selection
  const handleSelectTimetable = (timetable: SavedTimetable) => {
    setSelectedTimetable(timetable);
    setProcessedSessions(processTimetableData(timetable.data));
  };

  // Handle delete timetable
  const handleDeleteTimetable = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa thời khóa biểu này?")) {
      deleteTimetable(id);
      const updated = getSavedTimetables();
      setSavedTimetables(updated);

      // If deleted current timetable, switch to latest
      if (selectedTimetable?.id === id) {
        if (updated.length > 0) {
          handleSelectTimetable(updated[0]);
        } else {
          setSelectedTimetable(null);
          setProcessedSessions([]);
        }
      }
    }
  };

  // Get session for specific day and period
  const getSessionForSlot = (
    dayIndex: number,
    period: number
  ): ProcessedSession | null => {
    return (
      processedSessions.find(
        (session) =>
          session.day_index === dayIndex && session.periods.includes(period)
      ) || null
    );
  };

  // Check if period is first in a session (for rendering course name)
  const isFirstPeriod = (
    period: number,
    session: ProcessedSession
  ): boolean => {
    return session.periods[0] === period;
  };

  const nextDay = () => {
    setSelectedDay((prev) => (prev + 1) % days.length);
  };

  const prevDay = () => {
    setSelectedDay((prev) => (prev - 1 + days.length) % days.length);
  };

  const currentDay = days[selectedDay];

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-blue-50 p-3 sm:p-6">
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
                    Thời Khóa Biểu
                  </h1>
                  {selectedTimetable && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Lưu lúc:{" "}
                      {new Date(selectedTimetable.timestamp).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="bg-gray-100 rounded-full p-1 flex gap-1 shadow-inner">
                <button
                  onClick={() => setViewMode("mobile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${
                    viewMode === "mobile"
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
                <button
                  onClick={() => setViewMode("desktop")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${
                    viewMode === "desktop"
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
              </div>
            </div>

            {/* Day Selector - Only show in mobile view */}
            {viewMode === "mobile" && (
              <>
                <div className="flex items-center justify-between gap-3 mt-4">
                  <button
                    onClick={prevDay}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>

                  <div
                    className={`flex-1 bg-gradient-to-br ${currentDay.color} rounded-xl p-3 shadow-sm`}
                  >
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
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {day.shortName}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Saved Timetables Selector */}
          {savedTimetables.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-blue-100 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-gray-800 text-sm">
                  Thời khóa biểu đã lưu ({savedTimetables.length})
                </h3>
              </div>
              <div className="space-y-2">
                {savedTimetables.map((timetable) => (
                  <div
                    key={timetable.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedTimetable?.id === timetable.id
                        ? "bg-blue-50 border-blue-300 shadow-sm"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSelectTimetable(timetable)}
                  >
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-800">
                        {new Date(timetable.timestamp).toLocaleString("vi-VN")}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {timetable.data.scheduled_sessions.length} môn đã xếp •{" "}
                        {timetable.data.unscheduled_sessions.length} môn chưa
                        xếp
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTimetable(timetable.id);
                      }}
                      className="ml-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!selectedTimetable && savedTimetables.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Chưa có thời khóa biểu
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Hãy tạo thời khóa biểu từ trang Chat bằng lệnh /timetable
            </p>
          </div>
        )}

        {/* Schedule Display */}
        {selectedTimetable && viewMode === "mobile" && (
          /* Mobile View - Single Column */
          <div className="space-y-2.5 max-w-3xl mx-auto">
            {periods.map((period) => {
              const time =
                period <= 5
                  ? morningTimes[period - 1].time
                  : afternoonTimes[period - 6].time;
              const isMorning = period <= 5;
              const session = getSessionForSlot(selectedDay, period);

              return (
                <div
                  key={period}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
                    isMorning ? "border-blue-100" : "border-blue-200"
                  }`}
                >
                  <div className="flex items-stretch">
                    {/* Time Badge */}
                    <div
                      className={`w-20 flex-shrink-0 bg-gradient-to-br ${
                        isMorning
                          ? "from-blue-500 to-blue-600"
                          : "from-blue-600 to-blue-700"
                      } p-3 flex flex-col items-center justify-center`}
                    >
                      <div className="text-white font-bold text-base">
                        Tiết {period}
                      </div>
                      <div className="text-white/90 text-xs mt-0.5 font-medium">
                        {time}
                      </div>
                    </div>

                    {/* Content Area */}
                    {session ? (
                      <div
                        className={`flex-1 p-3 bg-gradient-to-br ${session.color} min-h-[85px] flex flex-col justify-center`}
                      >
                        {isFirstPeriod(period, session) && (
                          <>
                            <div className="text-white font-bold text-sm leading-tight mb-1">
                              {session.course_name}
                            </div>
                            <div className="text-white/90 text-xs">
                              📍 Phòng {session.classroom}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`flex-1 p-3 bg-gradient-to-br ${currentDay.bgColor} min-h-[85px] flex items-center justify-center`}
                      >
                        <div className="text-center opacity-50">
                          <div className="w-8 h-8 mx-auto mb-1 rounded-full border border-dashed border-gray-300 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">•</span>
                          </div>
                          <p className="text-gray-400 text-[10px]">Trống</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTimetable && viewMode === "desktop" && (
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
                const time =
                  period <= 5
                    ? morningTimes[period - 1].time
                    : afternoonTimes[period - 6].time;

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
                    {days.map((day, dayIndex) => {
                      const session = getSessionForSlot(dayIndex, period);

                      return (
                        <div
                          key={`${period}-${day.name}`}
                          className={`p-2 min-h-[60px] transition-all ${
                            session
                              ? ""
                              : "bg-white hover:bg-blue-50 cursor-pointer group"
                          }`}
                        >
                          {session ? (
                            <div
                              className={`w-full h-full rounded bg-gradient-to-br ${session.color} p-2 flex flex-col justify-center shadow-sm`}
                            >
                              {isFirstPeriod(period, session) && (
                                <>
                                  <div className="text-white font-semibold text-[10px] leading-tight mb-0.5">
                                    {session.course_name}
                                  </div>
                                  <div className="text-white/90 text-[9px]">
                                    {session.classroom}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-full rounded border border-dashed border-gray-200 group-hover:border-blue-400 transition-colors flex items-center justify-center">
                              <span className="text-gray-300 group-hover:text-blue-500 text-xs font-light opacity-50">
                                •
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {selectedTimetable && (
          <>
            {/* Time Legend */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {/* Morning Times */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-base">
                    Buổi Sáng
                  </h4>
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
                      <span className="text-gray-700 font-semibold">
                        Tiết {item.period}
                      </span>
                      <span className="ml-auto text-gray-600 font-medium text-xs">
                        {item.time}
                      </span>
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
                  <h4 className="font-bold text-gray-800 text-base">
                    Buổi Chiều
                  </h4>
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
                      <span className="text-gray-700 font-semibold">
                        Tiết {item.period}
                      </span>
                      <span className="ml-auto text-gray-600 font-medium text-xs">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Spacing */}
            <div className="h-6"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default TimetablePage;
