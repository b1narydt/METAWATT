import { Collection, Db } from 'mongodb'

interface OpenADREvent {
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

interface UTXOReference {
  txid: string
  outputIndex: number
}

export class OpenADRStorage {
  private readonly events: Collection<OpenADREvent>

  constructor(private readonly db: Db) {
    this.events = db.collection<OpenADREvent>('OpenADREvents')
  }

  async storeEvent(
    txid: string,
    outputIndex: number,
    eventType: string,
    programID: string,
    startTime: number,
    duration: number,
    payload: string
  ): Promise<void> {
    await this.events.insertOne({
      txid,
      outputIndex,
      eventType,
      programID,
      startTime,
      duration,
      payload,
      status: 'active',
      createdAt: new Date()
    })
  }

  async updateEventStatus(
    txid: string,
    outputIndex: number,
    status: 'active' | 'spent' | 'deleted'
  ): Promise<void> {
    await this.events.updateOne(
      { txid, outputIndex },
      { $set: { status } }
    )
  }

  async findAllEvents(): Promise<UTXOReference[]> {
    return await this.events
      .find({})
      .project<UTXOReference>({ txid: 1, outputIndex: 1, _id: 0 })
      .toArray()
  }

  async findActiveEvents(): Promise<UTXOReference[]> {
    const now = Math.floor(Date.now() / 1000)
    
    return await this.events
      .find({
        status: 'active',
        startTime: { $lte: now },
        $expr: { $gt: [{ $add: ['$startTime', '$duration'] }, now] }
      })
      .project<UTXOReference>({ txid: 1, outputIndex: 1, _id: 0 })
      .toArray()
  }
}