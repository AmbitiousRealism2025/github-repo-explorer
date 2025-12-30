# GitHub Repository Explorer

[![Vite](https://img.shields.io/badge/Vite-7.3.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/Vanilla-JS-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![GitHub API](https://img.shields.io/badge/GitHub-REST_API-181717?style=flat&logo=github&logoColor=white)](https://docs.github.com/en/rest)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)

A professional, high-performance GitHub repository explorer built with vanilla JavaScript and Vite. Featuring a unique "Cyber-Industrial" design language with glassmorphism effects and comprehensive repository analytics.

## ✨ Key Features

-   **Advanced Search**: Discover repositories with real-time keyword search and filters for programming languages and star counts.
-   **Trending Feed**: Stay updated with the most popular repositories created within the last 7 days.
-   **Persistent Favorites**: Save and track repositories of interest using a robust `localStorage` system.
-   **Smart Collections**: Organize repositories into custom collections with quick-add from any repo card.
-   **Side-by-Side Compare**: Compare multiple repositories across key metrics (stars, forks, issues, activity).
-   **Repository Health Score**: Comprehensive health assessment (0-100) based on maintenance, community, documentation, activity, and engagement metrics.
-   **Deep Analytics**:
    -   Detailed repository statistics (Stars, Forks, Issues, Watchers).
    -   Dynamic SVG Donut charts for language distribution.
    -   Commit activity heatmap (GitHub-style contribution calendar).
    -   Recent activity timeline via GitHub Events API.
    -   Clone commands for HTTPS, SSH, GitHub CLI, and Degit.
    -   Personal notes for each repository.
    -   Raw README preview with monospace styling.
-   **Cyber-Industrial UI**: A distinctive aesthetic featuring:
    -   Glassmorphism components.
    -   Background grid patterns and neon glow effects.
    -   Full dark/light theme support with persistence.
    -   Responsive grid layouts for mobile, tablet, and desktop.
    -   Mobile hamburger navigation with slide-in panel.
    -   Fluid typography and accessibility features (reduced motion, high contrast, WCAG AAA contrast).

## 🛠️ Tech Stack

-   **Build Tool**: [Vite 7.3.0](https://vitejs.dev/)
-   **Frontend**: Vanilla ES6+ JavaScript (No framework overhead)
-   **Styling**: Modern CSS with Custom Properties (Theming) and SVG Sprites
-   **API**: [GitHub REST API v2022-11-28](https://docs.github.com/en/rest)
-   **Persistence**: Web Storage API (`localStorage`)
-   **Fonts**: IBM Plex Sans, Syne (Display), JetBrains Mono

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18.0.0 or higher)
-   [npm](https://www.npmjs.com/) (v9.0.0 or higher)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/github-repo-explorer.git
    cd github-repo-explorer
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Development

Run the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Production Build

Build the project for production:
```bash
npm run build
```
The optimized output will be in the `dist/` directory. You can preview the production build locally:
```bash
npm run preview
```

## 📁 Project Structure

```text
github-repo-explorer/
├── index.html          # Search & Results (Entry)
├── trending.html       # Trending Repositories
├── favorites.html      # Saved Favorites
├── collections.html    # Smart Collections Management
├── compare.html        # Side-by-Side Comparison
├── detail.html         # Repository Analysis View
├── src/
│   ├── js/
│   │   ├── api.js      # GitHub API Wrapper (Retry & Cache)
│   │   ├── common.js   # State & Theme Management
│   │   └── components/
│   │       ├── RepoGrid.js       # Repository cards with collection picker
│   │       ├── HealthScore.js    # Repository health assessment
│   │       ├── CommitHeatmap.js  # Contribution calendar
│   │       ├── CloneCommands.js  # Clone command generator
│   │       ├── RepoNotes.js      # Personal notes system
│   │       └── DiscoveryStats.js # Personal discovery tracking
│   └── css/
│       ├── main.css        # Layout & Base Styles
│       ├── theme.css       # "Cyber-Industrial" Design System
│       ├── components.css  # Component-specific styling
│       └── accessibility.css # Reduced motion & high contrast
└── vite.config.js      # Multi-page configuration
```

## 🔑 API Usage & Rate Limits

This application uses the official GitHub REST API.

-   **Unauthenticated**: Limited to 60 requests per hour (Core) and 10 requests per minute (Search).
-   **Authenticated**: By providing a Personal Access Token in the app settings, limits increase to 5,000 requests per hour (Core) and 30 requests per minute (Search).

*Note: Tokens are stored only in your browser's local storage and are never sent to any server except GitHub.*

## 🎨 Design System

The **Cyber-Industrial** theme uses a teal-accented palette:
-   **Dark Mode**: `#0c0c0f` (Background), `#14b8a6` (Accent)
-   **Light Mode**: `#f3f4f6` (Background), `#0d9488` (Accent)

The system leverages `glass-blur` (12px) and `shadow-glow` effects to create depth and a technical aesthetic.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
