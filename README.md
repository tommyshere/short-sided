# Golf Stat Tracker

A simple React Native (Expo) app for tracking golf statistics during a round.

## Features

- Track stats for all 18 holes
- Input par for each hole (3, 4, or 5)
- Track fairways hit (for par 4s and 5s)
- Track greens in regulation (GIR)
- Track up and downs (when GIR is missed)
- Track number of putts per hole
- View round summary with calculated statistics
- Data persists between app sessions

## Statistics Tracked

- **Score**: Total strokes and score relative to par
- **Fairways**: Percentage and count of fairways hit
- **GIR**: Percentage and count of greens hit in regulation
- **Up & Down**: Scrambling percentage when missing the green
- **Putts**: Average putts per hole and total putts

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Expo Go app on your iOS device

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create placeholder assets (or add your own icons):

```bash
# The app expects these files in the assets folder:
# - icon.png (1024x1024)
# - splash.png (1284x2778)
# - adaptive-icon.png (1024x1024)
# - favicon.png (48x48)
```

3. Start the development server:

```bash
npm start
```

4. Run on iOS:

```bash
npm run ios
```

Or scan the QR code with the Expo Go app on your iPhone.

## Usage

1. **Navigate Holes**: Use the arrow buttons or tap the hole numbers at the top to switch between holes
2. **Enter Stats**: For each hole, input:
   - Par (3, 4, or 5)
   - Fairway hit (Yes/No) - only shown for par 4s and 5s
   - Green in Regulation (Yes/No)
   - Up and Down (Yes/No) - only shown if you missed the green
   - Number of putts (use +/- buttons)
3. **View Summary**: Tap "View Summary" or "Finish Round" to see your complete round statistics
4. **New Round**: Tap "Start New Round" to reset and begin tracking a new round

## Project Structure

```
golf-stat-tracker/
├── App.js              # Main application component
├── app.json            # Expo configuration
├── package.json        # Dependencies and scripts
├── babel.config.js     # Babel configuration
├── assets/             # App icons and splash screen
└── README.md           # This file
```

## Tech Stack

- React Native
- Expo SDK 50
- AsyncStorage for data persistence
