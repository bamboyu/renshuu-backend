# **Renshuu API (Backend)**

The backend server for **Renshuu**, an AI-powered spaced repetition flashcard application. This API handles user authentication, data persistence, media storage, and AI content generation.

**🔗 Live API Documentation:** [https://renshuu-backend.onrender.com/api-docs/\#/](https://renshuu-backend.onrender.com/api-docs/#/)

## **🛠️ Tech Stack**

* **Runtime:** Node.js  
* **Framework:** Express.js  
* **Database:** MongoDB Atlas (Mongoose)  
* **Storage:** AWS S3 (Card images and audio)  
* **AI:** OpenAI API (GPT-4 for definitions, DALL-E 3 for images)  
* **Authentication:** Stateless JWT (JSON Web Tokens)  
* **Documentation:** Swagger / OpenAPI

## **🚀 Getting Started**

### **Prerequisites**

* Node.js (v18+)  
* MongoDB Atlas Connection String  
* AWS S3 Bucket Credentials  
* OpenAI API Key

### **Installation**

1. **Clone the repository:**  
   git clone https://github.com/bamboyu/renshuu-backend

2. **Install dependencies:**  
   npm install

3. Environment Configuration:  
   Create a .env file in the root directory:  
   \# App Settings  
   PORT=5000  
   NODE\_ENV=development

   \# Database  
   MONGO\_URI=mongodb+srv://\<user\>:\<password\>@cluster.mongodb.net/renshuu?retryWrites=true\&w=majority

   \# Security  
   SECRET\_KEY=your\_super\_secret\_jwt\_key

   \# AWS S3 (Media Storage)  
   AWS\_ACCESS\_KEY\_ID=your\_aws\_key  
   AWS\_SECRET\_ACCESS\_KEY=your\_aws\_secret  
   AWS\_REGION=ap-southeast-2  
   S3\_BUCKET\_NAME=your-bucket-name

   \# OpenAI (AI Content)  
   OPENAI\_API\_KEY=sk-...

   \# Email Service (Password Reset)  
   EMAIL\_USER=your-email@gmail.com  
   EMAIL\_PASS=your\_app\_password  
   CLIENT\_URL=\[https://renshuu-virid.vercel.app\](https://renshuu-virid.vercel.app)

4. **Run the server:**  
   \# Development mode  
   npm run dev

   \# Production mode  
   npm start

## **📚 API Endpoints**

Full documentation is available via Swagger UI at /api-docs.

* **Auth:** /api/auth (Login, Signup, Reset Password)  
* **Decks:** /api/deck (Create, List, Update, Delete)  
* **Cards:** /api/card (CRUD, S3 Uploads)  
* **Study:** /api/study (SM-2 Algorithm, Next Card, Submit Review)  
* **Generate:** /api/generate (AI Text & Image Generation)

## **☁️ Deployment**

This API is deployed on **Render**.

1. Push code to GitHub.  
2. Create a new Web Service on Render.  
3. Add all Environment Variables from .env to the Render Dashboard.  
4. **Note:** The Swagger docs automatically adapt to the RENDER\_EXTERNAL\_URL.
