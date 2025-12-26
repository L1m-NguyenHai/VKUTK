import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SavedJob {
  id: string;
  url: string;
  summary: string;
  timestamp: number;
}

const STORAGE_KEY = "saved_jobs";

export const saveJob = async (job: SavedJob) => {
  try {
    const existingJobs = await getSavedJobs();
    // Check if already saved to avoid duplicates
    const isDuplicate = existingJobs.some((j) => j.url === job.url);
    if (isDuplicate) {
      // Update existing
      const updatedJobs = existingJobs.map((j) =>
        j.url === job.url ? job : j
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
      return;
    }

    const newJobs = [job, ...existingJobs];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newJobs));
  } catch (error) {
    console.error("Error saving job:", error);
  }
};

export const getSavedJobs = async (): Promise<SavedJob[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error("Error reading saved jobs:", error);
    return [];
  }
};

export const removeJob = async (id: string) => {
  try {
    const existingJobs = await getSavedJobs();
    const newJobs = existingJobs.filter((job) => job.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newJobs));
  } catch (error) {
    console.error("Error removing job:", error);
  }
};
