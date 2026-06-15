🚀 LinkPulse – Smart URL Shortener & Analytics Platform

A modern full-stack SaaS URL shortening platform with real-time analytics, QR generation, custom aliases, and secure JWT authentication. Built with React, Node.js, Express, and MongoDB.

🌐 Live Demo
Frontend

🔗 https://url-shortener-bl1x.onrender.com

Backend API

🔗 https://linkpulse-backend-954s.onrender.com

Youtube link
https://youtu.be/ls9ZMF_fBNI?feature=shared


📖 Table of Contents
Overview
Features
Tech Stack
Architecture
Project Structure
Screenshots
Installation
Environment Variables
API Reference
Authentication Flow
Security Features
Deployment
Future Enhancements
Contributing
License

🌟 Overview

LinkPulse is a production-ready URL shortening and analytics platform that enables users to:

✅ Create short URLs

✅ Track clicks in real time

✅ Analyze visitor behavior

✅ Generate QR codes

✅ Monitor performance through a modern analytics dashboard

Designed for developers, marketers, startups, and businesses needing detailed link performance insights.

✨ Key Features
🔗 URL Management
Short URL generation using NanoID
Custom branded aliases
Expiry date support
Active / Inactive toggle
Favourite links
QR code generation
Bulk operations

📊 Real-Time Analytics
Click tracking
Unique visitor tracking
Country analytics
Device analytics
Browser analytics
Click trend charts
Top performing links
Recent activity feed

📈 Dashboard
Total Clicks
Total Links
Active Links
Favourite Links
Interactive Charts
Recharts Data Visualization
Auto Refresh Support
Glassmorphism UI

🔐 Authentication
JWT Authentication
Secure Login & Registration
Remember Me Support
Protected Routes
Password Hashing (bcrypt)

🛡 Security
Helmet.js
Rate Limiting
CORS Protection
NoSQL Injection Prevention
Input Validation
Structured Logging

🛠 Tech Stack
Frontend
Technology	Purpose
React 19	UI Development
Vite	Build Tool
Tailwind CSS v4	Styling
Framer Motion	Animations
Recharts	Analytics Charts
React Router DOM	Routing
Axios	API Calls

Backend
Technology	Purpose
Node.js	Runtime
Express.js	REST API
MongoDB	Database
Mongoose	ODM
JWT	Authentication
bcryptjs	Password Security
NanoID	URL Generation
Winston	Logging

🏗 Architecture

┌─────────────────────┐

│      Frontend       │

│ React + Vite        │

└─────────┬───────────┘

          │ HTTPS
          
          ▼
          
┌─────────────────────┐

│     Express API     │

│ Auth │ Links │ Stats│

└─────────┬───────────┘

          │
          
          ▼
          
┌─────────────────────┐

│      MongoDB        │

│ Users │ Links │ Visits

└─────────────────────┘


📂 Project Structure

linkpulse/

│

├── frontend/

│   ├── src/

│   ├── components/

│   ├── pages/

│   └── services/

│

├── backend/

│   ├── src/

│   ├── controllers/

│   ├── middleware/

│   ├── routes/

│   ├── models/

│   └── config/


│
└── README.md

📸 Screenshots

Dashboard

https://drive.google.com/file/d/11qTWeQztGX2gcATyXTdn5ewRE3GSNwqH/view?usp=drive_link

Links Management

https://drive.google.com/file/d/1WdaHvLBiJrRRjWwzoMwhIbfjcU7-JHGe/view?usp=drive_link

Analytics

https://drive.google.com/file/d/1J52tcXDaQRckfnpP6MbxRoL2iIg6YpcZ/view?usp=drive_link

https://drive.google.com/file/d/1Leiz51vKVe7u18CuVDYFpQ5EzJ4xq3GZ/view?usp=drive_link

New Link

https://drive.google.com/file/d/12M6tkZTN8AOk5Zjkgu-oHdhU52OT2WkU/view?usp=drive_link

🚀 Installation
Clone Repository
git clone https://github.com/yourusername/linkpulse.git

cd linkpulse

Backend Setup
cd backend

npm install

npm run dev

Backend:

http://localhost:5000

Frontend Setup
cd frontend

npm install

npm run dev

Frontend:

http://localhost:3000

🔧 Environment Variables

Backend
PORT=5000

MONGODB_URI=your_mongodb_uri

JWT_SECRET=your_secret

