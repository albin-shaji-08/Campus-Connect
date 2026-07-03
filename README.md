<div align="center">

# 🎓 CampusConnect 🎟️
**The Ultimate Event Ticket Booking Platform**

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=24&pause=1000&color=2563EB&center=true&vCenter=true&random=false&width=600&lines=Streamline+Event+Management...;Seamless+Ticket+Booking...;Automated+Email+Reminders...;Dynamic+PDF+Generation...)](https://git.io/typing-svg)

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</p>

[**Features**](#-key-features) • [**Tech Stack**](#-tech-stack) • [**Getting Started**](#-getting-started) • [**Credentials**](#-default-credentials)

---

</div>

## ✨ Key Features

<table align="center">
  <tr>
    <td align="center" width="33%">
      <h2 align="center">🔐</h2>
      <b>Multi-Role Auth</b>
      <br />
      Secure login & role-based access for Admins, Organizers & Users
    </td>
    <td align="center" width="33%">
      <h2 align="center">📅</h2>
      <b>Event Management</b>
      <br />
      Organizers can effortlessly create, edit, and launch events
    </td>
    <td align="center" width="33%">
      <h2 align="center">🎟️</h2>
      <b>Seamless Booking</b>
      <br />
      Users can easily browse and book tickets instantly
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <h2 align="center">📄</h2>
      <b>PDF Ticket Generation</b>
      <br />
      Automatic dynamic PDF tickets generated using PDFKit
    </td>
    <td align="center" width="33%">
      <h2 align="center">⏰</h2>
      <b>Automated Reminders</b>
      <br />
      Cron jobs ensure attendees never miss an event
    </td>
    <td align="center" width="33%">
      <h2 align="center">📊</h2>
      <b>Admin Dashboard</b>
      <br />
      Powerful data analytics (Recharts) & CSV export options
    </td>
  </tr>
</table>

<br/>

## 🛠️ Tech Stack

<details open>
<summary><b>🎨 Frontend Magic</b></summary>
<br/>
<ul>
  <li><b>React.js & Vite</b> - Lightning fast framework & build tool</li>
  <li><b>Tailwind CSS</b> - Pixel-perfect utility styling</li>
  <li><b>Framer Motion</b> - Buttery smooth UI transitions and animations</li>
  <li><b>Recharts</b> - Dynamic, interactive data visualization</li>
</ul>
</details>

<details open>
<summary><b>⚙️ Backend Powerhouse</b></summary>
<br/>
<ul>
  <li><b>Node.js & Express</b> - Scalable server architecture</li>
  <li><b>MongoDB & Mongoose</b> - Flexible NoSQL data storage</li>
  <li><b>JWT & Bcrypt</b> - Ironclad security and authentication</li>
  <li><b>Nodemailer & Node-cron</b> - Background tasks and automated emails</li>
  <li><b>PDFKit & json2csv</b> - Document and data generation on the fly</li>
</ul>
</details>

<br/>

## 🚀 Getting Started

Follow these steps to ignite the project locally.

### Prerequisites
> [!NOTE]
> Ensure you have **Node.js (v16+)** installed and a running instance of **MongoDB** (Local or Atlas).

<details>
<summary><b>1️⃣ Backend Setup</b></summary>

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
echo "MONGO_URI=mongodb://localhost:27017/ticket-booking
PORT=5000
JWT_SECRET=your_super_secret_key
FRONTEND_URL=http://localhost:5173" > .env

# Blast off! 🚀
npm run dev
# (or use: npx nodemon index.js)
```
</details>

<details>
<summary><b>2️⃣ Frontend Setup</b></summary>

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
echo "BASE_URL='http://localhost:5000'" > .env

# Start the dev server! ⚡
npm run dev
```
</details>

---

## 🔐 Default Credentials

Jump right in with these test accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| 🛡️ **Admin** | `admin@email.com` | `admin@123` |
| 🎭 **Organizer** | `csclub@email.com` | `password` |
| 🎨 **Organizer** | `artsclub@email.com` | `password` |

---

## 📚 Documentation

Dive deeper into the inner workings of CampusConnect:
- 📧 [Email Verification Setup](./EMAIL_VERIFICATION_SETUP.md)
- 🔔 [Event Reminder System](./EVENT_REMINDER_SYSTEM.md)

---
<div align="center">
  <p>Crafted with ❤️ and code.</p>
  <p>Licensed under the <a href="LICENSE">ISC License</a>.</p>
</div>
