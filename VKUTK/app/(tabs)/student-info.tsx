import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { API_ENDPOINTS, getAuthHeader } from "../../utils/apiConfig";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StudentInfo {
  StudentID: string;
  ho_va_ten: string;
  lop: string;
  khoa: string;
  chuyen_nganh?: string;
  khoa_hoc?: string;
}

interface Grade {
  id?: number;
  TenHocPhan: string;
  SoTC: number;
  DiemTK: number | null;
  DiemThi: number | null;
  DiemT10: number | null;
  DiemTongKet: number | null;
  XepLoai: string | null;
  HocKy: string;
}

interface AcademicProgress {
  id: number;
  TenHocPhan: string;
  HocKy: number;
  DiemChu: string | null;
  DiemT4: string | null;
  SoTC: number;
}

interface SemesterSummary {
  HocKy: number;
  courses: AcademicProgress[];
  totalTC: number;
  completedTC: number;
  gpa?: number;
}

type Tab = "info" | "grades" | "progress";

export default function StudentInfoScreen() {
  const { session, signOut } = useAuth();
  const { isDark, t } = useTheme();
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [progress, setProgress] = useState<SemesterSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const insets = useSafeAreaInsets();
  const scrollY = new Animated.Value(0);

  const fetchStudentInfo = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setIsLoading(true);
      const headers = getAuthHeader(session.access_token);

      const infoResponse = await fetch(API_ENDPOINTS.STUDENTS, { headers });
      if (infoResponse.ok) {
        const data = await infoResponse.json();
        if (data.students && data.students.length > 0) {
          const student = data.students[0];
          setStudentInfo(student);

          const gradesResponse = await fetch(
            `${API_ENDPOINTS.STUDENTS}/${student.StudentID}/grades`,
            { headers }
          );
          if (gradesResponse.ok) {
            const gradesData = await gradesResponse.json();
            setGrades(gradesData);
          }

          const progressResponse = await fetch(
            `${API_ENDPOINTS.PROGRESS}/${student.StudentID}/tien-do-hoc-tap`,
            { headers }
          );
          if (progressResponse.ok) {
            const progressData: AcademicProgress[] =
              await progressResponse.json();

            const semesterMap = new Map<number, AcademicProgress[]>();
            progressData.forEach((course) => {
              if (!semesterMap.has(course.HocKy)) {
                semesterMap.set(course.HocKy, []);
              }
              semesterMap.get(course.HocKy)!.push(course);
            });

            const summaries: SemesterSummary[] = Array.from(
              semesterMap.entries()
            )
              .map(([hocKy, courses]) => ({
                HocKy: hocKy,
                courses,
                totalTC: courses.reduce((sum, c) => sum + (c.SoTC || 0), 0),
                completedTC: courses
                  .filter((c) => c.DiemChu && c.DiemChu !== "F")
                  .reduce((sum, c) => sum + (c.SoTC || 0), 0),
              }))
              .sort((a, b) => a.HocKy - b.HocKy);

            setProgress(summaries);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    fetchStudentInfo();
  }, [fetchStudentInfo]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudentInfo();
  }, [fetchStudentInfo]);

  const getGradeColor = (grade: string | null) => {
    if (!grade) return isDark ? "#374151" : "#E5E7EB";
    if (grade.startsWith("A")) return "#10B981";
    if (grade.startsWith("B")) return "#3B82F6";
    if (grade.startsWith("C")) return "#F59E0B";
    if (grade.startsWith("D")) return "#EF4444";
    return "#EF4444";
  };

  const renderInfoTab = () => (
    <View style={styles.contentContainer}>
      {/* Profile Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderColor: isDark ? "#374151" : "#E5E7EB",
          },
        ]}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: isDark ? "#374151" : "#F3F4F6",
                  borderColor: isDark ? "#4B5563" : "#E5E7EB",
                },
              ]}
            >
              <Text style={styles.avatarText}>
                {studentInfo?.ho_va_ten.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.studentName, { color: isDark ? "#FFF" : "#111827" }]}
          >
            {studentInfo?.ho_va_ten}
          </Text>
          <View
            style={[
              styles.idBadge,
              { backgroundColor: isDark ? "#374151" : "#E5E7EB" },
            ]}
          >
            <Text
              style={[
                styles.studentId,
                { color: isDark ? "#D1D5DB" : "#4B5563" },
              ]}
            >
              {studentInfo?.StudentID}
            </Text>
          </View>
        </View>

        {/* Info Items */}
        <View style={styles.infoSection}>
          <InfoItem icon="school" label={t("class")} value={studentInfo?.lop} />
          <InfoItem
            icon="business"
            label={t("department")}
            value={studentInfo?.khoa}
          />
          <InfoItem
            icon="bookmark"
            label={t("major")}
            value={studentInfo?.chuyen_nganh}
          />
          <InfoItem
            icon="calendar"
            label={t("course")}
            value={studentInfo?.khoa_hoc}
          />
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              borderColor: isDark ? "#374151" : "#E5E7EB",
            },
          ]}
        >
          <View
            style={[
              styles.statIconWrapper,
              { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
            ]}
          >
            <Ionicons
              name="book"
              size={22}
              color={isDark ? "#60A5FA" : "#3B82F6"}
            />
          </View>
          <Text
            style={[styles.statValue, { color: isDark ? "#FFF" : "#1F2937" }]}
          >
            {grades.length}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: isDark ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            Courses
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              borderColor: isDark ? "#374151" : "#E5E7EB",
            },
          ]}
        >
          <View
            style={[
              styles.statIconWrapper,
              { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
            ]}
          >
            <Ionicons
              name="trophy"
              size={22}
              color={isDark ? "#FBBF24" : "#F59E0B"}
            />
          </View>
          <Text
            style={[styles.statValue, { color: isDark ? "#FFF" : "#1F2937" }]}
          >
            {grades.filter((g) => g.XepLoai?.startsWith("A")).length}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: isDark ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            A Grades
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              borderColor: isDark ? "#374151" : "#E5E7EB",
            },
          ]}
        >
          <View
            style={[
              styles.statIconWrapper,
              { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
            ]}
          >
            <Ionicons
              name="time"
              size={22}
              color={isDark ? "#A78BFA" : "#8B5CF6"}
            />
          </View>
          <Text
            style={[styles.statValue, { color: isDark ? "#FFF" : "#1F2937" }]}
          >
            {progress.length}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: isDark ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            Semesters
          </Text>
        </View>
      </View>
    </View>
  );

  const renderGradesTab = () => (
    <View style={styles.contentContainer}>
      {grades.map((grade, index) => (
        <View
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              borderColor: isDark ? "#374151" : "#E5E7EB",
            },
          ]}
        >
          <View style={styles.gradeCardHeader}>
            <View style={styles.gradeInfo}>
              <Text
                style={[
                  styles.gradeTitle,
                  { color: isDark ? "#FFF" : "#1F2937" },
                ]}
                numberOfLines={2}
              >
                {grade.TenHocPhan}
              </Text>
              <Text
                style={[
                  styles.gradeMeta,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {t("semester")} {grade.HocKy} • {grade.SoTC} {t("credits")}
              </Text>
            </View>
            <View
              style={[
                styles.gradeBadge,
                { backgroundColor: getGradeColor(grade.XepLoai) },
              ]}
            >
              <Text style={styles.gradeBadgeText}>{grade.XepLoai || "?"}</Text>
            </View>
          </View>

          <View style={styles.gradeScores}>
            <ScoreItem
              label="Hệ 10"
              value={grade.DiemT10}
              isDark={isDark}
              valueColor={(() => {
                const score = grade.DiemT10;
                if (score === null || score === undefined) return undefined;
                if (score >= 8.5) return isDark ? "#4ADE80" : "#16A34A"; // Green
                if (score >= 7.0) return isDark ? "#60A5FA" : "#2563EB"; // Blue
                if (score < 6.0) return isDark ? "#F87171" : "#DC2626"; // Red
                return undefined;
              })()}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderProgressTab = () => (
    <View style={styles.contentContainer}>
      {progress.map((semester) => (
        <View
          key={semester.HocKy}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              borderColor: isDark ? "#374151" : "#E5E7EB",
            },
          ]}
        >
          <View style={styles.semesterHeader}>
            <View>
              <Text
                style={[
                  styles.semesterTitle,
                  { color: isDark ? "#FFF" : "#1F2937" },
                ]}
              >
                {t("semester")} {semester.HocKy}
              </Text>
              <Text
                style={[
                  styles.semesterSubtitle,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {semester.courses.length} courses • {semester.completedTC}/
                {semester.totalTC} credits
              </Text>
            </View>
            <View
              style={[
                styles.progressCircle,
                {
                  borderColor: isDark ? "#60A5FA" : "#3B82F6",
                  backgroundColor: isDark ? "#374151" : "#EFF6FF",
                },
              ]}
            >
              <Text
                style={[
                  styles.progressPercent,
                  { color: isDark ? "#FFF" : "#1F2937" },
                ]}
              >
                {Math.round((semester.completedTC / semester.totalTC) * 100)}%
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarBg,
                {
                  backgroundColor: isDark ? "#374151" : "#E5E7EB",
                },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: isDark ? "#60A5FA" : "#3B82F6",
                    width: `${
                      (semester.completedTC / semester.totalTC) * 100
                    }%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.coursesList}>
            {semester.courses.slice(0, 5).map((course, idx) => (
              <View key={idx} style={styles.courseRow}>
                <View
                  style={[
                    styles.courseDot,
                    {
                      backgroundColor:
                        course.DiemChu && course.DiemChu !== "F"
                          ? "#10B981"
                          : "#F59E0B",
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.courseText,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                  numberOfLines={1}
                >
                  {course.TenHocPhan}
                </Text>
                <Text
                  style={[
                    styles.courseGrade,
                    { color: isDark ? "#FFF" : "#1F2937" },
                  ]}
                >
                  {course.DiemChu || "-"}
                </Text>
              </View>
            ))}
            {semester.courses.length > 5 && (
              <Text
                style={[
                  styles.moreText,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                +{semester.courses.length - 5} more courses
              </Text>
            )}
          </View>
        </View>
      ))}
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
            paddingTop: insets.top + 12,
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderBottomColor: isDark ? "#374151" : "#E5E7EB",
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
        >
          {t("studentProfile")}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={async () => {
              await signOut();
              router.replace("/login");
            }}
            style={[
              styles.iconButton,
              { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={isDark ? "#EF4444" : "#DC2626"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={[
              styles.iconButton,
              { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
            ]}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={isDark ? "#D1D5DB" : "#4B5563"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              borderColor: isDark ? "#374151" : "#E5E7EB",
            },
          ]}
        >
          {(["info", "grades", "progress"] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && {
                  backgroundColor: isDark ? "#374151" : "#F3F4F6",
                },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab
                        ? isDark
                          ? "#FFFFFF"
                          : "#111827"
                        : isDark
                        ? "#9CA3AF"
                        : "#6B7280",
                    fontWeight: activeTab === tab ? "700" : "500",
                  },
                ]}
              >
                {t(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#FFFFFF" : "#111827"}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color={isDark ? "#FFFFFF" : "#111827"}
            style={{ marginTop: 50 }}
          />
        ) : studentInfo ? (
          <>
            {activeTab === "info" && renderInfoTab()}
            {activeTab === "grades" && renderGradesTab()}
            {activeTab === "progress" && renderProgressTab()}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={isDark ? "#4B5563" : "#9CA3AF"}
            />
            <Text
              style={[
                styles.emptyText,
                { color: isDark ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {t("noData")}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const InfoItem = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string;
}) => {
  const { isDark } = useTheme();
  return (
    <View style={styles.infoItem}>
      <View
        style={[
          styles.infoIconWrapper,
          { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={isDark ? "#9CA3AF" : "#6B7280"}
        />
      </View>
      <View style={styles.infoTextWrapper}>
        <Text
          style={[styles.infoLabel, { color: isDark ? "#9CA3AF" : "#6B7280" }]}
        >
          {label}
        </Text>
        <Text
          style={[styles.infoValue, { color: isDark ? "#FFF" : "#1F2937" }]}
        >
          {value || "N/A"}
        </Text>
      </View>
    </View>
  );
};

const ScoreItem = ({
  label,
  value,
  isDark,
  highlighted,
  valueColor,
}: {
  label: string;
  value: number | null;
  isDark: boolean;
  highlighted?: boolean;
  valueColor?: string;
}) => (
  <View
    style={[
      styles.scoreItem,
      { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
      highlighted && {
        backgroundColor: isDark ? "rgba(96, 165, 250, 0.2)" : "#EFF6FF",
      },
    ]}
  >
    <Text
      style={[styles.scoreLabel, { color: isDark ? "#9CA3AF" : "#6B7280" }]}
    >
      {label}
    </Text>
    <Text
      style={[
        styles.scoreValue,
        {
          color: valueColor
            ? valueColor
            : highlighted
            ? isDark
              ? "#60A5FA"
              : "#3B82F6"
            : isDark
            ? "#FFF"
            : "#1F2937",
        },
      ]}
    >
      {value !== null ? value.toFixed(1) : "-"}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerButtons: {
    position: "absolute",
    right: 20,
    bottom: 8,
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tabSelector: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  contentContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#6366F1",
  },
  studentName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  idBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  studentId: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoSection: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  gradeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  gradeInfo: {
    flex: 1,
    marginRight: 12,
  },
  gradeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 22,
  },
  gradeMeta: {
    fontSize: 12,
    fontWeight: "500",
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  gradeBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  gradeScores: {
    flexDirection: "row",
    gap: 8,
  },
  scoreItem: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  semesterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  semesterTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  semesterSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  coursesList: {
    gap: 12,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  courseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  courseText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  courseGrade: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 30,
    textAlign: "right",
  },
  moreText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
});
