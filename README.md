# PDF Password Remover

A privacy-focused web application for removing password protection from PDF files. Upload a password-protected PDF, enter the password, and download an unlocked version. All processing happens entirely in your browser — your files never leave your device. Perfect for removing passwords from your own PDFs.

## 🔧 Development Setup

To run this project locally, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/thiagofeijodev/pdf-password-remover.git
   cd pdf-password-remover
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the development server:**

   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`.

## 🧪 Running Tests

This project includes unit tests and end-to-end tests. Here's how to run them:

### Unit Tests

To execute the unit test suite using Jest:

```bash
npm test
```

This runs all tests in the `src/` directory with a maximum of 2 concurrent workers.

### End-to-End Tests

Before running Playwright tests for the first time, install the required dependencies:

```bash
npm run test:prepare
```

Then, to run the Playwright e2e test suite:

```bash
npm run test:e2e
```

To run e2e tests in UI mode (interactive):

```bash
npm run test:e2e:ui
```

### Running All Tests

To run both unit and e2e tests locally:

```bash
npm test && npm run test:e2e
```

### Test in CI Environment

For continuous integration pipelines, use:

```bash
npm run test:ci        # Runs Jest with JSON output for CI
npm run test:e2e:ci    # Runs Playwright in CI mode
```

## 📦 Build for Production

To create a production-ready build:

```bash
npm run build
```

The optimized assets will be available in the `dist/` directory.

## 🌐 Deployment

This application is deployed using GitHub Pages. After pushing changes to the `main` branch, GitHub Pages will automatically update the live site.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or improvements, please fork the repository and submit a pull request.

## 📄 License

This project is licensed under the MIT License.

## 📬 Contact

Feel free to connect with me on [LinkedIn](https://www.linkedin.com/in/thiagofeijodev).

---
