const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
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

app.post("/", async (req, res) => {
  const { user_id, chat_name, question } = req.body; //, answer, summary
  console.log(question.message);

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "user", content: `${question.user}: ${question.message}` },
      // Add more messages if needed
    ],
    // message: `${message}`,
    max_tokens: 200,
    temperature: 0.5,
  });

  const aianswer = chatCompletion.choices[0].message.content;

  try {
    const db = client.db("appdb_online");
    const collection = db.collection("aiqus_new");

    // Check if a document with the same user_id and chat_name exists
    const existingChat = await collection.findOne({ user_id, chat_name });

    // Insert a new chat document
    // const result = await collection.insertOne({
    //   user_id,
    //   chat_name,
    //   question: [{ role: `${question.user}`, content: `${question.message}` }], // Initial question array
    //   answer: aianswer,
    //   summary: "blank",
    // });

    if (existingChat) {
      // If exists, find the number of existing conversations
      const conversationCount = Object.keys(existingChat).filter((key) =>
        key.startsWith("conversation")
      ).length;

      // Update the existing document with a new conversation field
      const result = await collection.updateOne(
        { user_id, chat_name },
        {
          $push: {
            [`conversation${conversationCount + 1}`]: [
              {
                role: `${question.user}`,
                content: `${question.message}`,
              },
              { role: "gpt", content: aianswer },
            ],
          },
          $set: {
            summary: "blank", // You might want to update the summary accordingly
          },
        }
      );

      console.log("Chat document updated:", result.modifiedCount);
    } else {
      // If doesn't exist, insert a new document with the first conversation field
      const result = await collection.insertOne({
        user_id,
        chat_name,
        conversation1: [
          {
            role: `${question.user}`,
            content: `${question.message}`,
          },
          { role: "gpt", content: aianswer },
        ],
        summary: "blank",
      });

      console.log("Chat document inserted:", result.insertedId);
    }

    res.json({
      success: true,
      message: aianswer,
    });
  } catch (error) {
    console.error("Error updating/inserting chat document:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

app.get("/chats/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const db = client.db("appdb_online");
    const collection = db.collection("aiqus");

    const chats = await collection.find({ user_id }).toArray();

    res.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
