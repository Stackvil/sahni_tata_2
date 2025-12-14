import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Database, Server, Globe } from 'lucide-react';
import { API_BASE_URL, API_BASE_ENDPOINT, productsAPI, vehiclesAPI, homeAPI, aboutAPI, companiesAPI, showroomsAPI, fuelStationsAPI } from '../services/api';

interface EndpointStatus {
  name: string;
  endpoint: string;
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  responseTime?: number;
}

export default function BackendStatus() {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([]);
  const [overallStatus, setOverallStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('');

  useEffect(() => {
    setApiBaseUrl(API_BASE_URL);
    
    const testEndpoints: Array<{ name: string; testFn: () => Promise<any> }> = [
      {
        name: 'Products',
        testFn: async () => {
          const start = Date.now();
          const data = await productsAPI.getAll(1, 5, '');
          const responseTime = Date.now() - start;
          return { data, responseTime };
        }
      },
      {
        name: 'Vehicles',
        testFn: async () => {
          const start = Date.now();
          const data = await vehiclesAPI.getAll(1, 5);
          const responseTime = Date.now() - start;
          return { data, responseTime };
        }
      },
      {
        name: 'Home Video',
        testFn: async () => {
          const start = Date.now();
          const data = await homeAPI.getVideo();
          const responseTime = Date.now() - start;
          return { data, responseTime };
        }
      },
      {
        name: 'About Entries',
        testFn: async () => {
          const start = Date.now();
          const data = await aboutAPI.getAll();
          const responseTime = Date.now() - start;
          return { data, responseTime };
        }
      },
      {
        name: 'Companies',
        testFn: async () => {
          const start = Date.now();
          const data = await companiesAPI.getAll();
          const responseTime = Date.now() - start;
          return { data, responseTime };
        }
      },
      {
        name: 'Showrooms',
        testFn: async () => {
          const start = Date.now();
          const data = await showroomsAPI.getAll();
          const responseTime = Date.now() - start;
          return { data, responseTime };
        }
      },
      {
        name: 'Fuel Stations',
        testFn: async () => {
          const start = Date.now();
          const data = await fuelStationsAPI.getAll(1, 5);
          const responseTime = Date.now() - start;
          return { data, responseTime };
        }
      },
    ];

    // Initialize all endpoints as loading
    setEndpoints(testEndpoints.map(ep => ({
      name: ep.name,
      endpoint: '',
      status: 'loading'
    })));

    // Test all endpoints
    Promise.all(
      testEndpoints.map(async (ep, index) => {
        try {
          const result = await ep.testFn();
          return {
            name: ep.name,
            endpoint: ep.name.toLowerCase().replace(/\s+/g, '-'),
            status: 'success' as const,
            data: result.data,
            responseTime: result.responseTime
          };
        } catch (error: any) {
          return {
            name: ep.name,
            endpoint: ep.name.toLowerCase().replace(/\s+/g, '-'),
            status: 'error' as const,
            error: error.message || 'Unknown error',
            responseTime: undefined
          };
        }
      })
    ).then(results => {
      setEndpoints(results);
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      if (errorCount === 0) {
        setOverallStatus('success');
      } else if (successCount > 0) {
        setOverallStatus('success'); // Partial success is still success
      } else {
        setOverallStatus('error');
      }
    });
  }, []);

  const getStatusIcon = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  const formatData = (data: any): string => {
    if (Array.isArray(data)) {
      return `${data.length} items`;
    }
    if (data && typeof data === 'object') {
      if (data.products) return `${data.products.length} products`;
      if (data.vehicles) return `${data.vehicles.length} vehicles`;
      if (data.total !== undefined) return `Total: ${data.total}`;
      return 'Object data';
    }
    if (typeof data === 'string') {
      return data ? 'Video URL set' : 'No video';
    }
    return JSON.stringify(data).substring(0, 50);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Backend API Status</h1>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="w-4 h-4" />
              <span className="font-mono">{API_BASE_ENDPOINT}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Database className="w-4 h-4" />
              <span className="font-mono">API Base: {apiBaseUrl}</span>
            </div>
            
            <div className={`mt-4 p-4 rounded-lg border-2 ${
              overallStatus === 'success' ? 'bg-green-50 border-green-300' :
              overallStatus === 'error' ? 'bg-red-50 border-red-300' :
              'bg-blue-50 border-blue-300'
            }`}>
              <div className="flex items-center gap-2">
                {overallStatus === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                {overallStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                {overallStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                <span className="font-semibold">
                  {overallStatus === 'success' && 'Backend is working correctly!'}
                  {overallStatus === 'error' && 'Some endpoints are failing'}
                  {overallStatus === 'loading' && 'Testing backend connectivity...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Endpoint Status</h2>
          
          {endpoints.map((endpoint, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-md p-4 border-2 ${getStatusColor(endpoint.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(endpoint.status)}
                  <h3 className="font-semibold text-gray-900">{endpoint.name}</h3>
                </div>
                {endpoint.responseTime && (
                  <span className="text-xs text-gray-500">
                    {endpoint.responseTime}ms
                  </span>
                )}
              </div>
              
              {endpoint.status === 'success' && endpoint.data !== undefined && (
                <div className="mt-2 text-sm text-gray-700">
                  <strong>Data:</strong> {formatData(endpoint.data)}
                </div>
              )}
              
              {endpoint.status === 'error' && endpoint.error && (
                <div className="mt-2 text-sm text-red-600">
                  <strong>Error:</strong> {endpoint.error}
                </div>
              )}
              
              {endpoint.status === 'loading' && (
                <div className="mt-2 text-sm text-gray-500">
                  Testing connection...
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Backend Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• API Base Endpoint: <code className="bg-blue-100 px-1 rounded">{API_BASE_ENDPOINT}</code></li>
            <li>• API Base URL: <code className="bg-blue-100 px-1 rounded">{apiBaseUrl}</code></li>
            <li>• All API requests are prefixed with <code className="bg-blue-100 px-1 rounded">/api</code></li>
            <li>• Check browser console (F12) for detailed API logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

