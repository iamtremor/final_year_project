// backend/jobs/scheduler.js

const { 
  registerUnregisteredStudents,
  registerUnregisteredStaff, 
  registerUnregisteredAdmins,
  registerAllUnregisteredUsers 
} = require('./blockchainRegistrationJob');

/**
 * Simple in-memory job scheduler
 * In a production environment, you might want to use a more robust solution
 * like node-cron, agenda, bull, or a separate service like AWS Lambda
 */
class JobScheduler {
  constructor() {
    this.jobs = {};
    this.runningJobs = {};
  }
  
  /**
   * Schedule a job to run at a specific interval
   * @param {string} jobName - Name of the job
   * @param {Function} jobFunction - Function to execute
   * @param {number} intervalMs - Interval in milliseconds
   */
  scheduleJob(jobName, jobFunction, intervalMs) {
    console.log(`Scheduling job: ${jobName} to run every ${intervalMs}ms`);
    
    // Clear any existing job with the same name
    this.clearJob(jobName);
    
    // Create a new interval
    const intervalId = setInterval(async () => {
      // Skip if the job is already running
      if (this.runningJobs[jobName]) {
        console.log(`Job ${jobName} is already running, skipping`);
        return;
      }
      
      // Mark job as running
      this.runningJobs[jobName] = true;
      
      try {
        console.log(`Running job: ${jobName}`);
        await jobFunction();
        console.log(`Job ${jobName} completed successfully`);
      } catch (error) {
        console.error(`Error in job ${jobName}:`, error);
      } finally {
        // Mark job as not running
        this.runningJobs[jobName] = false;
      }
    }, intervalMs);
    
    // Store the interval ID
    this.jobs[jobName] = intervalId;
  }
  
  /**
   * Clear a scheduled job
   * @param {string} jobName - Name of the job to clear
   */
  clearJob(jobName) {
    if (this.jobs[jobName]) {
      clearInterval(this.jobs[jobName]);
      delete this.jobs[jobName];
      console.log(`Cleared job: ${jobName}`);
    }
  }
  
  /**
   * Run a job immediately
   * @param {string} jobName - Name of the job
   * @param {Function} jobFunction - Function to execute
   */
  async runJobNow(jobName, jobFunction) {
    console.log(`Running job now: ${jobName}`);
    
    // Skip if the job is already running
    if (this.runningJobs[jobName]) {
      console.log(`Job ${jobName} is already running, skipping`);
      return;
    }
    
    // Mark job as running
    this.runningJobs[jobName] = true;
    
    try {
      const result = await jobFunction();
      console.log(`Job ${jobName} completed successfully`, result);
      return result;
    } catch (error) {
      console.error(`Error in job ${jobName}:`, error);
      throw error;
    } finally {
      // Mark job as not running
      this.runningJobs[jobName] = false;
    }
  }
}

// Create a scheduler instance
const scheduler = new JobScheduler();

// Initialize the scheduled jobs
function initializeJobs() {
  // Schedule the student registration job to run every hour
  scheduler.scheduleJob('registerUnregisteredStudents', registerUnregisteredStudents, 60 * 60 * 1000);
  
  // Schedule the staff registration job to run every hour
  scheduler.scheduleJob('registerUnregisteredStaff', registerUnregisteredStaff, 60 * 60 * 1000);
  
  // Schedule the admin registration job to run every hour
  scheduler.scheduleJob('registerUnregisteredAdmins', registerUnregisteredAdmins, 60 * 60 * 1000);
  
  // Optional: Schedule a combined job to run all registrations
  // scheduler.scheduleJob('registerAllUnregisteredUsers', registerAllUnregisteredUsers, 2 * 60 * 60 * 1000);
}

module.exports = {
  scheduler,
  initializeJobs
};