require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth-routes/index");
const mediaRoutes = require("./routes/instructor-routes/media-routes");
const instructorCourseRoutes = require("./routes/instructor-routes/course-routes");
const studentViewCourseRoutes = require("./routes/student-routes/course-routes");
const studentViewOrderRoutes = require("./routes/student-routes/order-routes");
const studentCoursesRoutes = require("./routes/student-routes/student-courses-routes");
const studentCourseProgressRoutes = require("./routes/student-routes/course-progress-routes");
const notesRoutes = require("./routes/student-routes/notes-routes");
const chatbotRoutes = require("./routes/chatbot-routes");
const { initializeSearchService } = require('./services/search-service');
const webhookRoutes = require("./routes/webhook-routes");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const clientUrl=process.env.CLIENT_URL;

// Removed: Import WebSocket library
// const WebSocket = require('ws');


app.use(
  cors({
    //origin: "https://e-siksha-co.onrender.com",
    origin: clientUrl,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

app.use(express.json());

//database connection
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("mongodb is connected");
    try {
      await initializeSearchService();
      console.log('Search service initialized');
    } catch (error) {
      console.error('Failed to initialize search service:', error);
    }
  })
  .catch((e) => console.log(e));

//routes configuration
app.use("/auth", authRoutes);
app.use("/media", mediaRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/instructor/course", instructorCourseRoutes);
app.use("/student/course", studentViewCourseRoutes);
app.use("/student/order", studentViewOrderRoutes);
app.use("/student/courses-bought", studentCoursesRoutes);
app.use("/student/course-progress", studentCourseProgressRoutes);
app.use("/student/notes", notesRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});

// Modified: Start the server without WebSocket server
app.listen(PORT, () => {
  console.log(`Server is now running on port ${PORT}`);
});

// Removed: WebSocket server instance and connection handling
// const wss = new WebSocket.Server({ server: app.listen(PORT, () => {
//   console.log(`Server is now running on port ${PORT}`);
// }) });

// Removed: Handle incoming WebSocket connections
// wss.on('connection', (ws) => {
//   console.log('Client connected to WebSocket');
//
//   // Establish connection to AssemblyAI
//   const assembly = new WebSocket(
//     `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000`,
//     {
//       headers: {
//         Authorization: process.env.ASSEMBLYAI_API_KEY, // Use AssemblyAI API key from .env
//       },
//     }
//   );
//
//   // Handle messages from the client (audio data)
//   ws.on('message', (message) => {
//     // Relay audio data to AssemblyAI
//     if (assembly.readyState === WebSocket.OPEN) {
//       assembly.send(message);
//     }
//   });
//
//   // Handle messages from AssemblyAI (transcription)
//   assembly.on('message', (message) => {
//     const res = JSON.parse(message);
//     // Send transcription back to the client
//     ws.send(JSON.stringify(res));
//   });
//
//   // Handle AssemblyAI connection errors
//   assembly.on('error', (error) => {
//     console.error('AssemblyAI WebSocket error:', error);
//     ws.send(JSON.stringify({ error: error.message })); // Send error to client
//     ws.close();
//   });
//
//   // Handle client connection closure
//   ws.on('close', () => {
//     console.log('Client disconnected from WebSocket');
//     if (assembly.readyState === WebSocket.OPEN) {
//       assembly.close(); // Close AssemblyAI connection
//     }
//   });
//
//   // Handle AssemblyAI connection closure
//   assembly.on('close', () => {
//     console.log('AssemblyAI WebSocket disconnected');
//     // ws.close(); // Consider if you want to close client connection here
//   });
// });

// Serve static files from the React app
// app.use(express.static(path.join(__dirname, '../client/build')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/build/index.html'));
// });
