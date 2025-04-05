import { WalletClient } from '@bsv/sdk'
import { SHIPBroadcaster } from '@bsv/sdk'
import { Transaction } from '@bsv/sdk'
import { OpenADRContract } from './backend/src/contracts/OpenADR'
import { VENClient } from './VENClient'
import { ByteString, toByteString } from 'scrypt-ts'
import openADRContractJson from './backend/artifacts/OpenADR.json'

// Load sCrypt artifact
OpenADRContract.loadArtifact(openADRContractJson)

/**
 * Demo application for OpenADR on BSV
 * Shows how to create and respond to demand response events
 */
class DemoApp {
  private venClient: VENClient | null = null
  private vtnBaseUrl: string = 'http://localhost:8080'
  private programID: string = 'residential-demand-response'
  private wallet: WalletClient
  private events: any[] = []
  
  /**
   * Constructor
   */
  constructor() {
    // Create a wallet client
    this.wallet = new WalletClient()
  }
  
  /**
   * Initialize the demo application
   */
  async initialize(): Promise<void> {
    console.log('Initializing OpenADR BSV Demo')
    
    try {
      // Generate a VEN ID
      const venID = `VEN-${Date.now().toString(36)}`
      
      // Create VEN client
      this.venClient = new VENClient(
        this.wallet,
        venID,
        this.programID,
        this.vtnBaseUrl
      )
      
      console.log('Demo application initialized')
      
      // Create a demo event
      await this.createDemoEvent()
      
      return Promise.resolve()
    } catch (error) {
      console.error('Error initializing demo:', error)
      return Promise.reject(error)
    }
  }
  
  /**
   * Create a demo OpenADR event on the BSV blockchain
   */
  async createDemoEvent(): Promise<void> {
    try {
      console.log('Creating demo OpenADR event')
      
      // Create an instance of the OpenADR contract
      const eventType = toByteString('SIMPLE')
      const programID = toByteString(this.programID)
      const startTime = BigInt(Math.floor(Date.now() / 1000))
      const duration = BigInt(3600) // 1 hour
      
      // Create a payload for a simple event
      const payload = toByteString(
        JSON.stringify({
          level: 2, // Level 2 event (medium load shed)
          reason: 'Peak demand forecast',
          minimumReduction: 10, // Minimum percentage reduction
          targetReduction: 20, // Target percentage reduction
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
      
      // For the demo, we'll simulate a successful broadcast
      const mockTxid = '2097dfd76851bf465e8f715593b217714858bbe9570ff3bd5e33840a34e20ff0'
      
      // Store the event for retrieval
      this.events.push({
        txid: mockTxid,
        outputIndex: 0,
        eventType: eventType.toString(),
        programID: programID.toString(), 
        startTime: Number(startTime),
        duration: Number(duration),
        payload: payload.toString(),
        status: 'active',
        createdAt: new Date()
      })
      
      console.log('Event successfully created')
      console.log(`Transaction ID: ${mockTxid}`)
      
      // Simulate the VEN receiving and processing the event
      console.log('VEN processing the event...')
      
      // Make sure the VEN client has been initialized
      if (this.venClient) {
        setTimeout(() => {
          this.venClient!.handleSimpleEvent({
            txid: mockTxid,
            outputIndex: 0,
            eventType: 'SIMPLE',
            programID: this.programID,
            startTime: Number(startTime),
            duration: Number(duration),
            payload: JSON.stringify({
              level: 2,
              reason: 'Peak demand forecast'
            })
          })
        }, 5000)
      }
    } catch (error) {
      console.error('Error creating demo event:', error)
    }
  }
  
  /**
   * Get all events created in the demo
   */
  getEvents(): any[] {
    return this.events
  }
  
  /**
   * Submit a load reduction report for a specific event
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
      if (!this.venClient) {
        console.log('VEN client not initialized, creating a temporary client')
        
        // Create a temporary VEN client for submission
        const tempVenClient = new VENClient(
          this.wallet,
          `VEN-TEMP-${Date.now().toString(36)}`,
          this.programID,
          this.vtnBaseUrl
        )
        
        // Submit the report
        await tempVenClient.submitLoadReductionReport(
          eventTxid,
          eventOutputIndex,
          reductionPercentage
        )
      } else {
        // Use the existing VEN client
        await this.venClient.submitLoadReductionReport(
          eventTxid,
          eventOutputIndex,
          reductionPercentage
        )
      }
      
      console.log(`Report submitted: ${reductionPercentage}% reduction`)
      return true
    } catch (error) {
      console.error('Error submitting load reduction report:', error)
      return false
    }
  }
}

// Create singleton instance for use in the frontend
const demoApp = new DemoApp()

export default demoApp