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
      color: "from-blue-600 to-blue-700",
      bgColor: "from-blue-50 to-blue-100",
      textColor: "text-white",
    },
    {
      name: "THỨ BA",
      shortName: "T3",
      color: "from-cyan-600 to-cyan-700",
      bgColor: "from-cyan-50 to-cyan-100",
      textColor: "text-white",
    },
    {
      name: "THỨ TƯ",
      shortName: "T4",
      color: "from-sky-600 to-sky-700",
      bgColor: "from-sky-50 to-sky-100",
      textColor: "text-white",
    },
    {
      name: "THỨ NĂM",
      shortName: "T5",
      color: "from-indigo-600 to-indigo-700",
      bgColor: "from-indigo-50 to-indigo-100",
      textColor: "text-white",
    },
    {
      name: "THỨ SÁU",
      shortName: "T6",
      color: "from-teal-600 to-teal-700",
      bgColor: "from-teal-50 to-teal-100",
      textColor: "text-white",
    },
    {
      name: "THỨ BẢY",
      shortName: "T7",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      textColor: "text-white",
    },
    {
      name: "CHỦ NHẬT",
      shortName: "CN",
      color: "from-cyan-500 to-cyan-600",
      bgColor: "from-cyan-50 to-cyan-100",
      textColor: "text-white",
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

  // Check if this period should be rendered or is part of a previous session's span
  const shouldRenderPeriod = (dayIndex: number, period: number): boolean => {
    const session = getSessionForSlot(dayIndex, period);
    if (!session) return true; // Empty slot, render it
    return session.periods[0] === period; // Only render if it's the first period
  };

  // Get the number of periods a session spans (for rowspan/height calculation)
  const getSessionSpan = (session: ProcessedSession): number => {
    return session.periods.length;
  };

  const nextDay = () => {
    setSelectedDay((prev) => (prev + 1) % days.length);
  };

  const prevDay = () => {
    setSelectedDay((prev) => (prev - 1 + days.length) % days.length);
  };

  const currentDay = days[selectedDay];

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-md">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                    Thời Khóa Biểu
                  </h1>
                  {selectedTimetable && (
                    <p className="text-sm font-medium text-blue-600 mt-1">
                      Lưu lúc:{" "}
                      {new Date(selectedTimetable.timestamp).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="bg-blue-100/50 rounded-2xl p-1.5 flex gap-2 shadow-sm border border-blue-200">
                <button
                  onClick={() => setViewMode("mobile")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    viewMode === "mobile"
                      ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md"
                      : "text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
                <button
                  onClick={() => setViewMode("desktop")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    viewMode === "desktop"
                      ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md"
                      : "text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
              </div>
            </div>

            {/* Day Selector - Only show in mobile view */}
            {viewMode === "mobile" && (
              <>
                <div className="flex items-center justify-between gap-4 mt-4">
                  <button
                    onClick={prevDay}
                    className="w-12 h-12 flex items-center justify-center bg-white hover:bg-blue-50 rounded-2xl transition-all active:scale-95 shadow-md border border-blue-200"
                  >
                    <ChevronLeft className="w-5 h-5 text-blue-700" />
                  </button>

                  <div
                    className={`flex-1 bg-gradient-to-br ${currentDay.color} rounded-2xl p-4 shadow-lg border border-white/30`}
                  >
                    <div className="text-center">
                      <div className="text-white font-bold text-xl tracking-wide drop-shadow-md">
                        {currentDay.name}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={nextDay}
                    className="w-12 h-12 flex items-center justify-center bg-white hover:bg-blue-50 rounded-2xl transition-all active:scale-95 shadow-md border border-blue-200"
                  >
                    <ChevronRight className="w-5 h-5 text-blue-700" />
                  </button>
                </div>

                {/* Day Pills */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                  {days.map((day, index) => (
                    <button
                      key={day.shortName}
                      onClick={() => setSelectedDay(index)}
                      className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        index === selectedDay
                          ? `bg-gradient-to-br ${day.color} text-white shadow-md`
                          : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 shadow-sm"
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
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-blue-200 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900 text-base">
                  Thời khóa biểu đã lưu ({savedTimetables.length})
                </h3>
              </div>
              <div className="space-y-2">
                {savedTimetables.map((timetable) => (
                  <div
                    key={timetable.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedTimetable?.id === timetable.id
                        ? "bg-blue-50 border-blue-300 shadow-md"
                        : "bg-white border-blue-200 hover:bg-blue-50"
                    }`}
                    onClick={() => handleSelectTimetable(timetable)}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-900">
                        {new Date(timetable.timestamp).toLocaleString("vi-VN")}
                      </div>
                      <div className="text-xs font-medium text-blue-600 mt-1">
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
                      className="ml-3 p-2 text-blue-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!selectedTimetable && savedTimetables.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-12 border border-blue-200 text-center">
            <Calendar className="w-20 h-20 text-blue-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              Chưa có thời khóa biểu
            </h3>
            <p className="text-base font-medium text-blue-600 mb-4">
              Hãy tạo thời khóa biểu từ trang Chat bằng lệnh /timetable
            </p>
          </div>
        )}

        {/* Schedule Display */}
        {selectedTimetable && viewMode === "mobile" && (
          /* Mobile View - Single Column */
          <div className="space-y-2.5 max-w-3xl mx-auto">
            {periods.map((period) => {
              // Skip rendering if this period is part of a previous session's span
              if (!shouldRenderPeriod(selectedDay, period)) {
                return null;
              }

              const time =
                period <= 5
                  ? morningTimes[period - 1].time
                  : afternoonTimes[period - 6].time;
              const isMorning = period <= 5;
              const session = getSessionForSlot(selectedDay, period);
              const sessionSpan = session ? getSessionSpan(session) : 1;

              // Calculate dynamic height based on session span (increased base height)
              const minHeight = 100 * sessionSpan;
              
              // Dynamic font size based on course name length
              const courseName = session?.course_name || "";
              const getFontSize = (text: string) => {
                if (sessionSpan >= 3) return "text-lg"; // Large for 3+ periods
                if (sessionSpan === 2) return "text-base"; // Medium for 2 periods
                if (text.length > 40) return "text-xs"; // Small for long names
                if (text.length > 25) return "text-sm"; // Medium-small
                return "text-base"; // Default medium
              };

              return (
                <div
                  key={period}
                  className="bg-white rounded-2xl shadow-md border-2 border-blue-200 overflow-hidden transition-all hover:shadow-lg hover:border-blue-300"
                >
                  <div className="flex items-stretch">
                    {/* Time Badge */}
                    <div
                      className={`w-24 flex-shrink-0 bg-gradient-to-br ${
                        isMorning
                          ? "from-blue-600 to-blue-700"
                          : "from-cyan-600 to-cyan-700"
                      } p-4 flex flex-col items-center justify-center`}
                      style={{ minHeight: `${minHeight}px` }}
                    >
                      <div className="text-white font-bold text-lg tracking-tight drop-shadow-md">
                        Tiết {period}{sessionSpan > 1 ? `-${period + sessionSpan - 1}` : ''}
                      </div>
                      <div className="text-white/95 font-medium text-sm mt-1 drop-shadow">
                        {time}
                      </div>
                    </div>

                    {/* Content Area */}
                    {session ? (
                      <div
                        className={`flex-1 p-4 bg-gradient-to-br ${session.color} flex flex-col justify-center`}
                        style={{ minHeight: `${minHeight}px` }}
                      >
                        <div className={`text-white font-bold ${getFontSize(courseName)} leading-snug mb-2 drop-shadow-md`}>
                          {session.course_name}
                        </div>
                        <div className="text-white/95 font-medium text-sm flex items-center gap-1.5 drop-shadow">
                          <span className="text-base">📍</span>
                          <span>Phòng {session.classroom}</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex-1 p-4 bg-gradient-to-br ${currentDay.bgColor} flex items-center justify-center`}
                        style={{ minHeight: `${minHeight}px` }}
                      >
                        <div className="text-center opacity-40">
                          <div className="w-10 h-10 mx-auto mb-2 rounded-full border-2 border-dashed border-blue-300 flex items-center justify-center">
                            <span className="text-blue-400 text-base">•</span>
                          </div>
                          <p className="text-blue-500 text-xs font-medium">Trống</p>
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
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-blue-200">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-px bg-blue-200">
              <div className="bg-blue-50 p-3 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              {days.map((day) => (
                <div
                  key={day.name}
                  className={`bg-gradient-to-br ${day.color} p-3 text-center`}
                >
                  <div className="font-semibold text-white text-base tracking-wide drop-shadow-md">
                    {day.shortName}
                  </div>
                </div>
              ))}
            </div>

            {/* Timetable Grid */}
            <div className="grid grid-cols-8 auto-rows-[minmax(70px,auto)] gap-px bg-blue-200">
              {periods.map((period) => {
                const time =
                  period <= 5
                    ? morningTimes[period - 1].time
                    : afternoonTimes[period - 6].time;

                return (
                  <React.Fragment key={period}>
                    {/* Period Label */}
                    <div 
                      className="bg-blue-50 p-3 flex flex-col items-center justify-center"
                      style={{
                        gridColumn: 1,
                        gridRow: period
                      }}
                    >
                      <span className="text-sm font-semibold text-blue-800">
                        Tiết {period}
                      </span>
                      <span className="text-xs font-medium text-blue-600 mt-0.5">
                        {time}
                      </span>
                    </div>

                    {/* Time Slots */}
                    {days.map((day, dayIndex) => {
                      // Skip rendering if this period is part of a previous session's span
                      if (!shouldRenderPeriod(dayIndex, period)) {
                        return null;
                      }

                      const session = getSessionForSlot(dayIndex, period);
                      const sessionSpan = session ? getSessionSpan(session) : 1;
                      
                      // Dynamic font sizing based on content and span
                      const courseName = session?.course_name || "";
                      const getDesktopFontSize = () => {
                        if (sessionSpan >= 3) {
                          // Large blocks
                          if (courseName.length > 50) return "text-xs";
                          if (courseName.length > 30) return "text-sm";
                          return "text-base";
                        }
                        if (sessionSpan === 2) {
                          // Medium blocks
                          if (courseName.length > 40) return "text-[10px]";
                          if (courseName.length > 25) return "text-xs";
                          return "text-sm";
                        }
                        // Single blocks
                        if (courseName.length > 30) return "text-[9px]";
                        return "text-[10px]";
                      };

                      return (
                        <div
                          key={`${period}-${day.name}`}
                          className={`p-2.5 min-h-[70px] transition-all ${
                            session
                              ? ""
                              : "bg-white hover:bg-blue-50 cursor-pointer group"
                          }`}
                          style={{
                            gridColumn: dayIndex + 2,
                            gridRow: `${period} / span ${sessionSpan}`
                          }}
                        >
                          {session ? (
                            <div
                              className={`w-full h-full bg-gradient-to-br ${session.color} p-2.5 flex flex-col justify-center rounded-lg`}
                            >
                              <div className={`text-white font-semibold ${getDesktopFontSize()} leading-tight mb-1 drop-shadow`}>
                                {session.course_name}
                              </div>
                              <div className="text-white/95 font-medium text-[10px] flex items-center gap-0.5 drop-shadow-sm">
                                <span className="text-xs">📍</span>
                                <span>{session.classroom}</span>
                              </div>
                              <div className="text-white/90 font-medium text-[9px] mt-1 drop-shadow-sm">
                                Tiết {session.periods[0]}{sessionSpan > 1 ? `-${session.periods[session.periods.length - 1]}` : ''}
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-blue-300 group-hover:text-blue-400 text-sm opacity-40">
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
