interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
  isDarkMode?: boolean;
}

export function ToggleSwitch({
  enabled,
  onChange,
  isDarkMode = false,
}: ToggleSwitchProps) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full relative transition-colors ${
        enabled ? "bg-blue-500" : isDarkMode ? "bg-gray-700" : "bg-gray-200"
      }`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
          enabled ? "right-0.5" : "left-0.5"
        }`}
      ></div>
    </button>
  );
}
