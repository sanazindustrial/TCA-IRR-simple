import React, { useState, useEffect } from 'react';

interface TestResult {
    success: boolean;
    data?: any;
    error?: string;
    timestamp?: number;
    responseTime?: string;
}

interface SystemStatus {
    connected: boolean;
    performance: string;
    lastCheck: number;
    errors: string[];
}

const EnhancedBackendTestComponent: React.FC = () => {
    const [testResults, setTestResults] = useState<TestResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [systemStatus, setSystemStatus] = useState<SystemStatus>({
        connected: false,
        performance: 'unknown',
        lastCheck: 0,
        errors: []
    });
    const [autoRefresh, setAutoRefresh] = useState(false);

    // Base URL for API calls
    const API_BASE_URL = 'http://127.0.0.1:8000/api';

    useEffect(() => {
        // Initial health check
        performHealthCheck();

        // Auto-refresh every 30 seconds if enabled
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(performHealthCheck, 30000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const performHealthCheck = async () => {
        try {
            console.log('🔍 Performing automated health check...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Health check successful:', data);
                
                setSystemStatus({
                    connected: true,
                    performance: data.performance || 'good',
                    lastCheck: Date.now(),
                    errors: []
                });
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error: any) {
            console.error('❌ Health check failed:', error);
            setSystemStatus(prev => ({
                ...prev,
                connected: false,
                lastCheck: Date.now(),
                errors: [...prev.errors.slice(-4), error.message] // Keep last 5 errors
            }));
        }
    };

    const testBackendHealth = async () => {
        setIsLoading(true);
        setTestResults(null);
        
        try {
            console.log('🏥 Testing backend health endpoint...');
            const startTime = Date.now();
            
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            const responseTime = `${Date.now() - startTime}ms`;

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend health test successful:', data);
                
                setTestResults({ 
                    success: true, 
                    data: {
                        ...data,
                        actualResponseTime: responseTime,
                        headers: Object.fromEntries(response.headers.entries())
                    }, 
                    error: undefined,
                    timestamp: Date.now(),
                    responseTime
                });
                setSystemStatus(prev => ({
                    ...prev,
                    connected: true,
                    performance: data.performance || 'good',
                    errors: []
                }));
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error: any) {
            console.error('❌ Backend health test failed:', error);
            
            setTestResults({ 
                success: false, 
                data: null, 
                error: error.message,
                timestamp: Date.now()
            });

            setSystemStatus(prev => ({
                ...prev,
                connected: false,
                errors: [...prev.errors.slice(-4), error.message]
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const testSystemStatus = async () => {
        setIsLoading(true);
        setTestResults(null);
        
        try {
            console.log('📊 Testing system status endpoint...');
            const startTime = Date.now();
            
            const response = await fetch(`${API_BASE_URL}/system/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                signal: AbortSignal.timeout(10000)
            });

            const responseTime = `${Date.now() - startTime}ms`;

            if (response.ok) {
                const data = await response.json();
                console.log('✅ System status test successful:', data);
                
                setTestResults({ 
                    success: true, 
                    data: {
                        ...data,
                        actualResponseTime: responseTime
                    }, 
                    error: undefined,
                    timestamp: Date.now(),
                    responseTime
                });
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error: any) {
            console.error('❌ System status test failed:', error);
            setTestResults({ 
                success: false, 
                data: null, 
                error: error.message,
                timestamp: Date.now()
            });
        } finally {
            setIsLoading(false);
        }
    };

    const testComprehensiveAnalysis = async () => {
        setIsLoading(true);
        setTestResults(null);

        try {
            const payload = {
                cash_flows: [-1000, 200, 300, 400, 500],
                discount_rate: 0.1,
                role_mode: 'user'
            };

            console.log('🧮 Testing comprehensive analysis endpoint...');
            const startTime = Date.now();
            
            const response = await fetch(`${API_BASE_URL}/analysis/comprehensive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                mode: 'cors',
                signal: AbortSignal.timeout(15000) // 15 second timeout for analysis
            });

            const responseTime = `${Date.now() - startTime}ms`;

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Analysis test successful:', data);
                
                setTestResults({ 
                    success: true, 
                    data: {
                        ...data,
                        actualResponseTime: responseTime,
                        payload
                    }, 
                    error: undefined,
                    timestamp: Date.now(),
                    responseTime
                });
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
            }
        } catch (error: any) {
            console.error('❌ Analysis test failed:', error);
            setTestResults({ 
                success: false, 
                data: null, 
                error: error.message,
                timestamp: Date.now()
            });
        } finally {
            setIsLoading(false);
        }
    };

    const testLogin = async () => {
        setIsLoading(true);
        setTestResults(null);

        try {
            const payload = {
                email: 'demo@example.com',
                password: 'demo123'
            };

            console.log('🔐 Testing login endpoint...');
            const startTime = Date.now();
            
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                mode: 'cors',
                signal: AbortSignal.timeout(10000)
            });

            const responseTime = `${Date.now() - startTime}ms`;

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Login test successful:', data);
                
                setTestResults({ 
                    success: true, 
                    data: {
                        ...data,
                        actualResponseTime: responseTime
                    }, 
                    error: undefined,
                    timestamp: Date.now(),
                    responseTime
                });
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
            }
        } catch (error: any) {
            console.error('❌ Login test failed:', error);
            setTestResults({ 
                success: false, 
                data: null, 
                error: error.message,
                timestamp: Date.now()
            });
        } finally {
            setIsLoading(false);
        }
    };
    const clearResults = () => {
        setTestResults(null);
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const getStatusColor = (connected: boolean) => {
        return connected ? 'text-green-600' : 'text-red-600';
    };

    const getStatusIcon = (connected: boolean) => {
        return connected ? '🟢' : '🔴';
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    🚀 Enhanced Backend Connection Testing Suite
                </h2>

                {/* System Status Display */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold mb-3">System Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <span className="font-medium">Connection: </span>
                            <span className={getStatusColor(systemStatus.connected)}>
                                {getStatusIcon(systemStatus.connected)} 
                                {systemStatus.connected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">Performance: </span>
                            <span className="text-blue-600">{systemStatus.performance}</span>
                        </div>
                        <div>
                            <span className="font-medium">Last Check: </span>
                            <span className="text-gray-600">
                                {systemStatus.lastCheck ? formatTimestamp(systemStatus.lastCheck) : 'Never'}
                            </span>
                        </div>
                    </div>
                    
                    {/* Auto Refresh Toggle */}
                    <div className="mt-3">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm">Auto-refresh health check (30s)</span>
                        </label>
                    </div>
                </div>

                {/* Test Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <button 
                        onClick={testBackendHealth}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? '⏳' : '🏥'} Health Check
                    </button>
                    
                    <button 
                        onClick={testSystemStatus}
                        disabled={isLoading}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? '⏳' : '📊'} System Status
                    </button>
                    
                    <button 
                        onClick={testComprehensiveAnalysis}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? '⏳' : '🧮'} Analysis
                    </button>
                    
                    <button 
                        onClick={testLogin}
                        disabled={isLoading}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? '⏳' : '🔐'} Login
                    </button>
                    
                    <button 
                        onClick={clearResults}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        🗑️ Clear
                    </button>
                </div>

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-800 border-t-transparent"></div>
                            <span>Testing backend connection...</span>
                        </div>
                    </div>
                )}

                {/* Test Results Display */}
                {testResults && (
                    <div className={`rounded-lg p-4 border-2 ${
                        testResults.success 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                {testResults.success ? '✅ Success' : '❌ Failed'}
                                Test Results
                            </h4>
                            {testResults.timestamp && (
                                <span className="text-sm text-gray-500">
                                    {formatTimestamp(testResults.timestamp)}
                                </span>
                            )}
                        </div>

                        {testResults.responseTime && (
                            <div className="mb-3 p-2 bg-white rounded border">
                                <strong>Response Time:</strong> {testResults.responseTime}
                            </div>
                        )}

                        {testResults.error && (
                            <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded">
                                <strong>Error:</strong> {testResults.error}
                            </div>
                        )}

                        {testResults.data && (
                            <div className="bg-white rounded border p-3">
                                <h5 className="font-medium mb-2">Response Data:</h5>
                                <pre className="text-xs overflow-x-auto bg-gray-100 p-3 rounded">
                                    {JSON.stringify(testResults.data, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                {/* Recent Errors */}
                {systemStatus.errors.length > 0 && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-800 mb-2">Recent Errors:</h4>
                        <ul className="space-y-1">
                            {systemStatus.errors.map((error, index) => (
                                <li key={index} className="text-sm text-red-700">
                                    • {error}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Connection Instructions */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">📋 Backend Server Information:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Server URL:</strong> http://127.0.0.1:8000</li>
                        <li>• <strong>Health Endpoint:</strong> /api/health</li>
                        <li>• <strong>System Status:</strong> /api/system/status</li>
                        <li>• <strong>Analysis Endpoint:</strong> /api/analysis/comprehensive</li>
                        <li>• <strong>Expected Response Time:</strong> &lt;1s for most endpoints</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EnhancedBackendTestComponent;