// Import necessary React components and CSS
import React, { useState } from "react";
import "./App.css";

function App() {
  const [isPdfUploaderVisible, setIsPdfUploaderVisible] = useState(true);
  const [uploadedPdf, setUploadedPdf] = useState(null);

  const togglePdfUploader = () => {
    setIsPdfUploaderVisible(!isPdfUploaderVisible);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        // Ensure the result is a valid data URL
        if (
          typeof e.target.result === "string" &&
          e.target.result.startsWith("data:application/pdf")
        ) {
          setUploadedPdf(e.target.result);
        } else {
          console.error("Invalid PDF file");
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const fileSubmissionHandler = () => {
    if (uploadedPdf) {
      const uploadPdf = async () => {
        try {
          const formData = new FormData();
          formData.append("pdfData", uploadedPdf);

          const response = await fetch("http://localhost:3070/upload", {
            method: "POST",
            body: formData,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Server response:", data);

          // Reset the state or perform other actions as needed
          setUploadedPdf(null);
        } catch (error) {
          console.error("Error uploading PDF:", error.message);
        }
      };

      uploadPdf();
    }
  };

  return (
    <div className="app-container">
      <div
        className={`pdf-uploader ${
          isPdfUploaderVisible ? "visible" : "hidden"
        }`}
      >
        {/* PDF Upload Section */}
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        {/* Add other PDF upload elements as needed */}
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
        <button onClick={fileSubmissionHandler}>Upload PDF</button>
      </div>

      <div className="chat-container">
        {/* Button to toggle PDF uploader */}

        {/* Chat Name/Type Side Menu */}
        <div className="side-menu">
          <button
            className="toggle-pdf-uploader-btn"
            onClick={togglePdfUploader}
          >
            {isPdfUploaderVisible ? "Hide PDF Uploader" : "Show PDF Uploader"}
          </button>
          {/* Add chat name/type elements */}
        </div>

        {/* Chat Box and Input Field */}
        <div
          className={`chat-box ${
            isPdfUploaderVisible ? "with-pdf-uploader" : "without-pdf-uploader"
          }`}
        >
          {/* Add chat messages and input field */}
        </div>
      </div>
    </div>
  );
}

export default App;
