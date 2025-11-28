// Utility functions for timetable data processing

export interface TimetableSession {
  stt_id: string;
  course_name: string;
  day: string;
  time_slots: string;
  classroom: string;
  reason_not_selected?: string;
}

export interface TimetableData {
  scheduled_sessions: TimetableSession[];
  unscheduled_sessions: TimetableSession[];
}

export interface SavedTimetable {
  id: number;
  timestamp: string;
  data: TimetableData;
}

export interface ProcessedSession {
  course_name: string;
  classroom: string;
  day_index: number; // 0-6 (Thứ 2 - Chủ nhật)
  periods: number[]; // Array of period numbers (1-10)
  color?: string;
}

// Map Vietnamese day names to day indices
const dayMap: Record<string, number> = {
  "Thứ 2": 0,
  "Thứ 3": 1,
  "Thứ 4": 2,
  "Thứ 5": 3,
  "Thứ 6": 4,
  "Thứ 7": 5,
  "Thứ Hai": 0,
  "Thứ Ba": 1,
  "Thứ Tư": 2,
  "Thứ Năm": 3,
  "Thứ Sáu": 4,
  "Thứ Bảy": 5,
  "Chủ nhật": 6,
  "Chủ Nhật": 6,
  CN: 6,
  T2: 0,
  T3: 1,
  T4: 2,
  T5: 3,
  T6: 4,
  T7: 5,
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

// Parse time slots string to period numbers
// Examples: "1-3" => [1,2,3], "Tiết 1->4" => [1,2,3,4], "6" => [6]
function parseTimeSlots(time_slots: string): number[] {
  // Remove "Tiết" prefix if present and trim
  const cleaned = time_slots.replace(/Tiết\s*/gi, "").trim();

  // Handle arrow format (->)
  if (cleaned.includes("->")) {
    const parts = cleaned.split("->");
    if (parts.length === 2) {
      const start = parseInt(parts[0]);
      const end = parseInt(parts[1]);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  }

  // Handle dash format (-)
  if (cleaned.includes("-")) {
    const parts = cleaned.split("-");
    if (parts.length === 2) {
      const start = parseInt(parts[0]);
      const end = parseInt(parts[1]);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  }

  return [parseInt(cleaned)];
}

// Cool blue color palette with various shades and tones
const courseColors = [
  "from-blue-600 to-blue-700",
  "from-cyan-600 to-cyan-700",
  "from-sky-600 to-sky-700",
  "from-indigo-600 to-indigo-700",
  "from-teal-600 to-teal-700",
  "from-blue-500 to-blue-600",
  "from-cyan-500 to-cyan-600",
  "from-sky-500 to-sky-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
  "from-blue-700 to-blue-800",
  "from-cyan-700 to-cyan-800",
  "from-sky-700 to-sky-800",
  "from-indigo-700 to-indigo-800",
  "from-teal-700 to-teal-800",
];

let colorIndex = 0;
const courseColorMap = new Map<string, string>();

function getColorForCourse(courseName: string): string {
  if (!courseColorMap.has(courseName)) {
    courseColorMap.set(
      courseName,
      courseColors[colorIndex % courseColors.length]
    );
    colorIndex++;
  }
  return courseColorMap.get(courseName)!;
}

// Process timetable data for display
export function processTimetableData(data: TimetableData): ProcessedSession[] {
  // Reset color mapping for new timetable
  courseColorMap.clear();
  colorIndex = 0;

  console.log("Processing timetable data:", data);

  return data.scheduled_sessions.map((session) => {
    const dayIndex = dayMap[session.day] ?? 0;
    console.log(
      `Session: ${session.course_name}, Day: ${session.day}, DayIndex: ${dayIndex}, TimeSlots: ${session.time_slots}`
    );
    const periods = parseTimeSlots(session.time_slots);
    const color = getColorForCourse(session.course_name);

    return {
      course_name: session.course_name,
      classroom: session.classroom,
      day_index: dayIndex,
      periods: periods,
      color: color,
    };
  });
}

// Get saved timetables from localStorage
export function getSavedTimetables(): SavedTimetable[] {
  try {
    const saved = localStorage.getItem("saved_timetables");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Get the most recent timetable
export function getLatestTimetable(): SavedTimetable | null {
  const timetables = getSavedTimetables();
  return timetables.length > 0 ? timetables[0] : null;
}

// Delete a saved timetable
export function deleteTimetable(id: number): void {
  const timetables = getSavedTimetables();
  const filtered = timetables.filter((t) => t.id !== id);
  localStorage.setItem("saved_timetables", JSON.stringify(filtered));
}

// Load specific timetable by ID
export function loadTimetable(id: number): SavedTimetable | null {
  const timetables = getSavedTimetables();
  return timetables.find((t) => t.id === id) || null;
}
