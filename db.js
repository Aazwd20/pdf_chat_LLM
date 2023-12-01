const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017"; // Update with your MongoDB connection string
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("chatDatabase"); // Use or create a database named "chatDatabase"
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

module.exports = connectToMongoDB;
