# ✨ HighlightSaver

*A premium, high-performance Chrome Extension for researchers, developers, and avid readers.*

Welcome to **HighlightSaver**! This extension provides a seamless way to save text snippets across the web, organize them locally, and generate intelligent, AI-powered summaries using the Groq API. With native Chrome Text Fragments, you can deep-link right back to the exact text you highlighted!

## 🚀 Features

- **Text Highlighting & Deep-linking**: Highlight text on any page and save it. We use native Chrome Text Fragments to take you back exactly where you left off.
- **AI-Powered Summaries**: Instantly summarize your saved highlights using blazing-fast AI inference via the **Groq API**.
- **Responsive UI/UX**: Whether using the popup or a detached window, the interface is polished, modern, and built for productivity.
- **Offline-First Storage**: Highlights are synced and stored locally using Chrome's native storage APIs.

---

## 🏗️ Architecture & Technical Decisions

I built this project with a purposeful tech stack, optimizing for performance, learning, and maintainability:

- **Vite over Vanilla JS/Webpack**: Vite provides an incredibly fast feedback loop during development and a highly optimized output tailored for Manifest V3 extension guidelines. It makes managing content scripts and background service workers a breeze.
- **Vanilla CSS over Tailwind**: To keep the extension bundle as lean as possible and avoid unnecessary payload sizes, I opted for Vanilla CSS. It gives complete control over the intricate UI aesthetics, custom properties, and responsive micro-animations without relying on heavy utility frameworks.
- **TypeScript**: Enforces strict typing across Chrome APIs and background messaging, preventing runtime errors and making the codebase robust and self-documenting.

---

## 🗂️ Project Structure

Here's a human-friendly look at how the extension is organized under the hood:

```text
HighlightSaver/
├── public/                 # Static assets served as-is
│   └── manifest.json       # Chrome Manifest V3 configuration dictates permissions & entry points
├── src/                    # Main source code directory
│   ├── background.ts       # Service worker: manages background events, data sync, and API logic
│   ├── content.ts          # Page script: injected into active tabs to handle UI text highlighting
│   ├── popup.ts            # UI logic: handles the extension popup and detached window operations
│   └── popup.css           # Styling: Vanilla CSS architecture for the extension interfaces
├── dist/                   # The final compiled extension (generated on build)
├── .env                    # Environment variables (e.g., Groq API keys) - ignored in Git
├── package.json            # Project dependencies and executable npm scripts
├── tsconfig.json           # TypeScript compiler configuration
└── vite.config.ts          # Vite build pipeline tailored for Chrome extensions
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- A [Groq API Key](https://console.groq.com/) (if you want to use the AI summary feature)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/HighlightSaver.git
   cd HighlightSaver
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
  ```NILL```

4. **Build the extension:**
   ```bash
   npm run build
   ```

### Loading into Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** via the toggle in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the newly generated `dist` folder.
5. Pin the extension to your toolbar and start highlighting the web!

---

## 🤝 Let's Connect
Feel free to open an issue or submit a pull request if you spot a bug or have an idea for a cool new feature. I built this both as an exercise in extension architecture and as a genuinely helpful daily tool. 

## 📄 License
This project is licensed under the MIT License.
