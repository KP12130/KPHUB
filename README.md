# CodeNeon ⚡

> A futuristic platform for beginner programmers to upload, share, and promote their coding projects.

![Theme](https://dummyimage.com/600x400/000/39ff14&text=CodeNeon+Theme)

## Features
- **Project Showcase**: Upload and display web apps, games, and scripts.
- **Gamification**: Earn badges and climb the leaderboard.
- **Monetization**: AdSense integration and Premium subscriptions.
- **Community**: Like, comment, and tip creators.

## Tech Stack
- **Frontend**: React.js (Vite), Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Auth**: Firebase / OAuth

## Project Structure
```text
codex_spark/
├── client/     # React Frontend
├── server/     # Express Backend
└── README.md   # This file
```

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB URI (local or Atlas)

### Installation

1.  **Clone & Setup**:
    ```bash
    git clone <repo-url>
    cd codex_spark
    ```

2.  **Server Setup**:
    ```bash
    cd server
    npm install
    # Rename .env.example to .env and configure
    npm start
    ```

3.  **Client Setup**:
    ```bash
    cd client
    npm install
    npm run dev
    ```

## Development
- **Design System**: See `design_system.md` in docs.
- **API Docs**: See `/server/routes` for endpoint details.

---
*Created by CodeNeon Team*
