import api from '../api';

// Speed Monitoring API Service
export const speedMonitoringService = {
  /**
   * Get speed monitoring data for entry or verification
   * @param {Object} params - Query parameters
   * @param {string} params.year - Year (e.g., "2025")
   * @param {string} params.month - Month (e.g., "1" or "02")
   * @param {string} params.type - Type ("entry" or "verification")
   * @returns {Promise} API response
   */
  getSpeedMonitoring: async ({ year, month, type }: { 
    year: string; 
    month: string; 
    type: 'entry' | 'verification' 
  }) => {
    const response = await api.get('/speed-monitoring', {
      params: { year, month, type }
    });
    return response.data;
  },

  /**
   * Get speed monitoring data for current month
   * @param {string} type - Type ("entry" or "verification")
   * @returns {Promise} API response
   */
  getCurrentMonthSpeedMonitoring: async (type: 'entry' | 'verification') => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString();
    
    const response = await api.get('/speed-monitoring', {
      params: { year, month, type }
    });
    return response.data;
  }
};