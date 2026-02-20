# Safespace: Peer Support App for Young Women

Safespace is a secure and private web/mobile app prototype designed for girls and young women. It provides a trusted peer-to-peer space where users can safely discuss real issues—from school pressure and mental health to puberty and rights—beyond school and family environments. 

## 🎯 Project Goals & Features
- **Private Messaging:** Message peers or mentors for private, one-on-one support.
- **Group Discussions:** Join topical groups (e.g., "Periods & Puberty", "Confidence Boost") to connect with others facing similar challenges.
- **Support Forum:** Post questions anonymously and share experiences without judgment.
- **Curated Resources:** Access a knowledge base covering Menstruation, Mental Wellbeing, Rights, and more, complete with quick access to emergency help.
- **Privacy & Safety First:** Emphasizes trust with a safe-space verified badge and "end-to-end encryption" indicators.
- **Modern & Calming UI:** Built with an esthetic, premium design using soothing colors (rose/primary palettes) to foster a calming environment.

---

## 💻 Technology Stack
- **Frontend Framework:** [React.js](https://react.dev/) (Bootstrapped with Vite)
- **Styling:** [Tailwind CSS v3](https://tailwindcss.com/)
- **Routing:** React Router v6
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Backend/Database:** Firebase (Configuration ready)

---

## 📂 Project Structure & Workflow

The application is structured to be scalable and maintainable. Here is how the components are organized under the `src/` directory:

### Core Files
- `main.jsx`: The entry point of the React application. It mounts the main `<App />` component into the DOM.
- `App.jsx`: The core routing file. It wraps the application in `BrowserRouter` and defines the core layout (Navbar, Routes, BottomNav).
- `index.css`: Contains the base Tailwind CSS configurations and global styles.
- `firebase.js`: A configuration file pre-set to initialize your Firebase connection. 

### Components (`src/components/`)
These are reusable UI blocks used across different pages.
- **`Navbar.jsx`**: The top header showing the app name "Safespace", branding, and notification/search icons.
- **`BottomNav.jsx`**: The mobile-first bottom navigation bar. It responds to the current route to highlight the active tab (Home, Groups, Chat, Forum, Docs).

### Pages (`src/pages/`)
These represent the main views of the application as defined by the router paths.
1. **`Home.jsx` (`/`)**: The dashboard. It welcomes the user, displays quick access buttons (Talk Privately, Join a Group, Support Forums), and highlights featured resources.
2. **`Chat.jsx` (`/chat`)**: The 1-on-1 private messaging interface. It currently includes a mocked interactive "chatbot" style flow. For example, if you say "I feel low", the "mentor" will give an automated supportive response. It automatically scrolls to the newest message.
3. **`Groups.jsx` (`/groups`)**: A list of topic-based chat rooms. It demonstrates active groups you can join and groups that are full/inactive.
4. **`Forum.jsx` (`/forum`)**: A community board where users can post questions or stories anonymously. It displays likes, comments, and the topic category.
5. **`Resources.jsx` (`/resources`)**: A knowledge base grouped by categories like health, mental wellbeing, and rights. Importantly, it includes a prominent emergency action call block at the bottom.

---

## 🔄 How It Works (The Data Flow)

### 1. Current State (UI Prototype)
Right now, the application is functioning as a rich, interactive frontend prototype.
- **Mock Data:** The messages in the chat, the posts in the forum, and the lists of groups are hard-coded into the React state or components.
- **Interactivity:** React's `useState` manages the input for the chat form, instantly updating the UI when a user sends a message. `useEffect` is used for auto-scrolling to the bottom of the chat. `framer-motion` applies the smooth transitions.

### 2. Next Steps: Connecting the Backend (Firebase)
To make this application "live" where users can actually talk to each other, you need to connect the backend:
1. **Create a Firebase Project:** Go to the Firebase Console and create a new project.
2. **Set up Firestore & Auth:** Enable Firestore (for storing chat messages, forum posts, and user data) and Firebase Authentication (to let users sign in securely).
3. **Add your Keys:** Open `src/firebase.js` and paste your project configurations where instructed.
4. **Fetch Data:** In components like `Chat.jsx`, instead of using static arrays for `messages`, you will use Firebase's `onSnapshot` to listen to a Firestore collection in real-time. When a user clicks "Send", you will `addDoc` to that Firestore collection.

---

## 🚀 How to Run the Project Locally

Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

1. **Install dependencies:**
   Open your terminal in the target directory and run:
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **View the app:**
   Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173` or `http://localhost:5175`). 
   *Note: For the best experience, open Chrome DevTools, toggle "Device Toolbar" (Ctrl+Shift+M), and view the app in a mobile viewport simulator (like iPhone 12 Pro or Pixel 5).*
