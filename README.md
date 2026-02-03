# DuoGym

DuoGym is a modern, real-time workout tracker designed for gym partners. It allows users to track their workouts, sync progress with a partner in real-time, and analyze their performance.

## Features

- **Real-time Sync**: Workout with a partner and see their progress instantly.
- **Workout Tracking**: Log sets, reps, and weights for various exercises.
- **Progression**: Automatic weight suggestions based on your history.
- **Duo Mode**: Connect with a partner via a room code.
- **PWA Support**: Installable on mobile devices for a native-like experience.
- **Wake Lock**: Keeps your screen on during workouts.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **State Management**: React Context API
- **Real-time**: Socket.io
- **Deployment**: Docker, Nginx

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/duo-gym.git
   cd duo-gym
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Docker Deployment

To deploy using Docker:

1. Build and start the containers:
   ```bash
   docker-compose up -d --build
   ```

2. The application will be available at `http://localhost:3000` (or configured port).

## License

MIT
\n<!-- workflow-trigger-test: Tue  3 Feb 17:07:01 CET 2026 -->
