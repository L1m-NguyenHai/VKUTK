import { useState, useEffect } from 'react';
import { LogIn, CheckCircle, XCircle, Loader2, Trash2, RefreshCw } from 'lucide-react';

interface SessionCapturePageProps {
  isDarkMode: boolean;
}

interface SessionStatus {
  exists: boolean;
  path: string;
  size?: number;
}

// Use localhost in dev mode, 127.0.0.1 in production
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : 'http://127.0.0.1:8000';

export function SessionCapturePage({ isDarkMode }: SessionCapturePageProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  console.log('SessionCapturePage mounted, API_BASE_URL:', API_BASE_URL);

  const checkSession = async () => {
    console.log('checkSession called');
    setIsCheckingSession(true);
    try {
      const url = `${API_BASE_URL}/api/check-session`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Session data:', data);
        setSessionStatus(data);
        if (data.exists) {
          setMessage('Session file found');
          setMessageType('success');
        } else {
          setMessage('No session file found');
          setMessageType('info');
        }
      } else {
        console.error('Response not ok:', response.status, response.statusText);
        setMessage('Failed to check session status');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Check session error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect to API server';
      setMessage(`Error: ${errorMsg}`);
      setMessageType('error');
      setSessionStatus(null);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const captureSession = async () => {
    setIsCapturing(true);
    setMessage('Opening browser... Please login to VKU');
    setMessageType('info');

    try {
      const response = await fetch(`${API_BASE_URL}/api/capture-session`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setMessageType('success');
        // Refresh session status
        await checkSession();
      } else {
        setMessage(data.message || 'Failed to capture session');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to connect to API server'}`);
      setMessageType('error');
    } finally {
      setIsCapturing(false);
    }
  };

  const deleteSession = async () => {
    if (!confirm('Are you sure you want to delete the session file?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/session`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('Session deleted successfully');
        setMessageType('success');
        setSessionStatus(null);
      } else {
        setMessage(data.message || 'Failed to delete session');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to connect to API server'}`);
      setMessageType('error');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className={`rounded-lg shadow-lg p-6 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="mb-6">
          <h1 className={`text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            VKU Session Capture
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Capture your VKU login session for automated scraping
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            messageType === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : messageType === 'error'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {messageType === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {messageType === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {messageType === 'info' && <Loader2 className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />}
            <span>{message}</span>
          </div>
        )}

        {/* Session Status Card */}
        <div className={`mb-6 p-4 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold mb-3 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Session Status
          </h2>
          
          {sessionStatus ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Status:
                </span>
                {sessionStatus.exists ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500">
                    <XCircle className="w-4 h-4" />
                    Not found
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading session status...
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={captureSession}
            disabled={isCapturing}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isCapturing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Capture Session
              </>
            )}
          </button>

          <button
            onClick={checkSession}
            disabled={isCheckingSession}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            {isCheckingSession ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Check Status
              </>
            )}
          </button>

          <button
            onClick={deleteSession}
            disabled={isDeleting || !sessionStatus?.exists}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isDeleting || !sessionStatus?.exists
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Delete Session
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className={`mt-8 p-4 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            How to use:
          </h3>
          <ol className={`list-decimal list-inside space-y-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <li>Make sure the FastAPI backend server is running</li>
            <li>Click "Capture Session" to open the browser</li>
            <li>Login to your VKU account in the opened browser</li>
            <li>The session will be automatically saved after successful login</li>
            <li>Use "Check Status" to verify the session file</li>
          </ol>
        </div>

        {/* API Status */}
        <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span className="font-medium">API Endpoint:</span> {API_BASE_URL}
        </div>
      </div>
    </div>
  );
}
