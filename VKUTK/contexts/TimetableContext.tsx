import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ClassSession {
  id: string;
  day: string;
  period: string;
  subject: string;
  room: string;
  lecturer: string;
  color?: string;
}

interface TimetableContextType {
  schedule: ClassSession[];
  setSchedule: (schedule: ClassSession[]) => void;
  importFromWebhook: (data: any) => void;
}

const TimetableContext = createContext<TimetableContextType | undefined>(
  undefined
);

export function TimetableProvider({ children }: { children: React.ReactNode }) {
  const [schedule, setSchedule] = useState<ClassSession[]>([]);

  // Load from storage on mount
  useEffect(() => {
    loadSchedule();
  }, []);

  // Save to storage whenever schedule changes
  useEffect(() => {
    saveSchedule();
  }, [schedule]);

  const loadSchedule = async () => {
    try {
      const stored = await AsyncStorage.getItem("@vku_timetable");
      if (stored) {
        setSchedule(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load timetable", e);
    }
  };

  const saveSchedule = async () => {
    try {
      await AsyncStorage.setItem("@vku_timetable", JSON.stringify(schedule));
    } catch (e) {
      console.error("Failed to save timetable", e);
    }
  };

  const importFromWebhook = (data: any) => {
    if (!data || !data.scheduled_sessions) return;

    const normalizeDay = (day: string) => {
      const map: Record<string, string> = {
        "Thứ Hai": "Thứ 2",
        "Thứ Ba": "Thứ 3",
        "Thứ Tư": "Thứ 4",
        "Thứ Năm": "Thứ 5",
        "Thứ Sáu": "Thứ 6",
        "Thứ Bảy": "Thứ 7",
        "Chủ Nhật": "CN",
      };
      return map[day] || day;
    };

    const colors = [
      "#6366F1",
      "#EC4899",
      "#10B981",
      "#F59E0B",
      "#8B5CF6",
      "#3B82F6",
      "#EF4444",
    ];

    const newSchedule: ClassSession[] = data.scheduled_sessions.map(
      (item: any, index: number) => ({
        id: item.stt_id?.toString() || Math.random().toString(),
        day: normalizeDay(item.day),
        period: item.time_slots?.replace("->", "-") || "",
        subject: item.course_name,
        room: item.classroom,
        lecturer: "", // Webhook doesn't return lecturer yet
        color: colors[index % colors.length],
      })
    );

    setSchedule(newSchedule);
  };

  return (
    <TimetableContext.Provider
      value={{ schedule, setSchedule, importFromWebhook }}
    >
      {children}
    </TimetableContext.Provider>
  );
}

export function useTimetable() {
  const context = useContext(TimetableContext);
  if (context === undefined) {
    throw new Error("useTimetable must be used within a TimetableProvider");
  }
  return context;
}
