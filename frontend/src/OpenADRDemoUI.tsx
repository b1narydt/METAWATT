import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const OpenADRDemoUI = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [venStatus, setVenStatus] = useState('Connecting...');
  const [loadLevel, setLoadLevel] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState('Normal');
  const [reports, setReports] = useState([]);
  
  // Simulate loading data
  useEffect(() => {
    // Simulate VEN connecting
    setTimeout(() => {
      setVenStatus('Online');
      
      // Simulate receiving events
      const demoEvents = [
        {
          id: 'event-1',
          type: 'SIMPLE',
          programId: 'residential-demand-response',
          startTime: new Date(),
          duration: 3600,
          priority: 0,
          payload: { level: 2, reason: 'Peak demand forecast' }
        }
      ];
      
      setEvents(demoEvents);
      setSelectedEvent(demoEvents[0]);
      
      // Simulate load response
      setTimeout(() => {
        setLoadLevel(2);
        setDeviceStatus('Curtailed');
        
        // Simulate report
        const demoReport = {
          id: 'report-1',
          eventId: 'event-1',
          time: new Date(),
          type: 'SIMPLE_LEVEL',
          value: '2',
          resourceId: 'VEN_RESOURCE'
        };
        
        setReports(prev => [...prev, demoReport]);
      }, 3000);
    }, 2000);
  }, []);
  
  // Generate chart data
  const getChartData = () => {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now);
      hour.setHours(now.getHours() + i);
      
      // Default load
      let load = 2 + Math.random() * 2;
      
      // Apply DR event
      if (i < 4 && loadLevel > 0) {
        load = load * (1 - (loadLevel * 0.25));
      }
      
      return {
        time: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        load: parseFloat(load.toFixed(2)),
        baseline: parseFloat((2 + Math.random() * 2).toFixed(2))
      };
    });
  };
  
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
        </div>
        
        {/* Event Panel */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Active Events</h2>
          <div className="overflow-y-auto max-h-64">
            {events.length === 0 ? (
              <p className="italic text-gray-500">No active events</p>
            ) : (
              events.map(event => (
                <div 
                  key={event.id} 
                  className={`p-3 mb-2 rounded cursor-pointer ${selectedEvent?.id === event.id ? 'bg-blue-200' : 'bg-blue-100'}`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <p className="font-medium">{event.type} Event</p>
                  <p className="text-sm text-gray-600">
                    Priority: {event.priority} | Level: {event.payload.level}
                  </p>
                  <p className="text-sm text-gray-600">
                    Duration: {event.duration / 60} minutes
                  </p>
                </div>
              ))
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
                  <p className="font-medium">{report.type}</p>
                  <p className="text-sm text-gray-600">
                    Value: {report.value}
                  </p>
                  <p className="text-sm text-gray-600">
                    Time: {report.time.toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Load Chart */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Load Forecast</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={getChartData()}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'kW', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="baseline" fill="#8884d8" name="Baseline" />
              <Bar dataKey="load" fill="#82ca9d" name="Forecasted Load" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {selectedEvent && (
          <div className="mt-4 p-3 bg-yellow-100 rounded">
            <p className="font-medium">Event Impact</p>
            <p className="text-sm">
              {selectedEvent.payload.level === 1 ? 'Minor reduction' : 
               selectedEvent.payload.level === 2 ? 'Moderate reduction' : 'Significant reduction'} in power consumption during the event period.
            </p>
            <p className="text-sm">
              Reason: {selectedEvent.payload.reason}
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
              <tr>
                <td className="py-2 px-4 border-b">Event Creation</td>
                <td className="py-2 px-4 border-b font-mono text-xs">2097dfd76851bf465e8f715593b217714858bbe957...</td>
                <td className="py-2 px-4 border-b text-green-600">Confirmed</td>
                <td className="py-2 px-4 border-b">{new Date().toLocaleTimeString()}</td>
              </tr>
              {reports.length > 0 && (
                <tr>
                  <td className="py-2 px-4 border-b">Report Submission</td>
                  <td className="py-2 px-4 border-b font-mono text-xs">89a3c2f103b217714858bbe9570ff3bd5e33840a3...</td>
                  <td className="py-2 px-4 border-b text-green-600">Confirmed</td>
                  <td className="py-2 px-4 border-b">{reports[0].time.toLocaleTimeString()}</td>
                </tr>
              )}
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