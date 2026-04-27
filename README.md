# Peerveil (Voice Chat Web)

This project is a fully browser-based, peer-to-peer (P2P) video and voice chat application.

It was built with the goal of allowing users to connect and communicate directly with each other via WebRTC (PeerJS) without putting any load on intermediary backend servers.

## Features
- **Room System:** Create identified rooms and easily protect them with a password if needed.
- **Audio & Video:** Full control over your microphone and camera settings.
- **Screen Sharing:** Share your entire screen or a specific window with other participants with a single click.
- **Dynamic Layouts:** Adaptive grid layout based on participant count, spotlighting features, and active speaker indicators.
- **Text Chat:** A built-in sidebar chat for real-time text messaging alongside video and audio.

## Setup and Installation

Running the project on your local machine is extremely simple. You just need to have Node.js installed.

1. First, clone the repository to your local machine and navigate into the project folder:
```bash
git clone https://github.com/sevketcklft/peerveil.git
cd peerveil
```

2. Install the required dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

That's it. Simply open your browser and navigate to `http://localhost:5173` (or the address provided in your terminal) to test it out. You can open another tab or use your phone to join your own room and see the P2P connection in action.
