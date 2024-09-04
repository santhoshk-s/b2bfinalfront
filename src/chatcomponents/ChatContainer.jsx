import { useState, useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import axios from "axios";
import { recieveMessageRoute, sendMessageRoute } from "../chatutils/APIRoutes";
import { v4 as uuidv4 } from "uuid";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../chatredux/actions";

export default function ChatContainer({
  currentChat,
  isLoaded,
  currentUser,
  socket,
}) {
  const dispatch = useDispatch();
  const [messages, setMessages] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const scrollRef = useRef();

  const handleSendMsg = async (msg, isFile) => {
    if (isFile) {
      await axios.post(
        "http://localhost:5000/upload",
        {
          message: msg,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } else {
      await axios.post(sendMessageRoute, {
        from: currentUser._id,
        to: currentChat._id,
        message: msg,
      });
      socket.current.emit("send-msg", {
        to: currentChat._id,
        from: currentUser._id,
        message: msg,
      });
      const msgs = [...messages];
      msgs.push({ fromSelf: true, message: msg });
      setMessages(msgs);
    }
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieve", (msg, userData) => {
        dispatch(setUserData(userData));
        setArrivalMessage({ fromSelf: false, message: msg });
      });
    }
  }, []);

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (currentChat) {
      const fetchData = async () => {
        const response = await axios.post(recieveMessageRoute, {
          from: currentUser._id,
          to: currentChat._id,
        });
        setMessages(response.data);
      };
      fetchData();

      // Set up interval to fetch data every 2 seconds
      // const intervalId = setInterval(() => {
        fetchData();
      // }, 2000); // 2 seconds interval

      // Cleanup function to clear the interval when the component unmounts or if currentChat changes
      // return () => clearInterval(intervalId);
    
    }
  }, [currentChat]);

  return (

    <div className="border rounded-lg overflow-hidden shadow-lg">
      <div className="relative top-0 z-[-50] border-b border-gray-300 bg-white py-4 px-6 text-center text-sm text-gray-800 shadow-md">
        <h4 className="inline-block py-1 text-left text-lg font-sans font-semibold normal-case">
          {currentChat ? currentChat.username : "User"}
        </h4>
      </div>

      <div className="flex flex-col h-[80vh] bg-white">
        <div className="flex-grow px-4 py-4 sm:px-8 sm:py-8 overflow-y-auto ">
          <div className="chat-messages flex flex-col gap-3">
            {messages.map((message) => (
              <div
                ref={scrollRef}
                key={uuidv4()}
                className={`flex ${
                  message.fromSelf ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`content max-w-[80%] p-3 text-base  rounded-lg overflow-wrap break-words ${
                    message.fromSelf ? "bg-[#1D4ED8] text-white rounded-[16px] rounded-tr-none " : "bg-[#E5E7EB] text-gray-800 rounded-[16px] rounded-tl-none"
                  }`}
                >
                  <p>{message.message}</p>
                </div>
              </div>
            ))}
          </div>
          <ChatInput handleSendMsg={handleSendMsg} />
        </div>

        {/* <div className="flex items-center border-t border-gray-300 bg-white p-2 sm:p-4">
          {/* <textarea
          cols={1}
          rows={1}
          placeholder="Your Message"
          className="mr-2 flex-1 resize-none whitespace-pre-wrap rounded-md bg-gray-100 text-sm py-2 px-3 text-gray-600 shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          className="h-10 px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-medium shadow-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button> 
        </div> */}
      </div>
    </div>
  );
}
