import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
} from "react";

interface ChatInputContextType {
  inputText: string;
  setInputText: (text: string) => void;
  sendMessage: () => void;
  setSendHandler: (handler: (message: string) => void) => void;
}

const ChatInputContext = createContext<ChatInputContextType | undefined>(
  undefined
);

export function ChatInputProvider({ children }: { children: ReactNode }) {
  const [inputText, setInputText] = useState("");
  const sendHandlerRef = useRef<((message: string) => void) | null>(null);

  const sendMessage = () => {
    if (inputText.trim() && sendHandlerRef.current) {
      sendHandlerRef.current(inputText.trim());
      setInputText("");
    }
  };

  const setSendHandler = (handler: (message: string) => void) => {
    sendHandlerRef.current = handler;
  };

  return (
    <ChatInputContext.Provider
      value={{
        inputText,
        setInputText,
        sendMessage,
        setSendHandler,
      }}
    >
      {children}
    </ChatInputContext.Provider>
  );
}

export function useChatInput() {
  const context = useContext(ChatInputContext);
  if (!context) {
    throw new Error("useChatInput must be used within ChatInputProvider");
  }
  return context;
}

export function useSetChatSendHandler(handler: (message: string) => void) {
  const context = useContext(ChatInputContext);
  React.useEffect(() => {
    if (context) {
      context.setSendHandler(handler);
    }
    return () => {
      if (context) {
        context.setSendHandler(() => {});
      }
    };
  }, [handler, context]);
}
