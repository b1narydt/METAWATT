import React, { useEffect, useState } from 'react';
import OpenADRDemoUI from './OpenADRDemoUI';
import demoService from '../services/DemoService';
import apiIntegration from '../services/ApiIntegration';

// Export services for use in components
export { apiIntegration };

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        // Initialize the demo app
        await demoService.initialize();
        
        // Short delay to simulate initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing app:', err);
        setError('Failed to initialize application. Please check console for details.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-blue-800 mb-4">Loading OpenADR BSV Demo</h1>
          <p className="text-gray-600">Initializing blockchain connections...</p>
          <div className="mt-6 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="animate-pulse h-full bg-blue-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <OpenADRDemoUI />;
};

export default App;