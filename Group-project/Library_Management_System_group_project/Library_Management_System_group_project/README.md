# 📚 Library Management System

A beginner-friendly, full-stack web application designed for modern library administration. Manage books, members, and book circulation (issues and returns) with ACID database transactions, inventory control, and real-time dashboard analytics.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Fast single-page application with responsive UI and instant HMR |
| **Icons** | Lucide React | Modern, lightweight, accessible SVG icons |
| **Styling** | Modern CSS | CSS custom properties (variables), responsive flexbox/grid, modal dialogs, and toast notifications |
| **Backend** | Node.js & Express.js | Modular RESTful API architecture with error-handling middleware |
| **Database** | MySQL (with `mysql2/promise`) | Relational database with Foreign Keys, `CHECK` constraints, and ACID transactions |
| **Communication**| REST APIs (JSON) | Standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) with parameterized queries |

---

## ✨ Features

- **📊 Dashboard Statistics**:
  - Live counts for total titles, total copies, available copies in stock, currently issued books, total registered members, and overdue books.
  - Category-by-category inventory progress bars.
  - Real-time recent circulation table with quick "Mark Return" action.

- **📖 Book Catalog Management**:
  - Add new books with `title`, `author`, `isbn`, `category`, and `quantity`.
  - Automatically initializes and manages `available_quantity`.
  - Edit existing book details with inventory safety checks (prevents lowering quantity below currently issued copies).
  - Delete books safely (prevents deleting books currently borrowed by members).
  - Search books by **title, author, or ISBN**.
  - Filter books by **category**.
  - Visual stock status indicators: `In Stock`, `Low Stock`, and `Out of Stock`.

- **👥 Member Management**:
  - Register new members with `name`, `email`, and `phone` with input validation.
  - View member profiles and their active borrowed books.
  - Edit member information.
  - Delete member records (safe delete: blocks deletion if the member has active unreturned books).

- **🔄 Issue & Return Circulation (with ACID Transactions)**:
  - Issue books to members:
    - Verifies available copies (`available_quantity > 0`).
    - Uses database transactions with row-level locking (`FOR UPDATE`) to prevent race conditions.
    - Atomically decrements `available_quantity` and creates the `book_issues` record.
    - Prevents accidental duplicate issuing of the same book to the same member.
    - Configurable due date (defaults to 14 days from issue).
  - Return books:
    - Atomically increments `available_quantity` and updates the record status to `returned` with `return_date`.
    - Automatically highlights overdue returns.
  - Filter circulation records by: `All Records`, `Currently Issued (Active)`, and `Returned Books`.

- **🔔 User Experience & Validation**:
  - Clean floating toast notifications for success and error messages.
  - Confirmation modals before deleting records or completing returns.
  - Fully responsive design with mobile drawer navigation.

---

## 📁 Project Structure

```text
Library_Management_System/
├── database/
│   └── schema.sql              # MySQL schema & realistic sample seed data
├── backend/
│   ├── config/
│   │   └── db.js               # MySQL connection pool configuration
│   ├── controllers/
│   │   ├── bookController.js   # Book CRUD + category filtering
│   │   ├── memberController.js # Member CRUD + active borrow checks
│   │   ├── issueController.js  # Issue/return ACID transaction logic
│   │   └── dashboardController.js # Aggregated statistics
│   ├── routes/
│   │   ├── bookRoutes.js       # Book API routes
│   │   ├── memberRoutes.js     # Member API routes
│   │   ├── issueRoutes.js      # Circulation API routes
│   │   └── dashboardRoutes.js  # Dashboard stats route
│   ├── middleware/
│   │   └── errorHandler.js     # Centralized error response handler
│   ├── .env                    # Active backend environment variables
│   ├── .env.example            # Backend environment template
│   ├── package.json            # Backend dependencies
│   └── server.js               # Express application entry point
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js          # Centralized fetch API client
│   │   ├── components/
│   │   │   ├── Sidebar.jsx     # Navigation sidebar
│   │   │   ├── Header.jsx      # Top header with dynamic titles
│   │   │   ├── StatCard.jsx    # Metric summary card
│   │   │   ├── Modal.jsx       # Reusable accessible dialog
│   │   │   ├── ConfirmDialog.jsx # Action confirmation modal
│   │   │   └── Toast.jsx       # Floating notifications
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Metrics, charts & quick actions
│   │   │   ├── Books.jsx       # Catalog, search, filters & CRUD
│   │   │   ├── Members.jsx     # Member list, search & profiles
│   │   │   └── IssueReturn.jsx # Issue/return management & logs
│   │   ├── styles/
│   │   │   ├── index.css       # Design tokens & typography
│   │   │   ├── layout.css      # Grid, sidebar & responsive drawer
│   │   │   ├── components.css  # Buttons, tables, cards, modals
│   │   │   └── toast.css       # Toast animations & alert styles
│   │   ├── App.jsx             # Main application layout & state
│   │   └── main.jsx            # React root mounting
│   ├── .env                    # Active frontend environment variables
│   ├── .env.example            # Frontend environment template
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Vite config with API proxy
├── package.json                # Root package for convenient scripts
└── README.md                   # Documentation and setup guide
```

