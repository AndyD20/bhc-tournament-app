# BHC Tournament App

A functional, mobile-first, and responsive Historical European Martial Arts (HEMA) tournament tracker application built with SvelteKit.

## Features

- **Participant Management**: Add and manage competitors in your tournament.
- **Configurable Scoring**: Customize point values for different hit locations (e.g., head, body, arms).
- **Advanced Match Logic**: Support for double hits and afterblows, with separate point configurations for attackers and defenders.
- **Round-Robin Scheduling**: Automatically generates a semi-randomized round-robin match schedule, designed to minimize consecutive fights for any single participant.
- **Match Tracking**: Real-time scoreboard displaying the current match, current round, and an "Up Next" indicator.
- **Tiebreakers**: Optional "Prevent Draws" feature that introduces tiebreaker rounds when a match would otherwise end in a draw.
- **Rankings & Standings**: Automatically tracks complete participant statistics including wins, losses, draws, points scored, points against, and matches fought to determine final rankings.

## Getting Started

This project is built using SvelteKit. To run the client locally:

```sh
cd client
npm install
npm run dev
```

Navigate to `http://localhost:5173` to view the app in your browser.
