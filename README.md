# backend-1.0
Backend using ExpressJS and MongoDB


## ⚙️ Setup Instructions
# Install dependencies
npm install

# Create .env file (Mac/Linux)
touch .env

# OR (Windows PowerShell)
New-Item .env -ItemType File

# Then edit .env manually to add:
# MONGODB_URI=your-mongodb-uri --> in discord channel (updated)
# PORT=5000

# Start the server (customer command to build and run)
npm run build-and-run


# test
Visit http://localhost:5000 to test. 


## 🗄️ Database
Whenever you make changes to the model, remember to restart the server for the changes to take effect. You can do this by stopping the server and then running the following command again:

npm run build-and-run

### Useful Tips
- Always check your MongoDB connection string in the .env file to ensure it's correct.