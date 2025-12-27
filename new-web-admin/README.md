# TMS - Traffic Management System (Web Admin)

## Project Overview

Official web administration interface for the Sidama Region Traffic Management System. This application provides comprehensive vehicle registration, licensing, and inspection management for the Sidama Region Transport Authority in Hawassa, Ethiopia.

## Features

- **Vehicle Registration & Management**: Complete CRUD operations for vehicle records
- **Owner Management**: Track and manage vehicle owners with TIN verification
- **License Tracking**: Monitor license expiry dates and renewal status
- **Dashboard Analytics**: Real-time statistics and insights
- **Role-Based Access Control**: Super admin, admin, and unverified admin roles
- **Dark/Light Theme**: User preference support

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Backend Integration**: FastAPI REST API
- **Authentication**: JWT-based auth

## Development Setup

### Prerequisites

- Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Backend API running on `http://localhost:8000`

### Installation

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

### Production Build

```bash
npm run build
```

The build output will be in the `dist/` directory, ready for deployment to any static hosting service.

### Environment Variables

Ensure the following environment variables are set:

- `VITE_API_URL`: Backend API URL (default: `http://localhost:8000`)
- `VITE_ENABLE_ADMIN_SIGNUP`: Enable admin registration (default: `false`)

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (Auth, Theme)
├── hooks/          # Custom React hooks
├── lib/            # Utilities and API client
├── pages/          # Page components
└── integrations/   # Third-party integrations
```

## License

Proprietary - Sidama Region Transport Authority
