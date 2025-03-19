// update-user-department.js
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string - replace with your actual connection string
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://final_year_project_user:Thefireisnotsohot22@cluster0.qo6sc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Define the User schema to match your existing model
const UserSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  role: String,
  applicationId: String,
  phoneNumber: String,
  department: String,
  dateOfBirth: Date,
  blockchainRegistrationStatus: String
});

const User = mongoose.model('User', UserSchema);

async function updateUserDepartment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    // Find and update the user
    const userId = "67d5283299ec9c11957aefaa";
    const newDepartment = "HOD"; // Set this to match your School Officer's department
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { department: newDepartment },
      { new: true } // Return the updated document
    );
    
    if (updatedUser) {
      console.log('User updated successfully:');
      console.log({
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        department: updatedUser.department
      });
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the update function
updateUserDepartment();