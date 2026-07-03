# CampusConnect - Event Ticket Booking Platform

![CampusConnect Banner](https://via.placeholder.com/1200x400.png?text=CampusConnect+-+Event+Ticket+Booking+Platform)

**CampusConnect** is a comprehensive, full-stack event ticket booking platform designed to streamline event management and ticketing for educational institutions and organizations. The platform features secure authentication, dynamic event creation, automated email reminders, and PDF ticket generation.

## 🚀 Features

- **Multi-Role Authentication**: Secure login and role-based access control for Admins, Organizers (e.g., CS Club, Arts Club), and Users.
- **Event Management**: Organizers can create, edit, and manage events, including banner uploads and event details.
- **Ticket Booking System**: Users can browse events, book tickets, and receive confirmation.
- **PDF Ticket Generation**: Automatically generates downloadable PDF tickets for registered events.
- **Automated Reminders**: Built-in cron jobs send automated email reminders to attendees before events.
- **Email Verification**: Ensures user authenticity through email verification during sign-up.
- **Admin Dashboard**: Comprehensive dashboard with analytics using Recharts and data export capabilities (CSV).
- **Responsive UI**: Modern, animated, and fully responsive frontend built with React and Tailwind CSS.

## 🛠️ Technology Stack

### Frontend
- **React.js (Vite)**: Fast and modern frontend framework.
- **Tailwind CSS**: Utility-first CSS framework for rapid styling.
- **Framer Motion**: For fluid animations and transitions.
- **Recharts**: For rendering data visualizations and charts in the admin dashboard.
- **React Router DOM**: Client-side routing.
- **Axios**: HTTP client for API requests.

### Backend
- **Node.js & Express.js**: Robust backend server environment.
- **MongoDB & Mongoose**: NoSQL database and object data modeling.
- **JSON Web Tokens (JWT)**: Secure stateless authentication.
- **Bcrypt.js**: Password hashing and security.
- **Nodemailer**: For sending verification emails and event reminders.
- **Node-cron**: Task scheduling for automated event reminders.
- **PDFKit**: For generating dynamic PDF tickets.
- **Multer**: Middleware for handling multipart/form-data, primarily used for file/image uploads.

## ⚙️ Getting Started

Follow these steps to run the project locally.

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB (Local instance or MongoDB Atlas)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder and configure your environment variables:
   ```env
   MONGO_URI=mongodb://localhost:27017/ticket-booking
   PORT=5000
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the backend server:
   ```bash
   npm start
   # or for development: npm run dev (if configured) or npx nodemon index.js
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder:
   ```env
   BASE_URL='http://localhost:5000'
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 🔒 Default Credentials

You can use the following credentials to test the platform:

**Admin Account:**
- **Email:** `admin@email.com`
- **Password:** `admin@123`

**Organizer Accounts:**
- **Email:** `csclub@email.com` | **Password:** `password`
- **Email:** `artsclub@email.com` | **Password:** `password`

## 📚 Documentation

For more detailed information on specific subsystems, please refer to the following documentation files included in the project:
- [Email Verification Setup](./EMAIL_VERIFICATION_SETUP.md)
- [Event Reminder System](./EVENT_REMINDER_SYSTEM.md)

## 📄 License

This project is licensed under the [ISC License](LICENSE).
