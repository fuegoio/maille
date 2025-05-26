# Maille

Maille is a personal finance tool designed specifically for developers. It provides a modern, developer-friendly approach to managing your personal finances with a clean interface and powerful features.

## Features

- **Modern Tech Stack**: Built with Vue.js frontend and GraphQL API
- **Developer-Focused**: Clean architecture with TypeScript throughout
- **Monorepo Structure**: Organized with Turbo for efficient development
- **Docker Support**: Easy deployment with Docker Compose
- **Financial Tracking**: Manage accounts, movements, activities, and projects

## Architecture

This project is organized as a monorepo with the following structure:

- **[`apps/api/`](./apps/api/)** - GraphQL API server built with Bun and GraphQL Yoga
- **[`apps/ui/`](./apps/ui/)** - Vue.js frontend application with Tailwind CSS
- **[`packages/core/`](./packages/core/)** - Shared TypeScript core library

## Prerequisites

- Node.js >= 18
- npm 10.8.0 or later
- [Bun](https://bun.sh/) (for the API server)

## Quick Start

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd maille
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the API**
   ```bash
   cp apps/api/config.example.json apps/api/config.json
   ```
   Edit [`apps/api/config.json`](./apps/api/config.json) with your preferred settings.

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start both the API server and UI development server concurrently.

### Using Docker

For a quick deployment using Docker:

```bash
docker-compose up --build
```

This will start:
- API server on port 3000
- UI application on port 8080

## Available Scripts

- `npm run dev` - Start development servers for all applications
- `npm run build` - Build all applications for production
- `npm run lint` - Run ESLint across all packages
- `npm run format` - Format code with Prettier

## Configuration

The API server can be configured by editing [`apps/api/config.json`](./apps/api/config.json). See [`apps/api/config.example.json`](./apps/api/config.example.json) for available options:

```json
{
  "startingPeriod": "2023-01",
  "currency": "EUR"
}
```

## Development

This project uses [Turbo](https://turbo.build/) for efficient monorepo management. The build system is configured in [`turbo.json`](./turbo.json).

### Project Structure

```
maille/
├── apps/
│   ├── api/          # GraphQL API server
│   └── ui/           # Vue.js frontend
├── packages/
│   └── core/         # Shared TypeScript library
├── docker-compose.yaml
└── package.json
```

## License

See [LICENCE](./LICENCE) for details.
