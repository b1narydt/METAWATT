import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// Import the API integration from App
import { apiIntegration } from '../components/app';

// Define type interfaces
interface OpenADREvent {
  txid: string;
  outputIndex: number;
  eventType: string;
  programID: string;
  startTime: number;
  duration: number;
  payload: string;
  status: string;
  createdAt: string;
}

interface EventReport {
  id: string;
  eventTxid: string;
  eventOutputIndex: number;
  reportType: string;
  reportValue: string;
  timestamp: Date;
  resourceId: string;
}

const OpenADRDemoUI = () => {
  const [events, setEvents] = useState<OpenADREvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<OpenADREvent | null>(null);
  const [venStatus, setVenStatus] = useState('Connecting...');
  const [loadLevel, setLoadLevel] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState('Normal');
  const [reports, setReports] = useState<EventReport[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [customLoadReduction, setCustomLoadReduction] = useState(20); // Default 20% reduction
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events from the API integration
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Get events from API
      const activeEvents = await apiIntegration.getActiveEvents();
      console.log('Active Events:', activeEvents);
      
      // Process events to ensure they have the right format
      const processedEvents = activeEvents.map(event => {
        // Ensure payload is a string
        const payload = typeof event.payload === 'string' 
          ? event.payload 
          : JSON.stringify(event.payload);
        
        return {
          ...event,
          payload,
          // Convert dates if needed
          createdAt: event.createdAt instanceof Date 
            ? event.createdAt.toISOString() 
            : event.createdAt
        };
      });
      
      setEvents(processedEvents);
      
      if (processedEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(processedEvents[0]);
        // Parse the payload
        try {
          const payload = typeof processedEvents[0].payload === 'string'
            ? JSON.parse(processedEvents[0].payload)
            : processedEvents[0].payload;
            
          setLoadLevel(payload.level || 0);
          setDeviceStatus(payload.level > 0 ? 'Curtailed' : 'Normal');
        } catch (e) {
          console.error('Error parsing payload:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit a report for an event
  const submitReport = async (eventTxid: string, eventOutputIndex: number, reportType: string, reportValue: string) => {
    setIsSubmittingReport(true);
    
    try {
      // Submit report through API integration
      const success = await apiIntegration.submitLoadReductionReport(
        eventTxid,
        eventOutputIndex,
        parseInt(reportValue)
      );
      
      if (!success) {
        throw new Error('Failed to submit report');
      }
      
      // Create a new report object for UI
      const newReport: EventReport = {
        id: `report-${Date.now()}`,
        eventTxid: eventTxid,
        eventOutputIndex: eventOutputIndex,
        reportType: reportType,
        reportValue: reportValue,
        timestamp: new Date(),
        resourceId: 'VEN_RESOURCE'
      };
      
      // Add to reports list
      setReports(prev => [...prev, newReport]);
      
      // Update load level based on report
      if (reportType === 'LOAD_REDUCTION') {
        // Update chart data to reflect the load reduction
        updateChartWithReport(parseInt(reportValue));
      }
      
      // Show confirmation
      alert(`Report submitted successfully: ${reportType} = ${reportValue}`);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Update chart data with report values
  const updateChartWithReport = (reductionPercent: number) => {
    setChartData(prevData => {
      return prevData.map((hour, index) => {
        // Apply reduction to next 4 hours if this is an active DR event
        if (index < 4) {
          const reduction = hour.baseline * (reductionPercent / 100);
          return {
            ...hour,
            load: parseFloat((hour.baseline - reduction).toFixed(2)),
            reduction: parseFloat(reduction.toFixed(2))
          };
        }
        return hour;
      });
    });
    
    // Update device status and load level
    setDeviceStatus('Curtailed');
    setLoadLevel(Math.ceil(reductionPercent / 10)); // Convert percentage to level (1-5)
  };
  
  // Generate initial chart data
  const generateChartData = () => {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now);
      hour.setHours(now.getHours() + i);
      
      // Default load - more realistic pattern with peak in afternoon
      let baseline = 2 + Math.sin((i + 6) * Math.PI / 12) * 3;
      baseline = parseFloat(baseline.toFixed(2));
      
      return {
        time: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        baseline: baseline,
        load: baseline, // Initially the same as baseline
        reduction: 0
      };
    });
  };
  
  // Submit custom load reduction report
  const handleSubmitCustomReduction = () => {
    if (!selectedEvent) return;
    
    submitReport(
      selectedEvent.txid, 
      selectedEvent.outputIndex, 
      'LOAD_REDUCTION', 
      customLoadReduction.toString()
    );
  };
  
  // Get event details
  const fetchEventDetails = async (txid: string, outputIndex: number) => {
    try {
      const eventDetails = await apiIntegration.getEventDetails(txid, outputIndex);
      // Process any additional event details if needed
      console.log('Fetched event details:', eventDetails);
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };
  
  // Initialize component
  useEffect(() => {
    // Set initial chart data
    setChartData(generateChartData());
    
    const initializeApp = async () => {
      try {
        // Set VEN status to connecting
        setVenStatus('Connecting...');
        
        // Small delay to simulate connection process
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Set VEN status to online
        setVenStatus('Online');
        
        // Fetch events
        await fetchEvents();
        
        // Set up polling for events - fix the clearInterval issue
        const intervalId = setInterval(fetchEvents, 30000);
        
        // Return a cleanup function that uses the correct type
        return () => {
          clearInterval(intervalId as unknown as number);
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        setVenStatus('Error');
      }
    };
    
    initializeApp();
  }, []);
  
  // Update selected event details when selected
  useEffect(() => {
    if (selectedEvent) {
      fetchEventDetails(selectedEvent.txid, selectedEvent.outputIndex);
    }
  }, [selectedEvent]);
  
  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">OpenADR on BitcoinSV Demo</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* VEN Status Panel */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">VEN Status</h2>
          <div className="mb-4">
            <p className="font-medium">Connection: 
              <span className={`ml-2 font-bold ${venStatus === 'Online' ? 'text-green-600' : venStatus === 'Connecting...' ? 'text-yellow-600' : 'text-red-600'}`}>
                {venStatus}
              </span>
            </p>
          </div>
          <div className="mb-4">
            <p className="font-medium">Program: 
              <span className="ml-2 font-mono">residential-demand-response</span>
            </p>
          </div>
          <div className="mb-4">
            <p className="font-medium">Device Status: 
              <span className={`ml-2 font-bold ${deviceStatus === 'Normal' ? 'text-green-600' : 'text-yellow-600'}`}>
                {deviceStatus}
              </span>
            </p>
          </div>
          {loadLevel > 0 && (
            <div className="mb-4">
              <p className="font-medium">Load Shed Level: 
                <span className="ml-2 font-bold text-red-600">{loadLevel}</span>
              </p>
            </div>
          )}
          
          {/* Report Submission Form */}
          {selectedEvent && (
            <div className="mt-6 p-3 bg-blue-100 rounded">
              <h3 className="font-medium mb-2">Submit Load Reduction</h3>
              <div className="flex items-center mb-2">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={customLoadReduction}
                  onChange={(e) => setCustomLoadReduction(parseInt(e.target.value))}
                  className="w-full mr-2"
                />
                <span className="font-bold">{customLoadReduction}%</span>
              </div>
              <button
                onClick={handleSubmitCustomReduction}
                disabled={isSubmittingReport}
                className="w-full py-1 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          )}
        </div>
        
        {/* Event Panel */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Active Events</h2>
          <div className="overflow-y-auto max-h-64">
            {events.length === 0 ? (
              <p className="italic text-gray-500">No active events</p>
            ) : (
              events.map(event => {
                // Parse payload
                let payload = { level: 0, reason: '' };
                try {
                  payload = JSON.parse(event.payload);
                } catch (e) {
                  console.error('Error parsing payload:', e);
                }
                
                return (
                  <div 
                    key={`${event.txid}-${event.outputIndex}`} 
                    className={`p-3 mb-2 rounded cursor-pointer ${
                      selectedEvent?.txid === event.txid && 
                      selectedEvent?.outputIndex === event.outputIndex ? 
                      'bg-blue-200' : 'bg-blue-100'
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <p className="font-medium">{event.eventType} Event</p>
                    <p className="text-sm text-gray-600">
                      Level: {payload.level} | Reason: {payload.reason}
                    </p>
                    <p className="text-sm text-gray-600">
                      Duration: {Math.floor(event.duration / 60)} minutes
                    </p>
                    <p className="text-xs font-mono text-gray-500 truncate">
                      TXID: {event.txid.substring(0, 12)}...
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Reports Panel */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Reports Sent</h2>
          <div className="overflow-y-auto max-h-64">
            {reports.length === 0 ? (
              <p className="italic text-gray-500">No reports sent</p>
            ) : (
              reports.map(report => (
                <div 
                  key={report.id} 
                  className="p-3 mb-2 bg-green-100 rounded"
                >
                  <p className="font-medium">{report.reportType}</p>
                  <p className="text-sm text-gray-600">
                    Value: {report.reportValue}
                    {report.reportType === 'LOAD_REDUCTION' && '%'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Time: {report.timestamp.toLocaleTimeString()}
                  </p>
                  <p className="text-xs font-mono text-gray-500 truncate">
                    Event: {report.eventTxid.substring(0, 12)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Load Chart - Interactive with Reports */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Load Forecast & Reduction</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'kW', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value, name) => {
                return [
                  `${value} kW`, 
                  name === 'baseline' ? 'Baseline' : 
                  name === 'load' ? 'Actual Load' : 
                  'Load Reduction'
                ];
              }} />
              <Legend />
              <Bar dataKey="baseline" fill="#8884d8" name="Baseline" stackId="a" />
              <Bar dataKey="reduction" fill="#ff8042" name="Reduction" stackId="a" />
              <Bar dataKey="load" fill="#82ca9d" name="Actual Load" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {selectedEvent && (
          <div className="mt-4 p-3 bg-yellow-100 rounded">
            <p className="font-medium">Event Impact</p>
            <p className="text-sm">
              {reports.length > 0 ? (
                `Your reported reduction of ${reports[reports.length - 1].reportValue}% is being applied to the next 
                ${Math.floor(selectedEvent.duration / 3600)} hours.`
              ) : (
                'Submit a load reduction report to see the impact on the chart.'
              )}
            </p>
            <p className="text-sm mt-2">
              Event created at: {new Date(selectedEvent.startTime * 1000).toLocaleString()}
            </p>
          </div>
        )}
      </div>
      
      {/* Blockchain Transactions */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">BSV Blockchain Transactions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Type</th>
                <th className="py-2 px-4 border-b">Transaction ID</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={`tx-${event.txid}`}>
                  <td className="py-2 px-4 border-b">Event Creation</td>
                  <td className="py-2 px-4 border-b font-mono text-xs">{event.txid.substring(0, 32)}...</td>
                  <td className="py-2 px-4 border-b text-green-600">Confirmed</td>
                  <td className="py-2 px-4 border-b">{new Date(event.startTime * 1000).toLocaleTimeString()}</td>
                </tr>
              ))}
              {reports.map(report => (
                <tr key={`report-tx-${report.id}`}>
                  <td className="py-2 px-4 border-b">Report Submission</td>
                  <td className="py-2 px-4 border-b font-mono text-xs">
                    {/* In a real app, this would be the actual TXID */}
                    89a3c2f103b217714858bbe9570ff3bd5e33840a3...
                  </td>
                  <td className="py-2 px-4 border-b text-green-600">Confirmed</td>
                  <td className="py-2 px-4 border-b">{report.timestamp.toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* OpenADR Protocol Info */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">OpenADR Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">What is OpenADR?</h3>
            <p className="text-sm text-gray-700">
              OpenADR (Open Automated Demand Response) is a standard for communicating 
              demand response signals between utilities, system operators, and energy 
              management systems to automatically manage energy consumption.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">BitcoinSV Integration</h3>
            <p className="text-sm text-gray-700">
              This demo shows how BitcoinSV can serve as the underlying infrastructure 
              for OpenADR by providing an immutable, timestamped ledger of demand response 
              events and responses, secured through blockchain technology.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        <p>OpenADR on BitcoinSV Demo | Hackathon Project</p>
      </div>
    </div>
  );
};

export default OpenADRDemoUI;