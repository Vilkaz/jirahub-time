// Environment configuration - NO hardcoded values
export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
  
  // Okta Authentication
  OKTA_DOMAIN: import.meta.env.VITE_OKTA_DOMAIN || 'dev-123456.okta.com',
  OKTA_CLIENT_ID: import.meta.env.VITE_OKTA_CLIENT_ID || 'your-client-id',
  
  // Jira Integration
  JIRA_INSTANCE_URL: import.meta.env.VITE_JIRA_INSTANCE_URL || 'https://company.atlassian.net',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Work Assistant',
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
  
  // Feature Flags
  ENABLE_DARK_MODE: import.meta.env.VITE_ENABLE_DARK_MODE === 'true',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // Polling Intervals (in milliseconds)
  STATUS_POLL_INTERVAL: parseInt(import.meta.env.VITE_STATUS_POLL_INTERVAL || '30000'),
  TIMER_UPDATE_INTERVAL: parseInt(import.meta.env.VITE_TIMER_UPDATE_INTERVAL || '1000'),
} as const;

// Validation
export const validateConfig = () => {
  const requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_OKTA_DOMAIN', 
    'VITE_OKTA_CLIENT_ID',
    'VITE_JIRA_INSTANCE_URL'
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
    console.warn('Using default values. Configure these for production use.');
  }
};

// Export for debugging in development
if (config.ENVIRONMENT === 'development') {
  console.log('🔧 App Configuration:', config);
}