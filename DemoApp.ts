import { WalletClient } from '@bsv/sdk'
import { VENClient } from './VENClient'
import { OpenADRContract } from './backend/src/contracts/OpenADR'
import { SHIPBroadcaster } from '@bsv/sdk'
import { Utils } from '@bsv/sdk'
import { ByteString, toByteString } from 'scrypt-ts'
/**
 * Demo application for OpenADR on BSV
 * Shows how to create and respond to demand response events
 */
class DemoApp {
  private venClient: VENClient | null = null
  private vtnBaseUrl: string = 'http://localhost:8080'
  private programID: string = 'residential-demand-response'
  
  /**
   * Initialize the demo application
   */
  async initialize(): Promise<void> {
    console.log('Initializing OpenADR BSV Demo')
    
    try {
      // Create a wallet client
      const wallet = new WalletClient()
      
      // Generate a VEN ID
      const venID = `VEN-${Date.now().toString(36)}`
      
      // Create VEN client
      this.venClient = new VENClient(
        wallet,
        venID,
        this.programID,
        this.vtnBaseUrl
      )
      
      // Initialize VEN client
      await this.venClient.initialize()
      
      console.log('Demo application initialized')
      
      // Simulate creating an event
      await this.createDemoEvent()
    } catch (error) {
      console.error('Error initializing demo:', error)
    }
  }
  
  /**
   * Create a demo OpenADR event on the BSV blockchain
   */
  async createDemoEvent(): Promise<void> {
    try {
      console.log('Creating demo OpenADR event')
      
      // Create a wallet for the VTN
      const wallet = new WalletClient()
      
      // Create an instance of the OpenADR contract
      const eventType = toByteString('SIMPLE')
      const programID = toByteString(this.programID,)
      const startTime = BigInt(Math.floor(Date.now() / 1000))
      const duration = BigInt(3600) // 1 hour
      const priority = BigInt(0) // Highest priority
      
      // Create a payload for a simple event
      const payload = toByteString(
        JSON.stringify({
          level: 2, // Level 2 event (medium load shed)
          reason: 'Peak demand forecast'
        }),
      )
      
      // Create the contract instance
      const openADR = new OpenADRContract(
        eventType,
        programID,
        startTime,
        duration,
        payload
      )
      
      // Lock the contract with appropriate funds
      // In a real implementation, we would create a proper transaction here
      // using the wallet to sign it
      console.log('Contract created, broadcasting to BSV network...')
      
      // Create a SHIP broadcaster to send to the overlay
      const broadcaster = new SHIPBroadcaster(['tm_openADR'])
      
      // This is simplified - in a real implementation we would:
      // 1. Create a proper transaction
      // 2. Sign it with the wallet
      // 3. Broadcast it to the overlay
      
      // For the demo, we'll simulate a successful broadcast
      console.log('Event successfully broadcasted to overlay')
      
      // Simulate the VEN receiving and processing the event
      console.log('Simulating VEN processing the event...')
      setTimeout(() => {
        console.log('VEN processed the event and took appropriate action')
      }, 5000)
    } catch (error) {
      console.error('Error creating demo event:', error)
    }
  }
}

// Start the demo when run directly
if (require.main === module) {
  const demo = new DemoApp()
  demo.initialize().catch(console.error)
}

export default DemoApp