# Pulse-Chat
A full-stack real-time chat application built with React Native, Node.js, Express.js, MongoDB, and Socket.IO. It enables instant messaging, group chats, image and document sharing, voice messages, message reactions, typing indicators, read receipts, authentication, and modern chat features. 

# Real-Time Chat Application 💬

A full-stack real-time messaging application built using **React Native, Node.js, Express.js, MongoDB, and Socket.IO**. The application provides instant communication with support for direct messaging, group chats, multimedia sharing, voice messages, and modern messaging features.

---

## 🚀 Features

### Authentication

* User registration and login
* Secure authentication using JWT
* User profile management

### Real-Time Messaging

* One-to-one private chats
* Group conversations
* Instant message delivery using Socket.IO
* Typing indicators
* Online/offline status
* Message sent, delivered, and read status

### Media Sharing

* Send images from gallery
* Capture and send camera photos
* Share documents and files
* Voice message recording and playback
* Secure file upload handling

### Advanced Chat Features

* Reply to messages
* Message reactions
* Delete messages
* Forward messages
* Message search
* Dark/light theme support

### AI Features (Future Enhancement)

* AI chat summaries
* Smart reply suggestions
* Language translation
* Intelligent conversation analysis

---

# 🛠️ Technologies Used

## Frontend

* React Native
* Expo
* JavaScript
* React Hooks
* Context API

## Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication
* Multer File Upload

## Database

* MongoDB
* Mongoose ODM

---

# 📂 Project Structure

```
RealTime-Chat-App

├── backend
│   ├── routes
│   ├── models
│   ├── middleware
│   ├── uploads
│   ├── server.js
│   └── package.json
│
└── mobile-app
    ├── components
    ├── screens
    ├── context
    ├── api
    ├── socket.js
    └── package.json
```

---

# ⚙️ Installation and Setup

## 1. Clone Repository

```bash
git clone https://github.com/your-username/RealTime-Chat-App.git
```

Move into project:

```bash
cd RealTime-Chat-App
```

---

# Backend Setup

Navigate to backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create `.env` file:

```
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
```

Start backend server:

```bash
npm start
```

Backend will run on:

```
http://localhost:5000
```

---

# Mobile App Setup

Open another terminal:

```bash
cd mobile-app
```

Install dependencies:

```bash
npm install
```

Update API URL:

Open:

```
mobile-app/config.js
```

Change:

```javascript
export const API_URL="http://YOUR_IP_ADDRESS:5000";
```

Example:

```javascript
export const API_URL="http://192.168.1.10:5000";
```

Start Expo:

```bash
npx expo start
```

Scan the QR code using **Expo Go** application.

---

# 📡 Socket Communication

The application uses Socket.IO for real-time communication.

Features handled by sockets:

* Instant message delivery
* Group messaging
* Typing status
* Message reactions
* Message deletion events

---

# 📁 File Upload Configuration

Uploaded files are stored inside:

```
backend/uploads
```

Express serves files using:

```javascript
app.use("/uploads", express.static("uploads"));
```

---

# 🔐 Security Features

* JWT-based authentication
* Protected API routes
* User authorization checks
* Secure file upload limits
* MongoDB validation

---

# 🌱 Future Improvements

* End-to-end encryption
* AI conversation assistant
* Cloud storage integration
* Video calling
* Push notifications
* Advanced privacy settings

---

# 👨‍💻 Author

Developed as a full-stack real-time communication platform project.

---

# ⭐ Contribution

Contributions are welcome!

Steps:

1. Fork this repository
2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push changes

```bash
git push origin feature-name
```

5. Create a Pull Request

---

# 📜 License

This project is open-source and available under the MIT License.
