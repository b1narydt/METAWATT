// Common interfaces for the OpenADR project

export interface OpenADREvent {
    txid: string
    outputIndex: number
    eventType: string
    programID: string
    startTime: number
    duration: number
    payload: string
    status: 'active' | 'spent' | 'deleted'
    createdAt: Date
  }
  
  export interface UTXOReference {
    txid: string
    outputIndex: number
  }
  
  // Used for lookup service queries
  export interface OpenADRQuery {
    programID?: string
    eventType?: string  
    active?: boolean
    findAll?: boolean
  }