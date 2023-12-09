const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: "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",
});

const app = express();
const port = 3080;

app.use(bodyParser.json());
app.use(cors());

// MongoDB connection string
const mongoURI =
  "mongodb+srv://asiflzwd:asiflzwd123@cluster0.gpdaa5w.mongodb.net/";
const client = new MongoClient(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToMongoDB();

async function generateAIAnswer(user, newQuestion, entireConversation = []) {
  try {
    const userMessage =
      (newQuestion && newQuestion.message) || "Invalid user input";

    console.log("New question:", newQuestion); // Add this line for logging

    const conversation = [
      { role: "system", content: "You are a helpful assistant." },
      ...entireConversation.map((conv) => ({
        role: conv.user === user ? "user" : "assistant",
        content: conv.message,
      })),
      { role: "user", content: `${user}: ${userMessage}` },
    ];

    console.log("Conversation:", conversation); // Add this line for logging

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversation,
      max_tokens: 200,
      temperature: 0.5,
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("Error in generateAIAnswer:", error);
    throw error; // Rethrow the error for better debugging
  }
}

// Update the app.post route
app.post("/", async (req, res) => {
  const { user_id, chat_name, question } = req.body;
  console.log("Incoming request:", { user_id, chat_name, question });

  let aianswer; // Declare aianswer variable here

  try {
    const db = client.db("appdb_online");
    const collection = db.collection("aiqus_new");

    const existingChat = await collection.findOne({ user_id, chat_name });

    if (existingChat) {
      const conversationCount = existingChat.conversations
        ? existingChat.conversations.length
        : 0;

      aianswer = await generateAIAnswer(
        question.user,
        question,
        existingChat.conversations
      );

      // Update the MongoDB update to store only the user's question
      const result = await collection.updateOne(
        { _id: new ObjectId(existingChat._id) },
        {
          $push: {
            conversations: {
              $each: [
                { user: "user_name", message: question.message }, // Store only the user's question
                { user: "gpt", message: aianswer },
              ],
            },
          },
          $set: {
            summary: "blank",
          },
        }
      );

      console.log("Chat document updated:", result.modifiedCount);
    } else {
      aianswer = await generateAIAnswer([
        { role: "user", content: `${question.user}: ${question.message}` },
      ]);

      const result = await collection.insertOne({
        user_id,
        chat_name,
        conversations: [
          { user: question.user, message: question.message },
          { user: "gpt", message: aianswer },
        ],
        summary: "blank",
      });

      console.log("Chat document inserted:", result.insertedId);
    }

    res.json({
      success: true,
      message: aianswer,
    });

    console.log("Server response sent:", { success: true, message: aianswer });
  } catch (error) {
    console.error("Error updating/inserting chat document:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Internal chats fetch
app.get("/chats/:user_id/:chat_name", async (req, res) => {
  const { user_id, chat_name } = req.params;

  try {
    console.log("Fetching chats for:", user_id, chat_name);

    const db = client.db("appdb_online");
    const collection = db.collection("aiqus_new");

    const chats = await collection.find({ user_id, chat_name }).toArray();

    // Flatten the conversation arrays
    const flattenedChats = chats.map((chat) => {
      const uniqueConversations = new Map();
      chat.conversations.forEach((conv) => {
        uniqueConversations.set(`${conv.user}:${conv.message}`, conv);
      });
      return { ...chat, conversations: [...uniqueConversations.values()] };
    });

    console.log("Chats retrieved:", flattenedChats);

    res.json({
      success: true,
      chats: flattenedChats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// All chat_name 's fetch
app.get("/chats/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    console.log("Fetching chats for user:", user_id);

    const db = client.db("appdb_online");
    const collection = db.collection("aiqus_new");

    const chats = await collection.find({ user_id }).toArray();
    console.log("Chat names fetched:", chats);

    res.json({
      success: true,
      chats: chats.map((chat) => ({ chat_name: chat.chat_name })),
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// app.get("/chats/:user_id", async (req, res) => {
//   const { user_id } = req.params;

//   try {
//     const db = client.db("appdb_online");
//     const collection = db.collection("aiqus");

//     const chats = await collection.find({ user_id }).toArray();

//     res.json({
//       success: true,
//       chats,
//     });
//   } catch (error) {
//     console.error("Error fetching chats:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });
