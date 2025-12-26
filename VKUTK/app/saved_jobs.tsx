import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getSavedJobs, removeJob, SavedJob } from "@/utils/jobStorage";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SavedJobsScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const saved = await getSavedJobs();
    setJobs(saved);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Xóa công việc",
      "Bạn có chắc chắn muốn xóa công việc này khỏi danh sách lưu trữ?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            await removeJob(id);
            loadJobs();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: SavedJob }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
          borderColor: isDark ? "#374151" : "#E5E7EB",
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => Linking.openURL(item.url)}
        >
          <Text
            style={[styles.urlText, { color: isDark ? "#60A5FA" : "#2563EB" }]}
            numberOfLines={1}
          >
            {item.url}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.deleteButton}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={isDark ? "#EF4444" : "#DC2626"}
          />
        </TouchableOpacity>
      </View>

      <Text
        style={[styles.dateText, { color: isDark ? "#9CA3AF" : "#6B7280" }]}
      >
        {new Date(item.timestamp).toLocaleString()}
      </Text>

      <View
        style={[
          styles.summaryContainer,
          { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
        ]}
      >
        <Text
          style={[
            styles.summaryTitle,
            { color: isDark ? "#E5E7EB" : "#1F2937" },
          ]}
        >
          Tóm tắt JD:
        </Text>
        <Text
          style={[
            styles.summaryText,
            { color: isDark ? "#D1D5DB" : "#4B5563" },
          ]}
        >
          {item.summary}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#111827" : "#F9FAFB",
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#FFFFFF" : "#1F2937"}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? "#FFFFFF" : "#1F2937" },
          ]}
        >
          Công việc đã lưu
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="briefcase-outline"
            size={64}
            color={isDark ? "#374151" : "#D1D5DB"}
          />
          <Text
            style={[
              styles.emptyText,
              { color: isDark ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            Chưa có công việc nào được lưu
          </Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  urlText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  dateText: {
    fontSize: 12,
    marginBottom: 12,
  },
  summaryContainer: {
    padding: 12,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
