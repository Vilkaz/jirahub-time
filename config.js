// Work Assistant - Frontend Configuration
// Generated automatically by deployment script

window.CONFIG = {
    API_BASE_URL: 'https://8woyezkzac.execute-api.eu-central-1.amazonaws.com',
    API_VERSION: 'v1',
    APP_NAME: 'Work Assistant',
    TIMER_UPDATE_INTERVAL: 1000,
    TOAST_DURATION: 5000,
    AUTO_REFRESH_INTERVAL: 300000,
    DEBUG: true
};

window.CONFIG.getApiUrl = function(endpoint) {
    return `${this.API_BASE_URL}/${this.API_VERSION}${endpoint}`;
};
