import {
    assert,
    ByteString,
    hash256,
    method,
    prop,
    SmartContract,
    SigHash,
} from 'scrypt-ts'

export class OpenADRContract extends SmartContract {
    @prop(true)
    eventType: ByteString

    @prop(true)
    programID: ByteString

    @prop(true)
    startTime: bigint

    @prop(true)
    duration: bigint

    @prop(true)
    payload: ByteString

    constructor(
        eventType: ByteString,
        programID: ByteString,
        startTime: bigint,
        duration: bigint,
        payload: ByteString
    ) {
        super(...arguments)
        this.eventType = eventType
        this.programID = programID
        this.startTime = startTime
        this.duration = duration
        this.payload = payload
    }

    @method()
    public updateEventOnChain(newPayload: ByteString) {
        // Possibly use SigHash.ANYONECANPAY_SINGLE if you want partial signing
        this.payload = newPayload

        // If you want to re-lock same value in state, do something like:
        const amount = this.ctx.utxo.value
        const outputs = this.buildStateOutput(amount)
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }
}