# OpenADR on BitcoinSV Demo

This hackathon project demonstrates how to implement a simplified OpenADR (Open Automated Demand Response) system using BitcoinSV blockchain as the foundational technology.

## Overview

OpenADR is a standard for automating and communicating demand response signals between utilities, system operators, and energy management systems. Our project maps OpenADR concepts to the BitcoinSV blockchain, creating a decentralized, immutable platform for demand response coordination.

### Key Components

1. **VTN (Virtual Top Node)**: Implemented as a BSV Overlay Service

   - Validates and stores OpenADR events on the blockchain
   - Provides lookup services for VENs to discover events

2. **VEN (Virtual End Node)**: Client using a BRC-100 wallet

   - Connects to the VTN
   - Discovers and processes demand response events
   - Submits reports back to the VTN

3. **sCrypt Contract**: Represents OpenADR events on-chain
   - Stores event parameters (type, timing, payload, etc.)
   - Enables secure, verifiable event creation and responses

## Project Structure

```
.
├── backend/
│   └── src/
│       ├── contracts/
│       │   └── OpenADR.ts             # sCrypt contract for events
│       ├── lookup-services/
│       │   ├── OpenADRLookupServiceFactory.ts
│       │   └── OpenADRStorage.ts      # MongoDB storage for events
│       └── topic-managers/
│           └── OpenADRTopicManager.ts # Processes BSV transactions
├── frontend/
│   └── src/
│       └── App.tsx                    # Demo UI
├── VENClient.ts                       # BRC-100 wallet client
├── DemoApp.ts                         # Demo application
└── deployment-info.json              # BSV Overlay configuration
```

## Demo Functionality

This demo showcases:

1. **Event Creation**: The VTN (Overlay Service) creates a demand response event as a BSV transaction.
2. **Event Discovery**: The VEN client discovers the event through the Overlay Lookup Service.
3. **Event Processing**: The VEN client processes the event and simulates a load reduction.
4. **Report Submission**: The VEN submits a report confirming its response to the event.

## OpenADR Concepts Implemented

- **Program**: Represents a demand response program (e.g., "residential-demand-response")
- **Event**: A demand response signal (SIMPLE event with load reduction level)
- **Report**: Response data from the VEN confirming action taken
- **Interval**: Time windows for event validity

## Running the Demo

### Prerequisites

- Node.js v16+
- Docker (for LARS - Local Automated Runtime System)
- BSV Reference Wallet installed locally

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/openadr-bsv-demo.git
   cd openadr-bsv-demo
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the BSV Overlay Service using LARS**

   ```bash
   npm run lars
   ```

4. **Configure the BSV Reference Wallet**

   - Ensure the wallet is running
   - Fund the wallet with a small amount of BSV for transactions

5. **Start the demo application**

   ```bash
   npm run demo
   ```

6. **Open the UI in your browser**
   ```
   http://localhost:8080
   ```

## Hackathon Extensions

For a more complete implementation, consider these extensions:

1. **Full OpenADR Schema**: Implement complete OpenADR 3.0 data models
2. **Real Device Integration**: Connect to actual IoT devices (smart thermostats, EV chargers)
3. **Multi-Party System**: Multiple VTNs and VENs interacting in a hierarchy
4. **Payment Integration**: Implement micropayments for demand response participation

## Why BitcoinSV?

BitcoinSV offers several advantages for implementing an OpenADR system:

1. **Immutability**: Once written, demand response events cannot be altered
2. **Auditability**: Complete history of all events and responses
3. **Timestamping**: Secure, verifiable timing of all actions
4. **Micropayments**: Potential for direct incentives for demand response participation
5. **Overlay Services**: Efficient indexing and lookup of relevant transactions

## Resources

- [OpenADR Alliance](https://www.openadr.org/)
- [BSV Blockchain](https://bsvblockchain.org/)
- [BSV Overlay Services](https://bsvblockchain.org/overlay-services)
- [BRC-100 Standard](https://bsv.brc.dev/brc-100)

---

This project is for demonstration purposes and is not intended for production use without further development and security review.