---

## 🗄️ Database Design

The database uses 3 relational MySQL tables with InnoDB engine for transaction support:

### 1. `books` Table
```sql
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    available_quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_available CHECK (available_quantity >= 0 AND available_quantity <= quantity)
);
```

### 2. `members` Table
```sql
CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. `book_issues` Table
```sql
CREATE TABLE book_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    status ENUM('issued', 'returned') NOT NULL DEFAULT 'issued',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_issue_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_issue_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
```

---

## 🚀 Step-by-Step Installation & Setup

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MySQL Server** (v8.0+ / Community Server) running locally on port `3306`

---

### 2. Database Setup
1. Open your terminal or MySQL client (MySQL CLI / MySQL Workbench / phpMyAdmin).
2. Execute the schema script located at `database/schema.sql`:

```bash
# Windows PowerShell / CMD:
mysql -u root -p < database/schema.sql

# Or inside MySQL CLI:
source /path/to/Library_Management_System/database/schema.sql;
```

This will automatically create the `library_db` database, configure all tables, primary keys, foreign keys, constraints, and populate realistic seed data.

---

### 3. Backend Setup
1. Navigate into the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Check the `.env` file (copy from `.env.example` if needed):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=library_db
   DB_PORT=3306
   ```
4. Start the backend server:
   ```bash
   npm start
   # or with live reload during development:
   npm run dev
   ```
   You should see:
   ```
   ✅ Successfully connected to MySQL database: library_db
   🚀 Library Management Backend running on http://localhost:5000
   ```

---

### 4. Frontend Setup
1. Open a new terminal window and navigate into the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🌐 REST API Endpoints

### Dashboard
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Aggregated statistics, recent transactions, category breakdown |

### Books
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/books` | List books (supports `?search=...` and `?category=...`) |
| `GET` | `/api/books/categories` | Get all distinct categories |
| `GET` | `/api/books/:id` | Get book details by ID |
| `POST` | `/api/books` | Add new book (`title`, `author`, `isbn`, `category`, `quantity`) |
| `PUT` | `/api/books/:id` | Update book details |
| `DELETE` | `/api/books/:id` | Delete book (safe check: blocks if currently issued) |

### Members
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/members` | List members (supports `?search=...`, includes active issued counts) |
| `GET` | `/api/members/:id` | Get member details and list of active borrowed books |
| `POST` | `/api/members` | Register new member (`name`, `email`, `phone`) |
| `PUT` | `/api/members/:id` | Update member details |
| `DELETE` | `/api/members/:id` | Delete member (safe check: blocks if active unreturned books exist) |

### Book Circulation (Issues & Returns)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/issues` | List issues (supports `?status=issued\|returned` and `?search=...`) |
| `POST` | `/api/issues` | Issue book to member (ACID transaction: decrements inventory) |
| `POST` | `/api/issues/:id/return` | Return issued book (ACID transaction: increments inventory) |

---

## 🔐 Database ACID Transactions in Action

To guarantee data integrity and prevent inventory mismatch:

1. **Issue Operation**:
   ```javascript
   await connection.beginTransaction();
   // 1. Lock book row to prevent race conditions:
   const [book] = await connection.query('SELECT ... FROM books WHERE id = ? FOR UPDATE', [bookId]);
   // 2. Validate available_quantity > 0
   // 3. Decrement available copies:
   await connection.query('UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?', [bookId]);
   // 4. Record the issue:
   await connection.query('INSERT INTO book_issues (...) VALUES (...)');
   await connection.commit();
   ```

2. **Return Operation**:
   ```javascript
   await connection.beginTransaction();
   // 1. Lock issue row:
   const [issue] = await connection.query('SELECT ... FROM book_issues WHERE id = ? FOR UPDATE', [issueId]);
   // 2. Verify status === 'issued'
   // 3. Increment available copies:
   await connection.query('UPDATE books SET available_quantity = LEAST(quantity, available_quantity + 1) WHERE id = ?', [issue.book_id]);
   // 4. Update status and return_date:
   await connection.query('UPDATE book_issues SET return_date = CURDATE(), status = "returned" WHERE id = ?', [issueId]);
   await connection.commit();
   ```

---

## 💡 Beginner FAQ & Tips

1. **How do I verify the database connection?**
   - Visit `http://localhost:5000/api/health` in your browser. It will return `{ "status": "online" }`.
   - The backend terminal will log `✅ Successfully connected to MySQL database: library_db`.

2. **What happens if I try to delete a book that is currently issued?**
   - The backend transaction rejects the request with a descriptive `400 Bad Request`: *"Cannot delete book. It is currently issued to X member(s). Please return all copies first."*

3. **Can a member borrow the same book twice simultaneously?**
   - No, the system checks for active copies of the same book under the same member and prevents accidental double-borrowing.
