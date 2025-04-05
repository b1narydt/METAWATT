import { WalletClient, AuthFetch, LookupResolver } from '@bsv/sdk'
import { Transaction } from '@bsv/sdk'
import { OpenADRContract } from './backend/src/contracts/OpenADR'

/**
 * OpenADR VEN (Virtual End Node) client
 * Uses BRC-100 wallet to interact with the overlay service
 */
export class VENClient {
  private authFetch: AuthFetch
  private lookupResolver: LookupResolver
  private programID: string
  private venID: string
  private vtnBaseUrl: string
  private eventHandlers: Map<string, (event: any) => void> = new Map()
  
  /**
   * Constructor
   * @param wallet - BRC-100 wallet client
   * @param venID - VEN identifier
   * @param programID - Program ID to subscribe to
   * @param vtnBaseUrl - Base URL of the VTN (Overlay Service)
   */
  constructor(
    private wallet: WalletClient,
    venID: string,
    programID: string,
    vtnBaseUrl: string
  ) {
    this.authFetch = new AuthFetch(wallet)
    this.lookupResolver = new LookupResolver()
    this.venID = venID
    this.programID = programID
    this.vtnBaseUrl = vtnBaseUrl
  }
  
  /**
   * Initialize the VEN
   * - Sets up subscriptions to receive events
   */
  async initialize(): Promise<void> {
    // Register with the VTN
    await this.registerVEN()
    
    // Set up subscription for events
    await this.setupSubscription()
    
    console.log(`VEN ${this.venID} initialized for program ${this.programID}`)
  }
  
  /**
   * Register the VEN with the VTN
   */
  private async registerVEN(): Promise<void> {
    try {
      const response = await this.authFetch.fetch(`${this.vtnBaseUrl}/vens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          venName: this.venID,
          targets: [
            {
              type: 'PROGRAM_NAME',
              values: [this.programID]
            }
          ]
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to register VEN: ${response.statusText}`)
      }
      
      console.log('VEN registered successfully')
    } catch (error) {
      console.error('Error registering VEN:', error)
      throw error
    }
  }
  
  /**
   * Set up subscription for events
   */
  private async setupSubscription(): Promise<void> {
    try {
      // In a real implementation, we would set up a webhook
      // For simplicity in the hackathon, we'll use polling
      this.startPolling()
    } catch (error) {
      console.error('Error setting up subscription:', error)
      throw error
    }
  }
  
  /**
   * Start polling for events
   */
  private startPolling(): void {
    setInterval(async () => {
      try {
        await this.pollEvents()
      } catch (error) {
        console.error('Error polling events:', error)
      }
    }, 10000) // Poll every 10 seconds
  }
  
  /**
   * Poll for active events
   */
  private async pollEvents(): Promise<void> {
    try {
      // Query the lookup service for active events
      const query = {
        service: 'ls_openADR',
        query: {
          programID: this.programID,
          active: true
        }
      }
      
      const result = await this.lookupResolver.query(query)
      
      if (result) {
        // Check the result type and structure
        if ('result' in result && Array.isArray(result.result)) {
          // Process each event
          for (const output of result.result) {
            await this.processEvent(output);
          }
        } else if (Array.isArray(result)) {
          // Direct array result
          for (const output of result) {
            await this.processEvent(output);
          }
        }
      }
    } catch (error) {
      console.error('Error polling events:', error)
      throw error
    }
  }
  
  /**
   * Process an event
   * @param output - UTXO output reference
   */
  private async processEvent(output: any): Promise<void> {
    try {
      // Convert BEEF to transaction
      const tx = Transaction.fromBEEF(output.beef)
      
      // Extract script from specified output
      const script = tx.outputs[output.outputIndex].lockingScript.toHex()
      
      // Parse OpenADR contract from script
      const openADR = OpenADRContract.fromLockingScript(script) as OpenADRContract
      
      // Create event object from contract data
      const event = {
        txid: output.txid,
        outputIndex: output.outputIndex,
        eventType: openADR.eventType.toString(),
        programID: openADR.programID.toString(),
        startTime: Number(openADR.startTime),
        duration: Number(openADR.duration),
        payload: openADR.payload.toString()
      }
      
      // Check if we've already processed this event
      const eventKey = `${event.txid}-${event.outputIndex}`
      if (this.eventHandlers.has(eventKey)) {
        // Already processed
        return
      }
      
      console.log(`Processing new event: ${event.eventType}`)
      
      // Dispatch the event to registered handlers
      this.dispatchEvent(event)
      
      // Mark event as processed
      this.eventHandlers.set(eventKey, () => {})
    } catch (error) {
      console.error('Error processing event:', error)
      throw error
    }
  }
  
  /**
   * Dispatch event to handlers
   * @param event - OpenADR event data
   */
  private dispatchEvent(event: any): void {
    console.log(`Dispatching event: ${JSON.stringify(event)}`)
    
    // Handle different event types
    switch (event.eventType) {
      case 'SIMPLE':
        this.handleSimpleEvent(event)
        break
      case 'PRICE':
        this.handlePriceEvent(event)
        break
      default:
        console.log(`Unhandled event type: ${event.eventType}`)
    }
  }
  
  /**
   * Handle a SIMPLE event
   * @param event - OpenADR event data
   */
  private handleSimpleEvent(event: any): void {
    const payload = JSON.parse(event.payload)
    const level = payload.level
    
    console.log(`Received SIMPLE event with level ${level}`)
    
    // Implement event handling logic
    // For demo purposes, we'll just send a report
    this.sendEventReport(event.txid, event.outputIndex, 'SIMPLE_LEVEL', level.toString())
  }
  
  /**
   * Handle a PRICE event
   * @param event - OpenADR event data
   */
  private handlePriceEvent(event: any): void {
    const payload = JSON.parse(event.payload)
    const price = payload.price
    
    console.log(`Received PRICE event with price ${price}`)
    
    // Implement event handling logic
    // For demo purposes, we'll just send a report
    this.sendEventReport(event.txid, event.outputIndex, 'PRICE', price.toString())
  }
  
  /**
   * Send a report to the VTN
   * @param eventTxid - Event transaction ID
   * @param eventOutputIndex - Event output index
   * @param reportType - Type of report
   * @param reportValue - Report value
   */
  async sendEventReport(
    eventTxid: string,
    eventOutputIndex: number,
    reportType: string,
    reportValue: string
  ): Promise<void> {
    try {
      const response = await this.authFetch.fetch(`${this.vtnBaseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportName: `${reportType}_${Date.now()}`,
          programID: this.programID,
          eventID: `${eventTxid}-${eventOutputIndex}`,
          clientName: this.venID,
          resources: [
            {
              resourceName: 'VEN_RESOURCE',
              intervals: [
                {
                  id: 0,
                  payloads: [
                    {
                      type: reportType,
                      values: [reportValue]
                    }
                  ]
                }
              ]
            }
          ]
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to send report: ${response.statusText}`)
      }
      
      console.log('Report sent successfully')
    } catch (error) {
      console.error('Error sending report:', error)
      throw error
    }
  }
}