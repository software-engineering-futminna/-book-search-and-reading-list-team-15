# 📚 BookNest — Your Personal Reading Companion

[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![OpenLibrary](https://img.shields.io/badge/OpenLibrary-API-8B4513?style=for-the-badge&logo=openlibrary)](https://openlibrary.org/developers/api)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> **A modern, offline-first Progressive Web App to search millions of books, build your reading list, and track your literary journey—all in your browser, powered by a lightweight static web app.**

---

## 📖 Table of Contents

- [Overview](#-overview)
- [The Problem](#-the-problem)
- [What Makes BookNest Different](#-what-makes-booknest-different)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Built With](#-built-with)


---

## 🎯 Overview

**BookNest** is a progressive web application that transforms how you discover, organize, and track your reading habits. It leverages the expansive Open Library API to provide access to millions of books, allowing you to curate a personal digital shelf.

The application is a **static web application**: HTML, CSS, and JavaScript run directly in the browser, while the Open Library API provides book search data. However, the core philosophy remains **privacy-first**—your personal library, ratings, and notes are stored locally in your browser's `localStorage`, ensuring your data stays private and accessible anytime—even without an internet connection.

---

## The Problem

Readers and book lovers often face several challenges:

- **Discovery is scattered** – finding new books requires jumping between Goodreads, Amazon, library catalogs, and social media.
- **Data is locked in silos** – your reading history is tied to proprietary platforms that may change their terms or disappear.
- **Offline access is rare** – most book apps require a constant internet connection to show even your own lists.

BookNest solves these by providing a single, lightweight, offline‑first tool that puts you in control of your reading data.

---

## 💡 What Makes BookNest Different

| Traditional Book Apps | BookNest |
| :--- | :--- |
| Require an account and cloud storage | **Works entirely offline** – no sign‑up, no server dependency |
| Track your reading for advertising purposes | **Privacy‑first** – all data stays on your device |
| Depend on a constant internet connection | **Offline‑ready** – your library and recent books are always available |
| Force you into a single view (grid or list) | **Dual layout** – switch between grid and list views |
| Often lack note‑taking and rating features | **Rich tracking** – add star ratings and private notes to each book |

---

## Key Features

- **Global Book Search** – Search millions of titles, authors, and keywords using the Open Library API.
- **📚 Personal Library Management** – Save books to your own "Shelf" and organise them into three statuses:
  - 🟣 Want to Read
  - 🔵 Currently Reading
  - 🟢 Finished
- **Private Tracking** – Rate books (1–5 stars) and add personal notes to each entry.
- **Quick Look Panel** – View detailed information (description, subjects) without leaving the main grid.
- **Dual View Options** – Switch between a visual **Grid** view and a text‑based **List** view (ideal for offline/low‑bandwidth scenarios).
- **PWA Capabilities** – Installable on your device's home screen; caches the app shell for offline access.
- **Seamless Theme Switching** – Toggle between Light and Dark modes.
- **Static Web App** – Runs directly in the browser without a backend runtime.

---

## Architecture

The application uses a static frontend architecture: client-side JavaScript handles user interactions and data storage directly in the browser.

```text
User Browser
    ├── HTML / CSS / JavaScript
    ├── localStorage → Library, Recent Books, Settings
    ├── Open Library API → Book Search
    └── Service Worker → Cached App Shell
```
---
## Quick Start

### Quick Start

BookNest can be opened directly in a browser or deployed to any static hosting service.

1. Download or clone the repository.
2. Open `index.html` in a browser, or serve the folder with any static web server.
3. Internet access is only required for fresh searches from the Open Library API; saved library data remains in the browser.

## Project structure

```
Project-BookNest/
├── sw.js                             # Service Worker for offline caching
├── README.md                         # README guide
├── templates/                        # HTML templates
             └── index.html           # Main application HTML
├── static/
          ├── styles.css              # All application styles & themes
          ├── app.js                  # Core application logic
          ├── manifest.json           # PWA manifest configuration
          └── icons/                  # Application icons for PWA
          ├── app-icon.png
          ├── icon-192.png
          └── icon-512.png                
```
## Built With

| Technology | Purpose |
| :--- | :--- |
| **HTML/CSS/JavaScript** | Static frontend |
| **Gunicorn** | Production WSGI server |
| **HTML5** | Structure & semantics |
| **CSS3** | Styling, theming, responsiveness (custom properties, Flexbox, Grid) |
| **Vanilla JavaScript** | Logic, API communication, state management |
| **Open Library API** | Book metadata and cover images |
| **localStorage** | Persistent client‑side data |
| **Google Fonts (Outfit, Figtree)** | Typography |
| **Inline SVGs** | Icons |

All dependencies are managed via `requirements.txt` and can be installed with a single command.
