Renshuu API (Backend)

The backend server for Renshuu, an AI-powered spaced repetition flashcard application. This API handles user authentication, data persistence (Decks/Cards), media storage (AWS S3), and AI content generation (OpenAI).

🛠️ Tech Stack

Runtime: Node.js

Framework: Express.js

Database: MongoDB Atlas (Mongoose)

Storage: AWS S3 (for card images and audio)

AI: OpenAI API (GPT-4 for text, DALL-E 3 for images)

Authentication: JWT (Stateless)

Documentation: Swagger UI

🚀 Getting Started

Prerequisites

Node.js (v18+)

MongoDB Atlas Account

AWS Account (S3 Bucket)

OpenAI API Key

Installation

Clone the repository:

git clone [https://github.com/yourusername/renshuu-backend.git](https://github.com/yourusername/renshuu-backend.git)
cd renshuu-backend


Install dependencies:

npm install


Environment Configuration:
Create a .env file in the root directory and add the following variables:

# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/renshuu?retryWrites=true&w=majority

# Security
SECRET_KEY=your_super_secret_jwt_key

# AWS S3 (Media Storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-southeast-2
S3_BUCKET_NAME=my-renshuu-bucket

# OpenAI (AI Generation)
OPENAI_API_KEY=sk-...

# Email Service (Password Reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:5173 


Run the server:

# Development (with nodemon)
npm run dev

# Production
npm start


📚 API Documentation

This project uses Swagger for API documentation.
Once the server is running, visit:

http://localhost:5000/api-docs

🧠 Key Features

SM-2 Algorithm: Implements a modified SuperMemo-2 algorithm for spacing reviews based on user ratings (Again, Hard, Good, Easy).

AI Generation: Generates context sentences and images automatically based on the front of a flashcard.

Secure Auth: Stateless JWT authentication with password hashing (bcrypt).
