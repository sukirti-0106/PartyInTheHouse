# Watch Party - Architecture Overview

## 1. Introduction

Watch Party follows a client-server architecture where the React frontend communicates with a Node.js and Express backend.

REST APIs are used for authentication and room-related operations, while Socket.IO is used for real-time communication between users in the same room.

MongoDB is used to store user and room-related information.

---

## 2. Overall Architecture

```text
                    Watch Party
                        |
          +-------------+-------------+
          |                           |
          ↓                           ↓
      Frontend                    Backend
       React                  Node.js + Express
          |                           |
          |                    +------+------+
          |                    |             |
          |                    ↓             ↓
          |                REST APIs     Socket.IO
          |                    |             |
          |                    ↓             ↓
          |                MongoDB       Room Events
          |                                  |
          +----------------------------------+
```

The frontend is responsible for the user interface, video player and user interactions.

The backend handles authentication, room management, permissions and real-time communication.

---

## 3. Authentication Flow

Users first register or log in through the React frontend.

```text
User
  |
  | Register / Login
  ↓
React Frontend
  |
  | HTTP Request
  ↓
Express Backend
  |
  ↓
User Controller
  |
  ↓
MongoDB
  |
  | User verified
  ↓
JWT Token Generated
  |
  ↓
Frontend
```

JWT is used to authenticate users.

After successful login, the backend generates a JWT token. The frontend uses this token for authenticated API requests and Socket.IO authentication.

Passwords are hashed using bcrypt before being stored in the database.

---

## 4. Create and Join Room Flow

A user can create a new Watch Party room or join an existing room.

```text
                User
                  |
                  ↓
          Create / Join Room
                  |
                  ↓
            React Frontend
                  |
                  | HTTP Request
                  ↓
          Express Backend
                  |
                  ↓
             Room Logic
                  |
                  ↓
           Room Created /
            Room Joined
                  |
                  ↓
           Watch Party Page
                  |
                  ↓
          Socket.IO Connection
```

When users join the same room, they are connected to the same Socket.IO room. This allows the server to send real-time events to everyone inside that room.

---

## 5. Socket.IO Architecture

Socket.IO is the main part responsible for real-time communication.

When a user enters a Watch Party, the frontend establishes a Socket.IO connection with the backend.

```text
                 Socket.IO Server
                       |
          +------------+------------+
          |            |            |
          ↓            ↓            ↓
        Host       Moderator    Participant
          |            |            |
          +------------+------------+
                       |
                  Same Room
```

Each connected user has a role in the room.

The server keeps track of the users and their roles so that it can validate actions before broadcasting them.

---

## 6. Real-Time Playback Flow

Playback actions such as play, pause, seek and changing the video are synchronized using Socket.IO.

### Play / Pause Flow

```text
Host / Moderator
       |
       ↓
Video Player
       |
       | emit("play") / emit("pause")
       ↓
Socket.IO Server
       |
       ↓
Permission Check
       |
       ↓
Action Allowed
       |
       | Broadcast Event
       ↓
Other Participants
       |
       ↓
Their Video Players Update
```

For example, when the Host clicks Play, the frontend sends a `play` event to the server.

The server checks the user's role. If the user is a Host or Moderator, the server broadcasts the event to the other participants in the room.

---

## 7. Seek Synchronization

When a Host or Moderator changes the current video time, the new time is sent to the backend.

```text
Host / Moderator
       |
       | seek { time }
       ↓
Socket.IO Server
       |
       | Check Permission
       ↓
Broadcast "seek"
       |
       ↓
Other Participants
       |
       ↓
Video moves to same time
```

The `time` value represents the current position of the video.

This allows all users to follow the same playback position.

---

## 8. Change Video Synchronization

The Host or Moderator can change the YouTube video.

```text
Host / Moderator
       |
       | change_video { videoId }
       ↓
Socket.IO Server
       |
       | Check Permission
       ↓
Broadcast "change_video"
       |
       ↓
Other Participants
       |
       ↓
New Video Loaded
```

The new YouTube video ID is sent through Socket.IO and the other participants update their video player.

