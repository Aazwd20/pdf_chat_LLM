import logo from "./logo.svg";
import "./normal.css";
import "./App.css";
import { useState, useEffect, useRef } from "react";

function App() {
  const chatInterfaceRef = useRef();
  const [input, setInput] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [chatName, setChatName] = useState("");
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    fetchChats();
  }, []);

  async function fetchChats() {
    try {
      const response = await fetch(`http://localhost:3080/chats/001`);
      const data = await response.json();
      console.log("Chats from server:", data);

      if (data.success) {
        setChats(data.chats);
      } else {
        console.error("Error fetching chats:", data.message);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  }

  async function loadChatByChatName(chatName) {
    try {
      const response = await fetch(
        `http://localhost:3080/chats/001/${encodeURIComponent(chatName)}`
      );
      const data = await response.json();
      console.info("loaded chat:", data);

      if (data.success && data.chats.length > 0) {
        const selectedChat = data.chats[0];
        setSelectedChat(selectedChat);

        // Log the structure of selected chat
        console.log("selectedChat:", selectedChat);

        // Extract and flatten all conversations
        const allConversations = Object.entries(selectedChat)
          .filter(([key, value]) => key.startsWith("conversation"))
          .flatMap(([key, value]) => value);

        // Log the structure of all conversations
        console.log("allConversations:", allConversations);

        // Set the chat log with all conversations
        setChatLog(allConversations);

        // Update the chatName state when a chat is loaded
        setChatName(chatName || selectedChat.chat_name); // Use selectedChat.chat_name as default
      } else {
        console.error("Error loading previous chats:", data.message);
      }
    } catch (error) {
      console.error("Error loading previous chats:", error);
    }
  }

  useEffect(() => {
    // Scroll to the bottom of the chat interface when it updates
    if (chatInterfaceRef.current) {
      chatInterfaceRef.current.scrollTop =
        chatInterfaceRef.current.scrollHeight;
    }
  }, [chatLog]);

  // new chat and old chat clear,
  function clearChat() {
    setSelectedChat(null);
    setChatLog([]);
    setChatName(""); // Clear chat name when starting a new chat
  }

  async function submitHandler(e) {
    e.preventDefault();
    let chatLogNew = [...chatLog, { user: "me", message: `${input}` }];
    setInput("");
    setChatLog(chatLogNew);

    // Send only the latest question to the server
    const latestQuestion = { user: "user_name", message: input };

    try {
      const response = await fetch("http://localhost:3080/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: "001",
          chat_name: chatName || latestQuestion.message, // Use latestQuestion.message as default
          question: latestQuestion,
        }),
      });

      const data = await response.json();
      console.log("Server response:", data);

      const updatedChatLog = [
        ...chatLogNew,
        {
          user: "gpt",
          message: `${data.message.Aianswer.aianswer}`,
          // contex: `${data.message.userContext}`,
          // learnerLinks: `${data.message.learnerLinks}`,
        },
      ];
      console.log("Updated chatLog:", updatedChatLog);

      setChatLog(updatedChatLog);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  return (
    <div className="App">
      <aside className="sidemenu">
        <div className="sidemenu-content">
          <div className="side-menue-button" onClick={clearChat}>
            <span>+</span>
            New Chat
          </div>

          {/* Input for changing chat name */}
          {/* <input
            type="text"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            placeholder="Enter Chat Name"
          /> */}
          <div className="side-menue-chatbutton">
            {/* Display previous chats as buttons */}
            {chats.map((chat) => (
              <button
                key={chat._id}
                className="chat-name"
                onClick={() => loadChatByChatName(chat.chat_name)}
              >
                {chat.chat_name}
              </button>
            ))}
          </div>
        </div>
      </aside>
      <section className="chatbox">
        <div ref={chatInterfaceRef} className="chat-interface">
          {/* Display previous chat messages */}
          {chatLog.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
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

// ...
const ChatMessage = ({ message }) => {
  return (
    <div className={`chat-background ${message.user === "gpt" && "-chatgpt"}`}>
      <div className="chat-message">
        <div
          className={`user-image ${message.user === "gpt" && "-chatgpt"}`}
        ></div>
        <div className="message">
          {message.user === "gpt" && message.message.Aianswer && (
            <>
              <h4>AI Answer:</h4>
              <p>{message.message.Aianswer.aianswer}</p>
            </>
          )}
          {message.user !== "gpt" && message.message}
          {message.message.userContext && (
            <div>
              <hr />
              <h4>Context of Question:</h4>
              <p>{message.message.userContext}</p>
              {message.message.learnerLinks && (
                <>
                  <h4>Learner Links:</h4>
                  <ul>
                    {message.message.learnerLinks.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
