# 🎬 Watch Party

A real-time video watching application where multiple users can join the same room and watch YouTube videos together with synchronized playback.

The application uses **Socket.IO** for real-time communication and role-based permissions to control who can manage the shared video.

## 🚀 Live Application

[Watch Party - Live Application](https://party-in-the-house.vercel.app/)


---

## ✨ Features

- 🔐 User registration and login
- 🎥 Create and join Watch Party rooms
- 👥 Multiple users in the same room
- 👑 Host, Moderator and Participant roles
- 🛡️ Role-based permissions
- ▶️ Synchronized play and pause
- ⏩ Synchronized video seeking
- 🔄 Synchronized YouTube video changes
- 👤 Host can assign roles
- 🚫 Host can remove participants
- 💬 Real-time chat
- 📋 Participant list with roles
- 🔑 JWT-based authentication
- 📱 Responsive interface

---

## 🛠️ Tech Stack

### Frontend

- React
- JavaScript
- Axios
- Socket.IO Client
- YouTube IFrame Player
- CSS

### Backend

- Node.js
- Express.js
- Socket.IO
- JWT
- bcrypt
- Mongoose

### Database

- MongoDB Atlas

### Deployment

- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database

---

## 🏗️ Project Structure

```text
WatchParty/
│
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/
│   │   │   ├── socketController.js
│   │   │   └── user.controller.js
│   │   ├── models/
│   │   └── routes/
│   └── package.json
│
├── frontend/
│   └── my-react-app/
│       ├── src/
│       │   ├── contexts/
│       │   ├── pages/
│       │   ├── styles/
│       │   ├── App.jsx
│       │   └── main.jsx
│       └── package.json
│
├── README.md
└── ARCHITECTURE.md
```

---

## 🎯 How Watch Party Works

A user first creates an account or logs in.

After authentication, the user can create a new room or join an existing room using the room code.

Once inside a room, the frontend establishes a **Socket.IO connection** with the backend.

Users inside the same room receive real-time updates whenever a permitted playback action takes place.

For example:

```text
Host clicks Play
      ↓
React Frontend
      ↓
Socket.IO Event
      ↓
Backend
      ↓
Permission Check
      ↓
Broadcast Event
      ↓
Other Participants
      ↓
Video Plays
```

The same approach is used for:

- Play
- Pause
- Seek
- Change Video

---

## 👑 Roles and Permissions

### Host

The Host has the highest level of control in a room.

The Host can:

- Play and pause the video
- Seek the video
- Change the video
- Assign Moderator or Participant roles
- Remove participants
- Transfer the Host role

### Moderator

The Moderator can control the shared video.

The Moderator can:

- Play and pause the video
- Seek the video
- Change the video

The Moderator cannot assign roles or remove participants.

### Participant

Participants can watch the shared video and use the chat.

Participants cannot directly control:

- Play/Pause
- Seek
- Change Video
- Role assignment
- Participant removal

The backend checks the user's role before processing playback control events.

---

## 🔄 Real-Time Synchronization

Socket.IO is used to keep the video state synchronized between users.

### Play/Pause

When a Host or Moderator plays or pauses the video, an event is sent to the server and broadcast to the other users in the room.

### Seek

When the video position changes, the current time is sent to the server and synchronized with other participants.

### Change Video

When the Host or Moderator changes the YouTube video, the new video ID is sent through Socket.IO and loaded for the other users.

---

## 🔌 Important Socket Events

### Room Events

```text
join_room
leave_room
```

### Playback Events

```text
play
pause
seek
change_video
```

### Participant Management

```text
assign_role
remove_participant
```

### Server Events

```text
user_joined
user_left
role_assigned
participant_removed
```

---

## 🔐 Authentication

JWT is used for user authentication.

During login:

```text
User
 ↓
Login Request
 ↓
Backend
 ↓
User Verification
 ↓
JWT Token
 ↓
Frontend
```

The token is then used for authenticated API requests and Socket.IO authentication.

Passwords are hashed using **bcrypt** before being stored in MongoDB.

---

## 🗄️ Database

MongoDB Atlas is used as the database.

The database is used for storing application information such as:

- User information
- Room information
- Room history

Some real-time room state is maintained by the Socket.IO server while users are connected.

---

## 🌐 API Endpoints

### Authentication

```text
POST /api/users/register
POST /api/users/login
```

### Room APIs

The application also provides APIs for:

- Creating rooms
- Joining rooms
- Getting room information
- Getting room history
- Ending rooms

---

## ⚙️ Running Locally

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_LINK
cd WatchParty
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Create `.env`

Create a `.env` file inside the backend folder:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Do not upload your `.env` file to GitHub.

### 4. Start the backend

```bash
npm start
```

The backend runs locally on:

```text
http://localhost:8080
```

### 5. Install frontend dependencies

Open another terminal:

```bash
cd frontend/my-react-app
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

The frontend will start using the Vite development server.

---

## ☁️ Deployment

The application is publicly deployed using:

**Frontend:** Vercel

[Open Live Application](https://party-in-the-house.vercel.app/)

**Backend:** Render

[Open Backend](https://partyinthehouse.onrender.com/)

**Database:** MongoDB Atlas

---

## 📐 Architecture

A detailed explanation of the application architecture and Socket.IO flow is available in:

[ARCHITECTURE.md](./ARCHITECTURE.md)

The architecture covers:

- Frontend and backend communication
- Authentication flow
- Room flow
- Socket.IO communication
- Playback synchronization
- Role-based permissions
- Role assignment
- Participant removal
- Deployment architecture

---

## 🔮 Future Improvements

Possible improvements include:


- Persistent room state
- Redis for Socket.IO scaling
- Better room management
- More reactions and interactive features
- Improved notifications
- Better error handling and monitoring

---

## 👩‍💻 Author

**Tulsi Tyagi**

Built as a real-time collaborative video watching application using React, Node.js, Express, Socket.IO and MongoDB.
