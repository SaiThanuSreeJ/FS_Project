const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 5000) => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vesto';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`[Database] Connection attempt ${attempt} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`[Database] Retrying connection in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error('[Database] All retry attempts exhausted. Could not connect to MongoDB.');
        // Don't crash immediately in dev/test, but rethrow if needed
        throw error;
      }
    }
  }
};

module.exports = connectDB;
