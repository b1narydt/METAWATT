import { AdmittanceInstructions, TopicManager } from '@bsv/overlay'
import { Transaction, Utils } from '@bsv/sdk'
import { OpenADRContract } from '../contracts/OpenADR.js'
import openADRContractJson from '../../artifacts/OpenADR.json' with { type: 'json' }

// Load sCrypt artifact
OpenADRContract.loadArtifact(openADRContractJson)

export default class OpenADRTopicManager implements TopicManager {
  async identifyAdmissibleOutputs(
    beef: number[],
    previousCoins: number[]
  ): Promise<AdmittanceInstructions> {
    const outputsToAdmit: number[] = []
    
    try {
      const parsedTransaction = Transaction.fromBEEF(beef)
      
      for (const [i, output] of parsedTransaction.outputs.entries()) {
        try {
          const script = output.lockingScript.toHex()
          const openADREvent = OpenADRContract.fromLockingScript(script) as OpenADRContract
          
          if (openADREvent.eventType && openADREvent.programID) {
            console.log(`Found valid OpenADR event: ${openADREvent.eventType}`)
            outputsToAdmit.push(i)
          }
        } catch (error) {
          // Not an OpenADR contract, skip this output
          continue
        }
      }
    } catch (error) {
      console.error(`Error processing transaction: ${error}`)
    }
    
    return {
      outputsToAdmit,
      coinsToRetain: previousCoins
    }
  }

  async getDocumentation(): Promise<string> {
    return `# OpenADR Topic Manager
    
This topic manager processes Bitcoin transactions containing OpenADR event data.
It validates and admits transactions that conform to the OpenADR contract structure.`
  }

  async getMetaData(): Promise<{
    name: string
    shortDescription: string
    iconURL?: string
    version?: string
    informationURL?: string
  }> {
    return {
      name: 'OpenADR Topic Manager',
      shortDescription: 'Processes demand response events on the BSV blockchain'
    }
  }
}