---

## 9. Role-Based Permissions

The application has three main roles:

- Host
- Moderator
- Participant

The backend validates permissions before processing control events.

```text
                 Socket Event
                      |
                      ↓
                Identify User
                      |
                      ↓
             Find User in Room
                      |
                      ↓
                 Check Role
                  /       \
                 /         \
                ↓           ↓
        Host / Moderator  Participant
                |           |
                ↓           ↓
             Allow        Reject
             Action       Action
```

The frontend also disables restricted controls for Participants, but the main permission check is performed on the backend.

This prevents a Participant from directly sending playback-control events and changing the room state.

---

## 10. Role Assignment Flow

The Host can assign roles to participants.

```text
Host
 |
 | assign_role
 ↓
React Frontend
 |
 ↓
Socket.IO Server
 |
 ↓
Permission Check
 |
 ↓
Update Participant Role
 |
 ↓
role_assigned
 |
 ↓
All Participants
 |
 ↓
Updated Role Information
```

The Host can assign a Participant as a Moderator or change a Moderator back to a Participant.

---

## 11. Remove Participant Flow

The Host can remove a participant from the room.

```text
Host
 |
 | remove_participant
 ↓
Socket.IO Server
 |
 ↓
Permission Check
 |
 ↓
Remove Participant
 |
 ↓
participant_removed
 |
 ↓
Room Participants Updated
```

The removed participant is disconnected from the room and the remaining participants receive the updated participant information.

---

## 12. Main Socket Events

The application uses Socket.IO events for room and playback operations.

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

### Participant Management Events

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

These events allow the server and clients to communicate in real time.

---

## 13. Data Flow

The overall data flow can be represented as:

```text
                    React Frontend
                          |
             +------------+------------+
             |                         |
             ↓                         ↓
        REST API                   Socket.IO
             |                         |
             ↓                         ↓
       Express Backend          Socket Controller
             |                         |
             ↓                         ↓
         Controllers              Room State
             |                         |
             ↓                         |
          MongoDB <-------------------+
```

REST APIs are mainly used for operations such as authentication and room management.

Socket.IO handles real-time room communication and synchronization.

---

## 14. Deployment Architecture

The application is deployed using Vercel, Render and MongoDB Atlas.

```text
                       Internet
                           |
                           ↓
                 Vercel - Frontend
                  React Application
                           |
                 +---------+---------+
                 |                   |
                 ↓                   ↓
              REST API           Socket.IO
                 |                   |
                 +---------+---------+
                           |
                           ↓
                  Render - Backend
                   Node + Express
                           |
                           ↓
                    MongoDB Atlas
```

### Deployment URLs

Frontend:

https://party-in-the-house.vercel.app/

Backend:

https://partyinthehouse.onrender.com/

The frontend communicates with the backend through REST APIs and Socket.IO.

---

## 15. Complete Watch Party Flow

The complete flow of the application is:

```text
User
 |
 ↓
Login / Register
 |
 ↓
JWT Authentication
 |
 ↓
Create / Join Room
 |
 ↓
Watch Party Page
 |
 ↓
Socket.IO Connection
 |
 ↓
User Joins Socket Room
 |
 ↓
Host / Moderator / Participant
 |
 ↓
Playback Action
 |
 ↓
Socket Event
 |
 ↓
Backend Permission Check
 |
 +---------------------------+
 |                           |
 ↓                           ↓
Allowed                    Not Allowed
 |                           |
 ↓                           ↓
Broadcast Event             Reject
 |
 ↓
Other Participants
 |
 ↓
Video State Updated
```

---

## 16. Technologies Used

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

- Vercel
- Render

---

## 17. Summary

Watch Party uses React on the frontend and Node.js with Express on the backend.

REST APIs handle authentication and room-related operations, while Socket.IO provides real-time communication between users in the same room.

The backend validates user roles before allowing playback-related actions. This ensures that Host and Moderator users can control the shared video while Participants cannot directly modify the playback state.

The combination of Socket.IO, role-based permissions and synchronized video events allows multiple users to watch the same video together in real time.
