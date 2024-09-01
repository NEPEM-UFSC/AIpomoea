name: CI

on:
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: windows-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.14'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test