JWT_EXPIRES_IN=7d

BASE_URL=http://localhost:5000

FRONTEND_URL=http://localhost:3000

Frontend
VITE_API_URL=http://localhost:5000/api

📡 API Endpoints
Authentication

Method	Endpoint
POST	/api/auth/signup
POST	/api/auth/login
GET	/api/auth/me

Links

Method	Endpoint
GET	/api/links
POST	/api/links
PUT	/api/links/:id
DELETE	/api/links/:id

Analytics

Method	Endpoint
GET	/api/analytics/:linkId

🔐 Authentication Flow
User Login
    │
    ▼
Generate JWT
    │
    ▼
Store in LocalStorage
    │
    ▼
Send Bearer Token
    │
    ▼
Protected API Access

🛡 Security Features
Feature	Description
JWT Authentication	Secure API Access
Helmet.js	Security Headers
Rate Limiting	DDoS Protection
Input Validation	Secure Inputs
Mongo Sanitize	NoSQL Protection
bcrypt	Password Encryption

☁ Deployment
Frontend

Render
Netlify
Vercel

Backend

Render Web Service

Database
MongoDB Atlas

🔮 Future Enhancements
Team Collaboration
Custom Domains
Advanced Analytics
AI Traffic Insights

🤝 Contributing
git checkout -b feature/new-feature

git commit -m "feat: add new feature"

git push origin feature/new-feature

Create a Pull Request 🚀

Demo Video Duration explanation

DEMO VIDEO LINK:

LinkPulse Project Demo Script

0:00 – 0:20 | Project Introduction

Hello everyone.
Today, I am going to demonstrate LinkPulse, an AI-powered smart link management platform. LinkPulse helps users create, manage, track, and analyze shortened URLs with real-time analytics and performance insights. The platform is designed to provide an efficient and user-friendly experience for link management and audience tracking.

0:20 – 0:30 | Opening the Deployed Application

Now, let me open the deployed application. This is the live version of LinkPulse, hosted online and accessible from anywhere.

0:30 – 1:40 | Login Page Explanation

This is the Login page of LinkPulse.

Users can securely sign in using their registered credentials. The authentication system validates user information and ensures secure access to personal data and analytics.

The interface is designed to be simple, responsive, and easy to use. Once the user logs in successfully, they are redirected to the main dashboard where all link management features are available.

1:40 – 2:41 | Dashboard Explanation

This is the Dashboard section.

The dashboard provides a complete overview of the user's activity. Here, users can view:

- Total links created
- Total clicks received
- Recent link activity
- Performance statistics
- Quick access to important features

The dashboard helps users monitor their link performance at a glance and make data-driven decisions.

2:41 – 3:41 | My Links Page

Next, we have the My Links page.

This section displays all the shortened links created by the user. Users can:

- View existing links
- Copy shortened URLs
- Manage link information
- Track individual link performance

This page serves as the central location for managing all generated links efficiently.

3:43 – 3:55 | Analytics Page

This is the Analytics section.

Here, users can analyze link performance through visual statistics and metrics. The analytics provide valuable insights into user engagement, helping users understand how their links are performing over time.

4:05 – 6:40 | Live Example – YouTube Link Shortening

Now, I will demonstrate a real-world example using my YouTube channel link, "VJ Siddu Vlogs."

First, I copy the original YouTube URL and paste it into the link creation form.

After submitting the URL, LinkPulse generates a unique shortened link instantly.

Next, I open the shortened URL to verify that it correctly redirects users to the intended YouTube channel.

As users access the link, the platform automatically tracks clicks and updates analytics in real time. This demonstrates how LinkPulse can be used to simplify long URLs while collecting valuable engagement data.

6:40 – 8:00 | Code Explanation

Finally, let me briefly explain the technical implementation.

The project follows a modern full-stack architecture consisting of:

- Frontend for user interaction and responsive UI
- Backend APIs for business logic and data processing
- Authentication system for secure user access
- Database for storing links and analytics data

The backend handles URL generation, click tracking, and analytics processing, while the frontend provides an intuitive interface for users to manage and monitor their links.

This architecture ensures scalability, maintainability, and a smooth user experience.

Thank you for watching the demonstration of LinkPulse.

📄 License

Licensed under the MIT License.

👨‍💻 Author

Muralidharan

Built with ❤️ using React, Node.js, Express, and MongoDB.
