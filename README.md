# Sudoku

This is a Sudoku web application built with [Svelte](https://svelte.dev) and [Vite](https://vitejs.dev), configured for deployment on [Firebase Hosting](https://firebase.google.com/docs/hosting).

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Rust](https://www.rust-lang.org/tools/install) (required for building WASM package)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) (for building the WASM package)
- [Firebase CLI](https://firebase.google.com/docs/cli) (for deployment)

To install Rust:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

To install wasm-pack:

```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

To install Firebase CLI:

```bash
npm install -g firebase-tools
```

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd sudoku
   ```

2. Initialize submodules (required for Sudoku logic):

   ```bash
   git submodule update --init --recursive
   ```

3. Build the WASM package:

   ```bash
   npm run build:wasm
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

## Development

To start the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Building

To create a production build:

```bash
npm run build
```

This will generate the static assets in the `build` directory, ready for deployment.

## Deployment

This project is configured to deploy to Firebase Hosting.

1. Login to Firebase:

   ```bash
   firebase login
   ```

2. Deploy to Firebase:

   ```bash
   npm run deploy
   ```

   This command runs the format check, builds the project, and then deploys it to Firebase.

## Testing

To run the test suite (using Vitest):

```bash
npm run test
```

## Linting & Formatting

- **Lint**: `npm run lint`
- **Format**: `npm run format`
