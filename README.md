# AwRewards - Puzzle-Based Reward Claiming App

A modern, ultra-interactive puzzle app where users solve daily crossword, sudoku, and memory challenges to earn and claim exclusive reward codes. Built with Next.js 14, Firebase, Tailwind CSS, and Framer Motion.

## Features

### Core Functionality
- **Daily Puzzles**: Crossword (5x5), Sudoku (4x4), Memory matching game
- **Claiming Flow**: Solve all 3 puzzles to unlock codes with weighted random selection
- **Code Management**: Admin panel for managing reward codes with bulk upload
- **Authentication**: Google Sign-In with role-based access

### Ultra-Interactive UI/UX
- **Glassmorphism Design**: Blur effects, gradient borders, particle animations
- **3D Animations**: Flip animations for memory cards, floating fragments
- **Micro-interactions**: Scale, glow, ripple effects on buttons
- **Confetti Explosions**: Epic unlock animations
- **Progress Rings**: Gradient stroke animations

### Engagement & Retention
- **Streaks & Badges**: Daily login streaks with fire emojis, profile badges
- **Leaderboards**: Fastest solvers (today/week/all-time)
- **Boosts System**: Earn hints at streak milestones (3-day, 7-day, 30-day)
- **Streak Calendar**: GitHub-style heatmap
- **Push Notifications**: Reminders for unsolved puzzles

### PWA Features
- **Install Prompt**: Native app-like experience
- **Offline Support**: Cached dashboard data
- **App Icon Badge**: Shows unclaimed fragments count

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Animations**: Framer Motion, React Spring
- **Backend**: Firebase Auth, Firestore, Firebase Admin SDK
- **PWA**: Service Worker, Web App Manifest
- **Libraries**: React Confetti, React Hot Toast, Lucide Icons

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- Firebase project with Firestore enabled
- Google OAuth credentials

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create `.env.local` with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Service account JSON for admin operations (server-side only)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

### 4. Firebase Setup
1. Enable Authentication with Google provider
2. Enable Firestore database
3. Add authorized domains for OAuth redirect
4. Deploy Firestore security rules from `firestore.rules`
5. Create admin user manually in Firestore with `role: "admin"`

### 5. Seed Demo Data
```bash
npm run seed
```
This adds sample codes and daily puzzles for testing.

### 6. Development
```bash
npm run dev
```

### 7. Build for Production
```bash
npm run build
npm start
```

## Deployment to Vercel

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy - the app is optimized for serverless deployment

## File Structure

```
├── app/                     # Next.js app directory
│   ├── api/                 # API routes
│   ├── admin/               # Admin panel
│   ├── dashboard/           # User dashboard
│   ├── gamehub/             # Puzzle selection
│   └── puzzle/              # Individual puzzle pages
├── components/              # Reusable components
├── hooks/                   # Custom React hooks
├── lib/                     # Utility libraries
├── public/                  # Static assets and PWA files
├── scripts/                 # Seed and utility scripts
└── styles/                  # Global styles
```

## Admin Panel

Access `/admin` with an admin account to:
- Add/edit/delete codes
- Bulk upload via CSV
- View code statistics
- Manage user data

## Testing

- Run `npm test` for unit tests
- Manual testing: Sign up, solve puzzles, claim codes
- PWA testing: Install on device, test offline mode

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## License

MIT License - see LICENSE file for details.