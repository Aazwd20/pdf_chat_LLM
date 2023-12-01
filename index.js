const OpenAI = require("openai");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const openai = new OpenAI({
  apiKey: "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",
});

const app = express();
// Use bodyParser for parsing JSON in the request body
app.use(bodyParser.json());

// Enable CORS for all routes
// Define the CORS options for specific routes if needed
// app.options("/path", cors());
app.use(
  cors({
    origin: "http://localhost:3000", // Update this to match your client's origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

const port = 3080;

app.post("/", async (req, res) => {
  const { message } = req.body;
  console.log(message);

  // Perform OpenAI API request here
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: `${message}` }],
    // message: `${message}`,
    max_tokens: 200,
    temperature: 0.5,
  });

  // Respond with the data or the result from the OpenAI API
  res.json({
    message: chatCompletion.choices[0].message.content,
    // data: message,
  });
});

app.listen(port, () => {
  console.log(`example app listening at http://localhost:${port}`);
});
