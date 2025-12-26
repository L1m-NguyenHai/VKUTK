import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "@/contexts/ThemeContext";
import { SlashCommand, CommandParam } from "@/constants/commands";

interface CommandParamModalProps {
  visible: boolean;
  command: SlashCommand | null;
  onClose: () => void;
  onSubmit: (params: Record<string, any>) => void;
}

export function CommandParamModal({
  visible,
  command,
  onClose,
  onSubmit,
}: CommandParamModalProps) {
  const { isDark } = useTheme();
  const [params, setParams] = useState<Record<string, any>>({});

  useEffect(() => {
    if (visible && command) {
      setParams({});
    }
  }, [visible, command]);

  const handleParamChange = (name: string, value: any) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleTristateChange = (paramName: string, option: string) => {
    setParams((prev) => {
      const currentDict = prev[paramName] || {};
      const currentState = currentDict[option];

      let nextState;
      if (!currentState) nextState = "prefer";
      else if (currentState === "prefer") nextState = "avoid";
      else nextState = undefined; // Remove from dict

      const newDict = { ...currentDict };
      if (nextState) {
        newDict[option] = nextState;
      } else {
        delete newDict[option];
      }

      return { ...prev, [paramName]: newDict };
    });
  };

  const handleFilePick = async (paramName: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/png", "image/jpeg"],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        handleParamChange(paramName, {
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
        });
      }
    } catch (err) {
      console.log("Document picker error:", err);
    }
  };

  const handleSubmit = () => {
    if (!command) return;
    onSubmit(params);
    onClose();
  };

  const renderInput = (param: CommandParam) => {
    switch (param.type) {
      case "tristate": {
        const options = param.options as string[];
        return (
          <View style={styles.optionsContainer}>
            {options?.map((option) => {
              const state = params[param.name]?.[option];
              let bgColor = "transparent";
              let borderColor = isDark ? "#4B5563" : "#D1D5DB";
              let textColor = isDark ? "#D1D5DB" : "#374151";

              if (state === "prefer") {
                bgColor = isDark
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(16, 185, 129, 0.1)";
                borderColor = "#10B981";
                textColor = "#10B981";
              } else if (state === "avoid") {
                bgColor = isDark
                  ? "rgba(239, 68, 68, 0.2)"
                  : "rgba(239, 68, 68, 0.1)";
                borderColor = "#EF4444";
                textColor = "#EF4444";
              }

              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    {
                      borderColor: borderColor,
                      backgroundColor: bgColor,
                    },
                  ]}
                  onPress={() => handleTristateChange(param.name, option)}
                >
                  <Text style={[styles.optionText, { color: textColor }]}>
                    {option}
                    {state === "prefer"
                      ? " (+)"
                      : state === "avoid"
                      ? " (-)"
                      : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      }

      case "file":
        return (
          <View>
            <TouchableOpacity
              style={[
                styles.fileButton,
                {
                  backgroundColor: isDark ? "#374151" : "#F3F4F6",
                  borderColor: isDark ? "#4B5563" : "#E5E7EB",
                },
              ]}
              onPress={() => handleFilePick(param.name)}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={24}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text
                style={[
                  styles.fileButtonText,
                  { color: isDark ? "#D1D5DB" : "#374151" },
                ]}
              >
                {params[param.name]
                  ? params[param.name].name
                  : param.placeholder || "Chọn file..."}
              </Text>
            </TouchableOpacity>
            {params[param.name] && (
              <TouchableOpacity
                style={styles.clearFileButton}
                onPress={() => handleParamChange(param.name, null)}
              >
                <Text style={{ color: "#EF4444", fontSize: 12 }}>Xóa file</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case "select":
        return (
          <View style={styles.optionsContainer}>
            {(param.options as { label: string; value: string }[])?.map(
              (option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    params[param.name] === option.value &&
                      styles.optionSelected,
                    {
                      borderColor: isDark ? "#4B5563" : "#D1D5DB",
                      backgroundColor:
                        params[param.name] === option.value
                          ? "#4F46E5"
                          : "transparent",
                    },
                  ]}
                  onPress={() => handleParamChange(param.name, option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          params[param.name] === option.value
                            ? "#FFFFFF"
                            : isDark
                            ? "#D1D5DB"
                            : "#374151",
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        );

      default:
        return (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#374151" : "#F3F4F6",
                color: isDark ? "#FFFFFF" : "#111827",
                borderColor: isDark ? "#4B5563" : "#E5E7EB",
              },
            ]}
            placeholder={param.placeholder}
            placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
            value={params[param.name] || ""}
            onChangeText={(text) => handleParamChange(param.name, text)}
            keyboardType={param.type === "number" ? "numeric" : "default"}
          />
        );
    }
  };

  if (!command) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <BlurView
          intensity={isDark ? 80 : 95}
          tint={isDark ? "dark" : "light"}
          style={[
            styles.content,
            {
              backgroundColor: isDark
                ? "rgba(31, 41, 55, 0.9)"
                : "rgba(255, 255, 255, 0.9)",
              borderColor: isDark ? "#374151" : "#E5E7EB",
            },
          ]}
        >
          <View style={styles.header}>
            <Text
              style={[styles.title, { color: isDark ? "#FFFFFF" : "#111827" }]}
            >
              {command.command}
            </Text>
            <Text
              style={[
                styles.description,
                { color: isDark ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {command.description}
            </Text>
          </View>

          <ScrollView style={styles.form}>
            {command.params?.map((param) => (
              <View key={param.name} style={styles.inputGroup}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#D1D5DB" : "#374151" },
                  ]}
                >
                  {param.label}
                  {param.required && <Text style={styles.required}> *</Text>}
                </Text>
                {renderInput(param)}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Gửi lệnh</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  optionSelected: {
    borderColor: "#4F46E5",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#9CA3AF",
  },
  submitButton: {
    backgroundColor: "#4F46E5",
  },
  cancelButtonText: {
    color: "#9CA3AF",
    fontWeight: "600",
    fontSize: 16,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: "dashed",
    justifyContent: "center",
    gap: 8,
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  clearFileButton: {
    alignSelf: "flex-end",
    marginTop: 4,
    padding: 4,
  },
});
