import {
    LookupService,
    LookupQuestion,
    LookupAnswer,
    LookupFormula
  } from '@bsv/overlay'
  import { Script, Utils } from '@bsv/sdk'
  import { ByteString, toByteString } from 'scrypt-ts'
  import { Db } from 'mongodb'
  import { OpenADRStorage } from './OpenADRStorage.js'
  import { OpenADRContract } from '../contracts/OpenADR.js'
  import openADRContractJson from '../../artifacts/OpenADR.json' with { type: 'json' }
  
  // Load sCrypt artifact
  OpenADRContract.loadArtifact(openADRContractJson)
  
  class OpenADRLookupService implements LookupService {
    constructor(public storage: OpenADRStorage) {}
  
    async outputAdded?(
      txid: string,
      outputIndex: number,
      outputScript: Script,
      topic: string
    ): Promise<void> {
      if (topic !== 'tm_openADR') return
      
      try {
        const openADR = OpenADRContract.fromLockingScript(
          outputScript.toHex()
        ) as OpenADRContract
        
        const eventType = openADR.eventType.toString()
        const programID = openADR.programID.toString()
        const startTime = Number(openADR.startTime)
        const duration = Number(openADR.duration)
        const payload = openADR.payload ? toByteString(openADR.payload) : ''
        
        await this.storage.storeEvent(
          txid,
          outputIndex,
          eventType,
          programID,
          startTime,
          duration,
          payload
        )
        
        console.log(`Indexed OpenADR event: ${eventType}, Program: ${programID}`)
      } catch (e) {
        console.error('Error indexing OpenADR event:', e)
      }
    }
  
    async outputSpent?(
      txid: string,
      outputIndex: number,
      topic: string
    ): Promise<void> {
      if (topic !== 'tm_openADR') return
      await this.storage.updateEventStatus(txid, outputIndex, 'spent')
    }
  
    async outputDeleted?(
      txid: string,
      outputIndex: number,
      topic: string
    ): Promise<void> {
      if (topic !== 'tm_openADR') return
      await this.storage.updateEventStatus(txid, outputIndex, 'deleted')
    }
  
    async lookup(
      question: LookupQuestion
    ): Promise<LookupAnswer | LookupFormula> {
      if (question.service !== 'ls_openADR') {
        throw new Error('Lookup service not supported!')
      }
      
      const query = question.query as {
        active?: boolean
        findAll?: boolean
      }
      
      if (query.findAll) {
        return await this.storage.findAllEvents()
      }
      
      if (query.active !== undefined) {
        return await this.storage.findActiveEvents()
      }
      
      throw new Error(`Unsupported query`)
    }
  
    async getDocumentation(): Promise<string> {
      return `# OpenADR Lookup Service
  
  To use this service, send queries with the following parameters:
  - findAll: true - Get all OpenADR events
  - active: true - Get currently active events`
    }
  
    async getMetaData(): Promise<{
      name: string
      shortDescription: string
      iconURL?: string
      version?: string
      informationURL?: string
    }> {
      return {
        name: 'OpenADR Lookup Service',
        shortDescription: 'Query demand response events on the BSV blockchain'
      }
    }
  }
  
  // Factory function
  export default (db: Db): OpenADRLookupService => {
    return new OpenADRLookupService(new OpenADRStorage(db))
  }