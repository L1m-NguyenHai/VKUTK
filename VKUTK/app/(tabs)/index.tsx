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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
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
  const { session } = useAuth();
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
    if (!grade) return ["#78909C", "#90A4AE"];
    if (grade.startsWith("A")) return ["#66BB6A", "#81C784"];
    if (grade.startsWith("B")) return ["#42A5F5", "#64B5F6"];
    if (grade.startsWith("C")) return ["#FFA726", "#FFB74D"];
    if (grade.startsWith("D")) return ["#FF7043", "#FF8A65"];
    return ["#EF5350", "#E57373"];
  };

  const renderInfoTab = () => (
    <View style={styles.contentContainer}>
      {/* Profile Card */}
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? "dark" : "light"}
        style={styles.profileCard}
      >
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={["#FFFFFF", "#F0F0F0"]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {studentInfo?.ho_va_ten.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
          <Text style={styles.studentName}>{studentInfo?.ho_va_ten}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.studentId}>{studentInfo?.StudentID}</Text>
          </View>
        </LinearGradient>

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
      </BlurView>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={styles.statCard}
        >
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statIconWrapper}
          >
            <Ionicons name="book" size={22} color="#FFFFFF" />
          </LinearGradient>
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
        </BlurView>

        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={styles.statCard}
        >
          <LinearGradient
            colors={["#f093fb", "#f5576c"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statIconWrapper}
          >
            <Ionicons name="trophy" size={22} color="#FFFFFF" />
          </LinearGradient>
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
        </BlurView>

        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={styles.statCard}
        >
          <LinearGradient
            colors={["#4facfe", "#00f2fe"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statIconWrapper}
          >
            <Ionicons name="time" size={22} color="#FFFFFF" />
          </LinearGradient>
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
        </BlurView>
      </View>
    </View>
  );

  const renderGradesTab = () => (
    <View style={styles.contentContainer}>
      {grades.map((grade, index) => (
        <BlurView
          key={index}
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={styles.gradeCard}
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
            <LinearGradient
              colors={getGradeColor(grade.XepLoai)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradeBadge}
            >
              <Text style={styles.gradeBadgeText}>{grade.XepLoai || "?"}</Text>
            </LinearGradient>
          </View>

          <View style={styles.gradeScores}>
            <ScoreItem label="QT" value={grade.DiemTK} isDark={isDark} />
            <ScoreItem label="Thi" value={grade.DiemThi} isDark={isDark} />
            <ScoreItem label="Hệ 10" value={grade.DiemT10} isDark={isDark} />
            <ScoreItem
              label="TK"
              value={grade.DiemTongKet}
              isDark={isDark}
              highlighted
            />
          </View>
        </BlurView>
      ))}
    </View>
  );

  const renderProgressTab = () => (
    <View style={styles.contentContainer}>
      {progress.map((semester) => (
        <BlurView
          key={semester.HocKy}
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={styles.semesterCard}
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
            <View style={styles.progressCircle}>
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
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                },
              ]}
            >
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBarFill,
                  {
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
                          ? "#66BB6A"
                          : "#FFA726",
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
        </BlurView>
      ))}
    </View>
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isDark
            ? ["#1a1a2e", "#16213e", "#0f3460"]
            : ["#667eea", "#764ba2", "#f093fb"]
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            opacity: headerOpacity,
          },
        ]}
      >
        <BlurView
          intensity={80}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.headerTitle}>{t("studentProfile")}</Text>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Tab Selector */}
      <View style={[styles.tabSelector, { marginTop: insets.top + 60 }]}>
        <BlurView
          intensity={60}
          tint={isDark ? "dark" : "light"}
          style={styles.tabBlur}
        >
          {(["info", "grades", "progress"] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              {activeTab === tab && (
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {t(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </BlurView>
      </View>

      {/* Content */}
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
          }
        )}
        scrollEventThrottle={16}
      >
        {isLoading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#FFFFFF"
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
              color="rgba(255,255,255,0.5)"
            />
            <Text style={styles.emptyText}>{t("noData")}</Text>
          </View>
        )}
      </Animated.ScrollView>
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
      <View style={styles.infoIconWrapper}>
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
}: {
  label: string;
  value: number | null;
  isDark: boolean;
  highlighted?: boolean;
}) => (
  <View style={[styles.scoreItem, highlighted && styles.scoreItemHighlighted]}>
    <Text
      style={[styles.scoreLabel, { color: isDark ? "#9CA3AF" : "#6B7280" }]}
    >
      {label}
    </Text>
    <Text
      style={[
        styles.scoreValue,
        { color: highlighted ? "#667eea" : isDark ? "#FFF" : "#1F2937" },
        highlighted && styles.scoreValueHighlighted,
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  settingsButton: {
    position: "absolute",
    right: 20,
    bottom: 12,
  },
  tabSelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabBlur: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
  },
  activeTab: {},
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
  },
  contentContainer: {
    gap: 16,
  },
  profileCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  profileHeader: {
    padding: 30,
    alignItems: "center",
  },
  avatarWrapper: {
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "800",
    color: "#667eea",
  },
  studentName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  idBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  studentId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  infoSection: {
    padding: 20,
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
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
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  gradeCard: {
    borderRadius: 20,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
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
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 22,
  },
  gradeMeta: {
    fontSize: 12,
    fontWeight: "500",
  },
  gradeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 50,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  gradeBadgeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  gradeScores: {
    flexDirection: "row",
    gap: 8,
  },
  scoreItem: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  scoreItemHighlighted: {
    backgroundColor: "rgba(102, 126, 234, 0.15)",
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  scoreValueHighlighted: {
    fontSize: 20,
  },
  semesterCard: {
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  semesterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  semesterTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  semesterSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(102, 126, 234, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#667eea",
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "800",
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  coursesList: {
    gap: 10,
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
    fontWeight: "800",
    minWidth: 30,
    textAlign: "right",
  },
  moreText: {
    fontSize: 12,
    fontWeight: "600",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 16,
  },
});
