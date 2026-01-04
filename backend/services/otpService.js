class OTPService {
    constructor() {
      this.otpStore = new Map();
    }
  
    generateOTP() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  
    storeOTP(email, otp) {
      this.otpStore.set(email, {
        otp,
        timestamp: Date.now()
      });
  
      // Auto-expire after 15 minutes
      setTimeout(() => {
        this.otpStore.delete(email);
      }, 15 * 60 * 1000);
    }
  
    verifyOTP(email, otp) {
      const storedData = this.otpStore.get(email);
      
      if (!storedData) {
        return false;
      }
  
      // Check if OTP has expired (15 minutes)
      if (Date.now() - storedData.timestamp > 15 * 60 * 1000) {
        this.otpStore.delete(email);
        return false;
      }
  
      // Verify OTP
      const isValid = storedData.otp === otp;
      if (isValid) {
        this.otpStore.delete(email);
      }
      return isValid;
    }
  }
  
  export const otpService = new OTPService();