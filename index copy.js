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

async function generateAILearnerLink(userContext) {
  try {
    const searchEngineAPIKey = "AIzaSyBy7nAwbaQpCN4C_mzG6CyLgKcwsvdKVXw";
    const searchEngineCX = "d437f7034a52b4b5b";
    const searchQuery = encodeURIComponent(userContext);
    const searchEndpoint = `https://www.googleapis.com/customsearch/v1?q=${searchQuery}&key=${searchEngineAPIKey}&cx=${searchEngineCX}`;

    const response = await fetch(searchEndpoint);
    const searchData = await response.json();

    // Extract relevant links from search results
    const relevantLinks = searchData.items.map((item) => item.link);
    console.log(relevantLinks);

    return relevantLinks;
  } catch (error) {
    console.error("Error fetching search results:", error);
    return [];
  }
}

async function generateAIAnswer(user, newQuestion, entireConversation = []) {
  try {
    const userMessage =
      (newQuestion && newQuestion.message) || "Invalid user input";

    console.log("New question:", newQuestion); // Add this line for logging

    // const conversation = [
    //   { role: "system", content: "You are a helpful assistant." },
    //   ...entireConversation.map((conv) => ({
    //     role: conv.user === user ? "user" : "assistant",
    //     content: conv.message,
    //   })),
    //   { role: "user", content: `${user}: ${userMessage}` },
    // ];
    const conversation = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: `${user}: ${userMessage}` },
      ...entireConversation, // Include entire conversation
    ];

    console.log("Conversation:", conversation); // Add this line for logging

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversation,
      max_tokens: 200,
      temperature: 0.5,
    });

    const aianswer = chatCompletion.choices[0].message.content;

    // // Generate AI learner links
    // const learnerLinks = await generateAILearnerLink(aianswer);

    // // Include the links in additionalData
    // const additionalData = {
    //   userContext: userMessage,
    //   learnerLinks,
    // };

    //return { aianswer, additionalData };
    return { aianswer };
  } catch (error) {
    console.error("Error in generateAIAnswer:", error);
    throw error; // Rethrow the error for better debugging
  }
}

// Update the app.post route
app.post("/", async (req, res) => {
  const { user_id, chat_name, question } = req.body;
  console.log("Incoming request:", { user_id, chat_name, question });
  // const { user_id, question } = req.body;
  // console.log("Incoming request:", { user_id, question });
  // const chat_name = question.message;
  // console.log("Chat name:", { chat_name });
  try {
    const db = client.db("appdb_online");
    const collection = db.collection("aiqus_new");

    const existingChat = await collection.findOne({ user_id, chat_name });

    let aianswer = []; // Declare aianswer variable here
    let Aianswer; // Declare aianswer variable here
    let additionalData = []; // Declare additionalData variable here

    if (existingChat) {
      const conversationCount = existingChat.conversations
        ? existingChat.conversations.length
        : 0;

      // Update the MongoDB update to store only the user's question
      Aianswer = await generateAIAnswer(
        question.user,
        question,
        existingChat.conversations
      );

      // Generate AI learner links
      //const learnerLinks = await generateAILearnerLink(question.message);
      const learnerLinks = await generateAILearnerLink(aianswer);

      // Include the links in additionalData
      aianswer = {
        Aianswer,
        userContext: question.message,
        learnerLinks,
      };
      // additionalData = [
      //   {
      //     userContext: question.message,
      //     learnerLinks,
      //   },

      const result = await collection.updateOne(
        { _id: new ObjectId(existingChat._id) },
        {
          $push: {
            conversations: {
              $each: [
                { user: "user_name", message: question.message }, // Store only the user's question
                //{ user: "gpt", message: aianswer, additionalData },
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
      Aianswer = await generateAIAnswer(question.user, question, []);

      // Generate AI learner links for new chat
      const learnerLinks = await generateAILearnerLink(question.message);

      // Include the links in additionalData
      // additionalData = {
      //   // userContext: question.message,
      //   learnerLinks,
      // };
      aianswer = {
        Aianswer,
        userContext: question.message,
        learnerLinks,
      };

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
      //additionalData,
    });

    console.log("Server response sent:", {
      success: true,
      message: aianswer,
      //additionalData,
    });
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
