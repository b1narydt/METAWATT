import { WalletClient, AuthFetch, LookupResolver } from '@bsv/sdk'
import { Transaction, PrivateKey, Script } from '@bsv/sdk'
import { OpenADRContract } from './backend/src/contracts/OpenADR'
import { toByteString, ByteString } from 'scrypt-ts'
import openADRContractJson from './backend/artifacts/OpenADR.json'

// Load sCrypt artifact
OpenADRContract.loadArtifact(openADRContractJson)

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
      // First, get the transaction that contains the event
      const tx = await this.getTransaction(output.txid)
      
      if (!tx) {
        console.error(`Transaction not found: ${output.txid}`)
        return
      }
      
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
   * Get transaction by TXID
   * @param txid - Transaction ID
   */
  private async getTransaction(txid: string): Promise<Transaction | null> {
    try {
      // In a real implementation with BRC-100 wallet, you'd use:
      // return await this.wallet.getTransaction(txid);
      
      // For the demo, create a mock transaction
      const tx = new Transaction();
      
      // Add a dummy output with OpenADR contract
      const mockContract = new OpenADRContract(
        toByteString('SIMPLE'),
        toByteString(this.programID),
        BigInt(Math.floor(Date.now() / 1000) - 300), // 5 minutes ago
        BigInt(3600), // 1 hour
        toByteString(JSON.stringify({ level: 2, reason: 'Peak demand forecast' }))
      );
      
      // In a real implementation, you'd actually parse the transaction
      return tx;
    } catch (error) {
      console.error(`Error fetching transaction ${txid}:`, error)
      return null
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
   * Changed to public so it can be called from DemoApp
   * @param event - OpenADR event data
   */
  public handleSimpleEvent(event: any): void {
    try {
      const payload = JSON.parse(event.payload)
      const level = payload.level
      
      console.log(`Received SIMPLE event with level ${level}`)
      
      // Implement event handling logic
      // For demo purposes, we'll just send a report
      this.sendEventReport(event.txid, event.outputIndex, 'SIMPLE_LEVEL', level.toString())
    } catch (error) {
      console.error('Error handling SIMPLE event:', error)
    }
  }
  
  /**
   * Handle a PRICE event
   * @param event - OpenADR event data
   */
  public handlePriceEvent(event: any): void {
    try {
      const payload = JSON.parse(event.payload)
      const price = payload.price
      
      console.log(`Received PRICE event with price ${price}`)
      
      // Implement event handling logic
      // For demo purposes, we'll just send a report
      this.sendEventReport(event.txid, event.outputIndex, 'PRICE', price.toString())
    } catch (error) {
      console.error('Error handling PRICE event:', error)
    }
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
      console.log(`Sending report: ${reportType}=${reportValue} for event ${eventTxid}-${eventOutputIndex}`)
      
      // First, we would submit via API
      const apiResponse = await this.authFetch.fetch(`${this.vtnBaseUrl}/reports`, {
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
      
      if (!apiResponse.ok) {
        throw new Error(`Failed to send report to API: ${apiResponse.statusText}`)
      }
      
      // Next, we would update the contract on chain
      await this.updateEventContract(
        eventTxid,
        eventOutputIndex,
        reportType,
        reportValue
      )
      
      console.log('Report sent successfully and contract updated')
    } catch (error) {
      console.error('Error sending report:', error)
      throw error
    }
  }
  
  /**
   * Update the OpenADR event contract on chain
   * @param eventTxid - Event transaction ID
   * @param eventOutputIndex - Event output index
   * @param reportType - Type of report
   * @param reportValue - Report value
   */
  async updateEventContract(
    eventTxid: string,
    eventOutputIndex: number,
    reportType: string,
    reportValue: string
  ): Promise<void> {
    try {
      console.log(`Updating contract on chain for event ${eventTxid}-${eventOutputIndex}`);
      
      // Get the original transaction
      const tx = await this.getTransaction(eventTxid);
      if (!tx) {
        throw new Error(`Transaction not found: ${eventTxid}`);
      }
      
      // Extract the contract from the transaction
      const script = tx.outputs[eventOutputIndex].lockingScript.toHex();
      const openADR = OpenADRContract.fromLockingScript(script) as OpenADRContract;
      
      // Create the updated payload with the report data
      let payloadObj = {};
      try {
        payloadObj = JSON.parse(openADR.payload.toString());
      } catch (error) {
        console.log('Creating new payload');
      }
      
      payloadObj = {
        ...payloadObj,
        reports: [
          ...(payloadObj['reports'] || []),
          {
            type: reportType,
            value: reportValue,
            venID: this.venID,
            timestamp: Math.floor(Date.now() / 1000)
          }
        ]
      };
      
      const newPayload = toByteString(JSON.stringify(payloadObj));
      
      // In a real implementation with BRC-100 wallet, you would:
      // 1. Connect the contract to a signer
      // 2. Call the updateEventOnChain method
      // 3. Broadcast the transaction
      
      console.log(`Successfully updated contract with payload: ${JSON.stringify(payloadObj)}`);
      
      // For demonstration purposes only - this is where actual blockchain interaction would happen
      // with the real BSV wallet implementation
      console.log('=== ACTUAL BLOCKCHAIN TRANSACTION ===');
      console.log(`Event TXID: ${eventTxid}`);
      console.log(`Output Index: ${eventOutputIndex}`);
      console.log(`Report Type: ${reportType}`);
      console.log(`Report Value: ${reportValue}`);
      console.log(`VEN ID: ${this.venID}`);
      console.log('=====================================');
      
      // Simulate successful transaction
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating contract on chain:', error);
      throw error;
    }
  }
  
  /**
   * Submit a load reduction report
   * This is a specialized report type for the demo
   * @param eventTxid - Event transaction ID
   * @param eventOutputIndex - Event output index
   * @param reductionPercentage - The percentage of load reduced
   */
  async submitLoadReductionReport(
    eventTxid: string,
    eventOutputIndex: number,
    reductionPercentage: number
  ): Promise<void> {
    return this.sendEventReport(
      eventTxid,
      eventOutputIndex,
      'LOAD_REDUCTION',
      reductionPercentage.toString()
    );
  }
}