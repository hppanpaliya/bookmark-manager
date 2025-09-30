# Copilot Instructions

This document provides guidance for AI coding agents working in the `bookmark-manager` repository.

## Project Overview

This is a Next.js application that functions as a bookmark manager. It uses the App Router for routing and server-side rendering. The tech stack includes:

- **Framework**: Next.js with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS with `clsx` and `tailwind-merge` for utility class composition.
- **Authentication**: NextAuth.js for session management.
- **Database**: `better-sqlite3` for the database, with the database file located in the `data/` directory.
- **UI**: Custom React components are in `src/components`.

## Architecture

The application follows the standard Next.js App Router architecture.

- **API Routes**: All backend API logic is located in `src/app/api/`. Each subdirectory corresponds to an API endpoint (e.g., `/api/bookmarks`, `/api/categories`). These routes handle the database interactions.
- **Authentication**: Authentication is handled by NextAuth.js. The configuration is in `src/lib/auth.ts`, and the API route is at `src/app/api/auth/[...nextauth]/route.ts`.
- **Database**: The database logic is abstracted in `src/lib/database.ts`. This file contains functions for interacting with the SQLite database.
- **UI Components**: Reusable UI components are located in `src/components`. More generic, base components are in `src/components/ui`.
- **Real-time Updates**: The application uses Server-Sent Events (SSE) for real-time updates. The client-side implementation for this can be found in `src/lib/useSSE.ts`.

## Key Files and Directories

- `src/app/api/`: Contains all the backend API routes.
- `src/app/admin/`: Contains the admin-facing pages.
- `src/lib/database.ts`: The single source of truth for database interactions.
- `src/lib/auth.ts`: Configuration for NextAuth.js.
- `src/components/`: Contains all React components.
- `src/components/ui/`: Contains generic, reusable UI components like `Button.tsx` and `Input.tsx`.
- `data/`: This directory will contain the SQLite database file.

## Developer Workflow

- **Running the development server**:
  ```bash
  npm run dev
  ```
- **Building the project**:
  ```bash
  npm run build
  ```
- **Linting the code**:
  ```bash
  npm run lint
  ```

## Code Conventions

- **Styling**: Use Tailwind CSS for styling. For combining classes, use the `clsx` and `tailwind-merge` utilities.
- **Database Access**: All database queries should be made through the functions exported from `src/lib/database.ts`. Do not interact with the database directly from API routes.
- **Authentication**: Use the `auth()` function from `src/lib/auth.ts` to get the current session and protect routes.
- **API Responses**: API routes should return JSON responses with appropriate status codes.
- **Error Handling**: Ensure that API routes and database functions have proper error handling.
