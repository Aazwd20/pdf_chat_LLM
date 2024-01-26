import logo from "./logo.svg";
import "./normal.css";
import "./App.css";
import { useState } from "react";
import { useEffect, useRef } from "react";

function App() {
  const chatInterfaceRef = useRef();
  const [input, setInput] = useState("");
  const [chatLog, setChatLog] = useState([
    // {
    //   user: "gpt",
    //   message: "how can i help you today?",
    // },
    // {
    //   user: "me",
    //   message: "how",
    // },
  ]);
  const [chatName, setChatName] = useState(""); // New state for chat name

  useEffect(() => {
    // Scroll to the bottom of the chat interface when it updates
    if (chatInterfaceRef.current) {
      chatInterfaceRef.current.scrollTop =
        chatInterfaceRef.current.scrollHeight;
    }
  }, [chatLog]);

  //new chat and old chat clear,
  function clearChat() {
    setChatLog([]);
  }
  async function submitHandler(e) {
    e.preventDefault();
    let chatLogNew = [...chatLog, { user: "me", message: `${input}` }];
    setInput("");
    setChatLog(chatLogNew);
    const messages = chatLogNew.map((message) => message.message).join("");
    try {
      const response = await fetch("http://localhost:3080/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: "001",
          chat_name: chatName,
          question: { user: "user_name", message: messages },
          // answer: "",
          // summary: "summary of the current chat uptill now.",
        }),
      });

      const data = await response.json();
      setChatLog([...chatLogNew, { user: "gpt", message: `${data.message}` }]);
      // console.log(data.message);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  return (
    <div className="App">
      <aside className="sidemenu">
        <div className="side-menue-button" onClick={clearChat}>
          <span>+</span>
          New Chat
        </div>
        {/* Input for changing chat name */}
        <input
          type="text"
          value={chatName}
          onChange={(e) => setChatName(e.target.value)}
          placeholder="Enter Chat Name"
        />
      </aside>
      <section className="chatbox">
        <div ref={chatInterfaceRef} className="chat-interface">
          {/* <div className="chat-background"> */}
          {/* <div className="chat-message">
              <div className="user-image"></div>
              <div className="message">
                Hello dfsdfasdfasdffdmbsfs dajhbfjhsdcv d f g zxvdzfSZCZXVdc
                zxVdsvgfsdhkf hjsdgfdfsdfasdfs dfgad shfjksdgfgscsd
              </div>
            </div>
          </div> */}
          {chatLog.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          {/* <div className="chat-background-chatgpt">
            <div className="chat-message">
              <div className="ai-image"></div>
              <div className="message">I am an AI</div>
            </div>
          </div> */}
        </div>
        <div className="chat-input-holder">
          <form onSubmit={submitHandler}>
            <input
              row="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="chat-input-textarea"
              placeholder="Ask Studysage here"
            ></input>
          </form>
        </div>
      </section>
    </div>
  );
}

const ChatMessage = ({ message }) => {
  return (
    <div className={`chat-background ${message.user === "gpt" && "-chatgpt"}`}>
      <div className="chat-message">
        <div
          className={`user-image ${message.user === "gpt" && "-chatgpt"}`}
        ></div>
        {/* ${message.user == "gpt"&& "chatgpt"} */}
        <div className="message">{message.message}</div>
      </div>
    </div>
  );
};

export default App;
