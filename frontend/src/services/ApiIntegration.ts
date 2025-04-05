import demoService from './DemoService';

/**
 * API Integration service for OpenADR
 * Simplified for the demo
 */
class ApiIntegration {
  /**
   * Get all active OpenADR events
   */
  async getActiveEvents(): Promise<any[]> {
    try {
      // Get events from demo service
      return demoService.getEvents();
    } catch (error) {
      console.error('Error fetching active events:', error);
      return [];
    }
  }
  
  /**
   * Submit a load reduction report
   * @param eventTxid - Event transaction ID
   * @param eventOutputIndex - Event output index
   * @param reductionPercentage - Percentage of load reduction
   */
  async submitLoadReductionReport(
    eventTxid: string,
    eventOutputIndex: number,
    reductionPercentage: number
  ): Promise<boolean> {
    try {
      return await demoService.submitLoadReductionReport(
        eventTxid,
        eventOutputIndex,
        reductionPercentage
      );
    } catch (error) {
      console.error('Error submitting load reduction report:', error);
      return false;
    }
  }
  
  /**
   * Get event details
   * @param txid - Transaction ID
   * @param outputIndex - Output index
   */
  async getEventDetails(txid: string, outputIndex: number): Promise<any> {
    try {
      // Find event in our local registry
      const events = demoService.getEvents();
      const event = events.find(e => 
        e.txid === txid && e.outputIndex === outputIndex
      );
      
      if (!event) {
        throw new Error(`Event not found: ${txid}-${outputIndex}`);
      }
      
      return event;
    } catch (error) {
      console.error('Error fetching event details:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiIntegration = new ApiIntegration();
export default apiIntegration;