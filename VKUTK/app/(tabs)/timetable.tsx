import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTimetable, ClassSession } from "@/contexts/TimetableContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

const SAMPLE_DATA: ClassSession[] = [
  {
    id: "1",
    day: "Thứ 2",
    period: "Tiết 1-3",
    subject: "Lập trình thiết bị di động",
    room: "V.A201",
    lecturer: "Nguyễn Văn A",
    color: "#6366F1",
  },
  {
    id: "2",
    day: "Thứ 2",
    period: "Tiết 7-9",
    subject: "Trí tuệ nhân tạo",
    room: "V.B102",
    lecturer: "Trần Thị B",
    color: "#EC4899",
  },
  {
    id: "3",
    day: "Thứ 3",
    period: "Tiết 4-6",
    subject: "Phát triển ứng dụng Web",
    room: "K.C305",
    lecturer: "Lê Văn C",
    color: "#10B981",
  },
  {
    id: "4",
    day: "Thứ 4",
    period: "Tiết 1-3",
    subject: "Tiếng Anh chuyên ngành",
    room: "Online",
    lecturer: "Phạm Thị D",
    color: "#F59E0B",
  },
  {
    id: "5",
    day: "Thứ 5",
    period: "Tiết 7-9",
    subject: "Đồ án cơ sở ngành",
    room: "V.A105",
    lecturer: "Hoàng Văn E",
    color: "#8B5CF6",
  },
];

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

export default function TimetableScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { schedule, setSchedule } = useTimetable();

  const handleImportSample = () => {
    Alert.alert(
      "Import TKB Mẫu",
      "Bạn có muốn nhập dữ liệu thời khóa biểu mẫu không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: () => setSchedule(SAMPLE_DATA),
        },
      ]
    );
  };

  const handleClear = () => {
    setSchedule([]);
  };

  const renderClassCard = (session: ClassSession) => (
    <View
      key={session.id}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
          borderLeftColor: session.color || "#6366F1",
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text
          style={[styles.subject, { color: isDark ? "#FFFFFF" : "#111827" }]}
        >
          {session.subject}
        </Text>
        <View
          style={[
            styles.periodBadge,
            { backgroundColor: (session.color || "#6366F1") + "20" },
          ]}
        >
          <Text style={[styles.periodText, { color: session.color }]}>
            {session.period}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={isDark ? "#9CA3AF" : "#6B7280"}
          />
          <Text
            style={[styles.infoText, { color: isDark ? "#D1D5DB" : "#4B5563" }]}
          >
            {session.room}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons
            name="person-outline"
            size={16}
            color={isDark ? "#9CA3AF" : "#6B7280"}
          />
          <Text
            style={[styles.infoText, { color: isDark ? "#D1D5DB" : "#4B5563" }]}
          >
            {session.lecturer}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#111827" : "#F3F4F6" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: isDark ? "#111827" : "#F3F4F6",
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
        >
          Thời khóa biểu
        </Text>
        <View style={styles.headerActions}>
          {schedule.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              style={[styles.iconButton, { marginRight: 8 }]}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color={isDark ? "#EF4444" : "#DC2626"}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleImportSample}
            style={styles.iconButton}
          >
            <Ionicons
              name="download-outline"
              size={24}
              color={isDark ? "#60A5FA" : "#2563EB"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {schedule.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={isDark ? "#374151" : "#D1D5DB"}
            />
            <Text
              style={[
                styles.emptyText,
                { color: isDark ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              Chưa có dữ liệu thời khóa biểu
            </Text>
            <TouchableOpacity
              style={[
                styles.importButton,
                { backgroundColor: isDark ? "#374151" : "#FFFFFF" },
              ]}
              onPress={handleImportSample}
            >
              <Text style={styles.importButtonText}>Import TKB Mẫu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          DAYS.map((day) => {
            const daySessions = schedule.filter((s) => s.day === day);
            if (daySessions.length === 0) return null;

            return (
              <View key={day} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <Text
                    style={[
                      styles.dayTitle,
                      { color: isDark ? "#E5E7EB" : "#374151" },
                    ]}
                  >
                    {day}
                  </Text>
                  <View
                    style={[
                      styles.dayLine,
                      { backgroundColor: isDark ? "#374151" : "#E5E7EB" },
                    ]}
                  />
                </View>
                <View style={styles.sessionsList}>
                  {daySessions.map(renderClassCard)}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "transparent", // Hidden border
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  importButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  importButtonText: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  daySection: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 12,
  },
  dayLine: {
    flex: 1,
    height: 1,
  },
  sessionsList: {
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  subject: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  periodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 14,
  },
});
