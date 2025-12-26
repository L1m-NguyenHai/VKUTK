export interface CommandParam {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "tristate" | "file";
  required?: boolean;
  options?: { label: string; value: string }[] | string[];
  placeholder?: string;
}

export interface SlashCommand {
  command: string;
  description: string;
  pluginId: string;
  params?: CommandParam[];
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: "/documents",
    description: "Xem tài liệu của trường",
    pluginId: "documents",
    params: [
      {
        name: "message",
        label: "Nội dung tìm kiếm",
        type: "text",
        required: true,
        placeholder: "Nhập tên tài liệu hoặc nội dung cần tìm...",
      },
    ],
  },
  {
    command: "/scores",
    description: "Xem điểm số cá nhân",
    pluginId: "score",
    params: [
      {
        name: "message",
        label: "Câu hỏi về điểm số",
        type: "text",
        required: true,
        placeholder: "Ví dụ: Điểm môn Toán của tôi là bao nhiêu?",
      },
    ],
  },
  {
    command: "/summary",
    description: "Tóm tắt nội dung",
    pluginId: "summary",
    params: [
      {
        name: "message",
        label: "Yêu cầu tóm tắt",
        type: "text",
        required: true,
        placeholder: "Nhập yêu cầu tóm tắt...",
      },
      // Note: File upload is required by backend but not yet supported in mobile UI
    ],
  },
  {
    command: "/timetable",
    description: "Xem thời khóa biểu",
    pluginId: "timetable",
    params: [
      {
        name: "semester",
        label: "Học kỳ",
        type: "select",
        required: true,
        options: [
          { label: "Học kỳ 1", value: "1" },
          { label: "Học kỳ 2", value: "2" },
          { label: "Học kỳ 3", value: "3" },
          { label: "Học kỳ 4", value: "4" },
          { label: "Học kỳ 5", value: "5" },
          { label: "Học kỳ 6", value: "6" },
          { label: "Học kỳ 7", value: "7" },
          { label: "Học kỳ 8", value: "8" },
          { label: "Học kỳ 9", value: "9" },
        ],
      },
      {
        name: "prefer_time",
        label: "Ưu tiên buổi",
        type: "select",
        required: false,
        options: [
          { label: "Sáng", value: "Sáng" },
          { label: "Chiều", value: "Chiều" },
        ],
      },
      {
        name: "day_preferences",
        label: "Ưu tiên / Né thứ",
        type: "tristate",
        required: false,
        placeholder: "Bấm 1 lần: Ưu tiên | 2 lần: Né | 3 lần: Huỷ",
        options: [
          "Thứ 2",
          "Thứ 3",
          "Thứ 4",
          "Thứ 5",
          "Thứ 6",
          "Thứ 7",
          "Chủ nhật",
        ],
      },
      {
        name: "prefer_lecturer",
        label: "Ưu tiên giáo viên",
        type: "text",
        required: false,
        placeholder: "Nhập tên giáo viên...",
      },
    ],
  },
  {
    command: "/questions",
    description: "Tạo câu hỏi ôn tập",
    pluginId: "questions",
    params: [
      {
        name: "file",
        label: "Tải lên file PDF",
        type: "file",
        required: true,
        placeholder: "Chọn file PDF...",
      },
      {
        name: "num_questions",
        label: "Số lượng câu hỏi",
        type: "number",
        required: true,
        placeholder: "10",
      },
      {
        name: "question_relevance",
        label: "Độ liên quan",
        type: "select",
        required: true,
        options: [
          { label: "Rất cao", value: "Very High" },
          { label: "Cao", value: "High" },
          { label: "Trung bình", value: "Medium" },
          { label: "Thấp", value: "Low" },
        ],
      },
      {
        name: "num_open_questions",
        label: "Số câu hỏi mở",
        type: "number",
        required: true,
        placeholder: "3",
      },
      {
        name: "difficulty_level",
        label: "Độ khó",
        type: "select",
        required: true,
        options: [
          { label: "Dễ", value: "Easy" },
          { label: "Trung bình", value: "Medium" },
          { label: "Khó", value: "Hard" },
          { label: "Rất khó", value: "Very Hard" },
        ],
      },
      // Note: File upload is required by backend
    ],
  },
  {
    command: "/research",
    description: "Nghiên cứu thông tin",
    pluginId: "research",
    params: [
      {
        name: "topic",
        label: "Chủ đề nghiên cứu",
        type: "text",
        required: true,
        placeholder: "Nhập chủ đề...",
      },
    ],
  },
  {
    command: "/sto",
    description: "Hỏi đáp lập trình (StackOverflow)",
    pluginId: "stackoverflow",
    params: [
      {
        name: "message",
        label: "Câu hỏi",
        type: "text",
        required: true,
        placeholder: "Nhập lỗi hoặc vấn đề...",
      },
    ],
  },
  {
    command: "/nlp",
    description: "Xử lý ngôn ngữ tự nhiên",
    pluginId: "chatnlp",
    params: [
      {
        name: "text",
        label: "Văn bản",
        type: "text",
        required: true,
        placeholder: "Nhập văn bản cần xử lý...",
      },
    ],
  },
  {
    command: "/topcv",
    description: "Tìm việc làm từ CV",
    pluginId: "topcv",
    params: [
      {
        name: "file",
        label: "Tải lên CV (PDF/Ảnh)",
        type: "file",
        required: true,
      },
    ],
  },
];
