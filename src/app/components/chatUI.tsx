"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Image, Input, Textarea } from "@nextui-org/react";
import { FaRobot } from "react-icons/fa";
import { FaArrowUpLong } from "react-icons/fa6";
import { IoIosClose } from "react-icons/io";
import { AssistantStream } from "openai/lib/AssistantStream";
import Markdown from "react-markdown";
import useGetJson from "@/hooks/useGetJson";

interface ChatMessage {
  role: "user" | "assistant" | "code";
  text: string;
}

const Message = ({ role, text }: { role: string; text: string }) => {
  if (role === "user") {
    return (
      <div className="flex items-center justify-end">
        <Image
          src="/basic_profile.png"
          className="min-w-[30px]"
          width={30}
          height={30}
        />
        <p className="text-sm text-gray-700 bg-blue-100 inline p-2 m-1 rounded-md">
          {text}
        </p>
      </div>
    );
  }

  if (role === "assistant") {
    return (
      <div className="flex items-center justify-start">
        <Image
          src="/chat-bot.webp"
          className="min-w-[30px]"
          width={30}
          height={30}
        />
        <div className="text-sm text-gray-700 bg-gray-100 inline p-2 m-1 rounded-md">
          <Markdown>{text}</Markdown>
        </div>
      </div>
    );
  }

  if (role === "code") {
    return (
      <div className="bg-gray-100 p-4 rounded-md">
        {text.split("\n").map((line, index) => (
          <div key={index}>
            <span className="text-gray-500">{`${index + 1}. `}</span>
            {line}
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default function ChatUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "안녕하세요! 무엇을 도와드릴까요?",
    },
    {
      role: "assistant",
      text: "저는 챗봇입니다. 무엇이든 물어보세요!",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [inputDisabled, setInputDisabled] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [files, setFiles] = useState([]);
  const [threadId, setThreadId] = useState("");
  const currentMessageTextRef = useRef("");
  const { data: json, isLoading: jsonIsLoading, isSuccess } = useGetJson();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isOpen) return;
    scrollToBottom();
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const createThread = async () => {
      const res = await fetch(`/api/assistants/threads`, {
        method: "POST",
      });
      const data = await res.json();
      setThreadId(data.threadId);
    };
    createThread();
  }, []);

  useEffect(() => {
    if (isSuccess) {
      setFiles(json);
    }
  }, [json]);

  // 파일 업로드
  const fileUpload = async () => {
    const data = new FormData();
    if (files.length < 0) return;
    data.append("file", JSON.stringify(files[0]));
    console.log(data);
    await fetch("/api/assistants/files", {
      method: "POST",
      body: data,
    });
  };

  // // 파일 목록 가져오기
  // const fetchFiles = async () => {
  //   const resp = await fetch("/api/assistants/files", {
  //     method: "GET",
  //   });
  //   const data = await resp.json();
  //   setFiles(data);
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputDisabled(true);
    setLoadingMessage(true);
    if (!userInput.trim() || !threadId) return;
    currentMessageTextRef.current = "";
    setMessages((prev) => [...prev, { role: "user", text: userInput }]);

    const response = await fetch(
      `/api/assistants/threads/${threadId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content: userInput,
          jsonData: files,
        }),
      }
    );
    const stream = AssistantStream.fromReadableStream(response.body);
    handleStream(stream);
  };

  const handleStream = (stream: AssistantStream) => {
    // 텍스트 응답을 시작할 때 발생
    stream.on("textCreated", () => {
      setMessages((prev) => [...prev, { role: "assistant", text: "" }]);
    });

    // 응답 텍스트를 생성하는 동안 계속해서 발생
    stream.on("textDelta", (delta) => {
      if (delta.value != null) {
        setLoadingMessage(false);
        currentMessageTextRef.current += delta.value;
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          lastMessage.text = currentMessageTextRef.current;
          return newMessages;
        });
      }
    });

    // 코드 실행이나 도구 사용을 시작할 때 발생(예: 데이터 분석, 계산, 차트 생성)
    stream.on("toolCallCreated", (toolCall) => {
      if (toolCall.type === "code_interpreter") {
        setMessages((prev) => [...prev, { role: "code", text: "" }]);
      }
    });

    // 코드 실행 결과나 도구 사용의 진행 상황이 전달될 때 발생
    stream.on("toolCallDelta", (delta, snapshot) => {
      if (delta.type === "code_interpreter" && delta.code_interpreter?.input) {
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (delta.code_interpreter?.input) {
            lastMessage.text += delta.code_interpreter.input;
          }
          return newMessages;
        });
      }
    });

    // 전체 응답이 완료되었을 때 발생
    stream.on("event", (event) => {
      if (event.event === "thread.run.completed") {
        setInputDisabled(false);
      }
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-10">
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg 
          hover:animate-wiggle transition-all duration-300 
          active:scale-95 hover:shadow-xl extra-bold"
        >
          채팅 문의 <FaRobot className="text-xl" />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 animate-slide-up origin-bottom pb-1">
          <div className="p-3 bg-gray-200 flex justify-between items-center rounded-t-lg">
            <h3 className="extra-bold text-gray-600">Chatbot</h3>
            <button onClick={fileUpload}>파일</button>
            <button
              onClick={toggleChat}
              className="text-gray-500 hover:text-gray-900"
            >
              <IoIosClose className="text-3xl" />
            </button>
          </div>

          <div className="w-[450px] max-h-[700px] overflow-y-auto scrollbar-hide">
            <div className="p-1 h-[600px]">
              <div className="space-y-6 mt-3">
                {messages.map((msg, index) => (
                  <Message key={index} role={msg.role} text={msg.text} />
                ))}
                <div ref={messagesEndRef} />
                {loadingMessage && (
                  <div className="flex items-center justify-start">
                    <Image
                      src="/chat-bot.webp"
                      className="min-w-[30px]"
                      width={30}
                      height={30}
                    />
                    <div className="text-sm text-blue-600 bg-gray-100 inline p-2 m-1 rounded-md animate-bounce delay-200 bold">
                      <Markdown>답변을 작성중입니다...</Markdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <form
            className="flex items-center gap-1 w-full mx-auto p-2"
            onSubmit={(data) => {
              setUserInput("");
              handleSubmit(data);
            }}
          >
            <Textarea
              type="text"
              className="flex-1"
              radius="full"
              minRows={1}
              maxRows={5}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="메시지를 입력하세요."
              disabled={inputDisabled}
            />
            <Button
              size="sm"
              color="primary"
              className="h-[40px]"
              radius="full"
              type="submit"
              isLoading={inputDisabled}
              isDisabled={userInput.trim() === ""}
            >
              {!inputDisabled && <FaArrowUpLong className="text-lg" />}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
