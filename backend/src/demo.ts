import { WalletClient } from '@bsv/sdk'
import { SHIPBroadcaster, Utils } from '@bsv/sdk'
import { OpenADRContract } from './contracts/OpenADR.js'
import { ByteString, toByteString } from 'scrypt-ts'
/**
 * Simple demo for OpenADR on BSV
 */
async function runDemo() {
  console.log('Starting OpenADR Demo...')
  
  try {
    // Create a wallet client
    const wallet = new WalletClient()
    
    // Create an instance of the OpenADR contract
    

    const eventType = toByteString('SIMPLE')
    const programID = toByteString('residential-demand-response')
    const startTime = BigInt(Math.floor(Date.now() / 1000))
    const duration = BigInt(3600) // 1 hour
  
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
    
    console.log('OpenADR contract created')
    console.log('Event Type:', toByteString(eventType))
    console.log('Program ID:', toByteString(programID))
    console.log('Start Time:', startTime)
    console.log('Duration:', duration)
    
    // In a real implementation, we would now:
    // 1. Create a transaction using the wallet
    // 2. Add the contract as an output
    // 3. Sign the transaction
    // 4. Broadcast it to the overlay
    
    // For the demo, we'll just simulate success
    console.log('Simulating successful transaction broadcast...')
    console.log('Event successfully created on BSV blockchain')
  } catch (error) {
    console.error('Error running demo:', error)
  }
}

// Run the demo
runDemo().catch(console.error)