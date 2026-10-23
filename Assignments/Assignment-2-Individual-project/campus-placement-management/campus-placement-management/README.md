# Campus Placement Management System

A web-based application for colleges to manage student profiles, recruiting companies, job opportunities, and placement applications. Built with **HTML, CSS, JavaScript, ReactJS (Vite)** and **JSON Server**.

## Features

- **Dashboard** with placement statistics: total students, companies, open jobs, applications, placement rate, application pipeline, top hiring companies, and recent applications.
- **Students** – add, edit, delete, search student profiles (roll number, department, CGPA, batch, skills). Placement status is derived automatically from applications.
- **Companies** – manage recruiting companies and contact details. Companies with job postings are protected from deletion.
- **Job Opportunities** – post jobs linked to companies, with package, minimum CGPA, deadline, and open/closed status. Filter by status.
- **Applications** – track which student applied to which job and move them through the pipeline (Applied → Shortlisted → Interview → Selected / Rejected). Duplicate applications are blocked.
- Form validation, search, status filters, confirmation dialogs, toast notifications, and a responsive layout.

## Tech Stack

| Layer     | Technology                      |
| --------- | ------------------------------- |
| Frontend  | React 18, React Router, Vite    |
| Styling   | Plain CSS (responsive)          |
| Backend   | JSON Server (REST API on `db.json`) |

## Project Structure

```
campus-placement-management/
├── db.json                     # JSON Server database (sample data)
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Layout, sidebar and routes
    ├── index.css               # Global styles
    ├── components/
    │   ├── CrudPage.jsx        # Reusable list/search/add/edit/delete page
    │   └── Modal.jsx           # Modal dialog
    ├── config/
    │   └── resources.jsx       # Field, column and validation config per entity
    ├── pages/
    │   └── Dashboard.jsx       # Placement statistics dashboard
    ├── services/
    │   └── api.js              # REST client for JSON Server
    └── utils/
        └── helpers.js          # Shared helper functions
```

## Getting Started

### 1. Prerequisites

- Node.js 18 or later
- npm (comes with Node.js)

### 2. Install dependencies

```bash
cd campus-placement-management
npm install
```

### 3. Run the app

Start both the JSON Server API and the React dev server with one command:

```bash
npm start
```

Or run them in two separate terminals:

```bash
npm run server     # JSON Server  -> http://localhost:5000
npm run dev        # React app    -> http://localhost:5173
```

Open **http://localhost:5173** in your browser.

### 4. Build for production

```bash
npm run build
npm run preview
```

## REST API Endpoints (JSON Server)

| Resource     | Endpoint                  |
| ------------ | ------------------------- |
| Students     | `http://localhost:5000/students`     |
| Companies    | `http://localhost:5000/companies`    |
| Jobs         | `http://localhost:5000/jobs`         |
| Applications | `http://localhost:5000/applications` |

Each resource supports `GET`, `POST`, `PATCH`, and `DELETE` on `/resource` and `/resource/:id`.

To use a different API URL, create a `.env` file in the project root:

```
VITE_API_URL=http://localhost:5000
```

## Notes

- All data is stored in `db.json`. Changes made through the app are saved to that file by JSON Server.
- To reset the data, restore the original `db.json`.
