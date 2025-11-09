import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LogIn, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function SessionCapture() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const scriptPath = 'd:\\VKUTK\\Backend\\ManualScrape\\VKU_scraper\\scripts\\session_get.py';
  const sessionPath = 'd:\\VKUTK\\Backend\\ManualScrape\\VKU_scraper\\scripts\\session.json';

  const handleCaptureSession = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('Capturing session with path:', scriptPath);
      console.log('Session file path:', sessionPath);
      const result = await invoke<string>('capture_session', {
        pythonScriptPath: scriptPath,
        sessionPath: sessionPath,
      });
      console.log('Session capture result:', result);
      setStatus('success');
      setMessage(result || 'Session captured successfully!');
    } catch (error) {
      console.error('Session capture error:', error);
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(errorMessage || 'An error occurred while capturing the session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckSession = async () => {
    try {
      const exists = await invoke<boolean>('check_session_file', {
        sessionPath: sessionPath,
      });
      if (exists) {
        setStatus('success');
        setMessage('Session file exists! Fetching student information...');
        
        // Fetch student info after session is verified
        setTimeout(() => {
          handleFetchStudentInfo();
        }, 500);
      } else {
        setStatus('error');
        setMessage(`Session file not found at: ${sessionPath}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'Error checking session file.'
      );
    }
  };

  const handleFetchStudentInfo = async () => {
    try {
      const studentInfoScript = 'd:\\VKUTK\\Backend\\ManualScrape\\VKU_scraper\\scripts\\thong_tin_ca_nhan_api.py';
      const result = await invoke<Record<string, string>>('fetch_student_info', {
        pythonScriptPath: studentInfoScript,
        sessionPath: sessionPath,
      });
      
      // Store student info in localStorage for StudentInfoPage
      localStorage.setItem('studentInfo', JSON.stringify(result));
      
      setStatus('success');
      setMessage('Student information fetched successfully! Check the "Thông tin" tab.');
    } catch (error) {
      console.error('Fetch student info error:', error);
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(`Failed to fetch student info: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <LogIn className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">VKU Session Capture</h1>
          </div>

          <p className="text-gray-600 mb-6">
            This tool captures your VKU login session for automated access. A browser window will open
            where you can log in manually, and your session will be saved.
          </p>

          <div className="space-y-6">
            {/* Status Message */}
            {status !== 'idle' && (
              <div
                className={`p-4 rounded-lg flex gap-3 ${
                  status === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    status === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCaptureSession}
                disabled={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
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
                onClick={handleCheckSession}
                disabled={isLoading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Check Session
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Click "Capture Session" to start the process</li>
              <li>A browser window will open to the VKU login page</li>
              <li>Log in with your VKU credentials</li>
              <li>Press Enter in the console when done</li>
              <li>Your session will be saved automatically</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
