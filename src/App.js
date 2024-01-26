// Import necessary React components and CSS
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [isPdfUploaderVisible, setIsPdfUploaderVisible] = useState(true);
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [file, setFile] = useState(null);
  const [chatName, setchatName] = useState(null);
  const [pdfAnswer, setpdfAnswer] = useState(null);
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [directories, setDirectories] = useState([]);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom of the chat box when the chat history changes
    chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    get_directories();
  }, [chatHistory]);

  const togglePdfUploader = () => {
    setIsPdfUploaderVisible(!isPdfUploaderVisible);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (
          typeof e.target.result === "string" &&
          e.target.result.startsWith("data:application/pdf")
        ) {
          setUploadedPdf(e.target.result);
        } else {
          console.error("Invalid PDF file");
        }
      };

      reader.readAsDataURL(selectedFile);
    }
  };

  async function querypdf(chatName, question) {
    try {
      setInput(question);
      console.log("chat name:", chatName);

      // Push user's question to chat history immediately
      const newChatHistory = [...chatHistory, { type: "user", text: question }];
      setChatHistory(newChatHistory);

      // Send the request to the server
      const response = await fetch(
        `http://localhost:8000/chats/${encodeURIComponent(
          chatName
        )}/${encodeURIComponent(question)}`
      );

      const data = await response.json();
      console.log("response from server: ", data.chats);

      if (data.success) {
        // Update the chat history with the server response
        const updatedChatHistory = [
          ...newChatHistory,
          { type: "pdfAnswer", text: data.chats },
        ];
        setChatHistory(updatedChatHistory);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  async function get_directories() {
    try {
      const response = await fetch("http://localhost:8000/directories");
      const data = await response.json();

      if (data.success) {
        const directories = data.directories;
        console.log("Directories:", directories);
        setDirectories(directories); // Update state with directories
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }

  const handleFileUpload = async () => {
    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await axios.post(
        "http://localhost:8000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setchatName(response.data.chats);
      }
    } catch (error) {
      console.error("Error uploading file:", error.message);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];

    setFile(droppedFile);

    if (droppedFile) {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (
          typeof e.target.result === "string" &&
          e.target.result.startsWith("data:application/pdf")
        ) {
          setUploadedPdf(e.target.result);
        } else {
          console.error("Invalid PDF file");
        }
      };

      reader.readAsDataURL(droppedFile);
    }
  };

  return (
    <div
      className="app-container"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div
        className={`pdf-uploader ${
          isPdfUploaderVisible ? "visible" : "hidden"
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          //style={{ display: "none" }}
        />
        <div
          className="dropbox"
          onClick={() => {
            document.querySelector('input[type="file"]').click();
          }}
        >
          <p>Drag & Drop PDF or click here to upload</p>
        </div>
        {uploadedPdf && (
          <div>
            <p>Uploaded PDF:</p>
            <embed
              src={uploadedPdf}
              type="application/pdf"
              width="100%"
              height="600px"
            />
          </div>
        )}
        <button onClick={handleFileUpload}>Upload PDF</button>
      </div>
      <div className="chat-container">
        <div className="side-menu">
          <button
            className="toggle-pdf-uploader-btn"
            onClick={togglePdfUploader}
          >
            {isPdfUploaderVisible ? "Hide PDF Uploader" : "Show PDF Uploader"}
          </button>
          {chatName && (
            <button onClick={() => setchatName(chatName)}>{chatName}</button>
          )}
          {/* <button onClick={get_directories}> Courses </button> */}
          <button onClick={get_directories}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          {/* Render buttons dynamically based on directories */}
          {directories.map((dir, index) => (
            <button key={index} onClick={() => setchatName(`./courses/${dir}`)}>
              {dir}
            </button>
          ))}
        </div>

        <div
          className={`chat-box ${
            isPdfUploaderVisible ? "with-pdf-uploader" : "without-pdf-uploader"
          }`}
        >
          <div className="chat-area" ref={chatBoxRef}>
            {chatHistory.map((chat, index) => (
              <div key={index} className={chat.type}>
                {chat.text}
              </div>
            ))}
          </div>
          <div className="chat-input-holder">
            <input
              row="1"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="chat-input-textarea"
              placeholder="Query pdf here"
            />
            <button
              className="chat-input-submit"
              onClick={(e) => {
                e.preventDefault();
                querypdf(chatName, question);
                setQuestion(""); // Clear the input field after submission
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
