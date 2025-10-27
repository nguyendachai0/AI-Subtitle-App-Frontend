'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Video, Loader2, Download, Check, AlertCircle } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      setStatus('idle');
      setErrorMessage('');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const processVideo = async () => {
    if (!file) return;

    setStatus('uploading');
    setProgress(0);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('video', file);

    try {
      const uploadInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subtitles/process`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(uploadInterval);

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      setStatus('processing');
      setProgress(95);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setResultUrl(url);
      setStatus('completed');
      setProgress(100);
    } catch (error) {
      setStatus('error');
      setErrorMessage((error as Error).message || 'Failed to process video');
      console.error('Error:', error);
    }
  };

  const resetApp = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setResultUrl(null);
    setErrorMessage('');
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Video className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Auto-Subtitle Generator</h1>
          <p className="text-purple-200">Add dynamic, styled subtitles to your videos instantly</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {status === 'idle' && !file && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-purple-400 rounded-xl p-12 text-center hover:border-purple-300 transition-colors cursor-pointer"
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-white text-lg mb-2">Drop your video here or click to browse</p>
              <p className="text-purple-200 text-sm">Supports MP4, MOV, AVI files</p>
              <input
                id="fileInput"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {file && status === 'idle' && (
            <div className="space-y-6">
              <div className="bg-purple-500/20 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Video className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-purple-200 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={resetApp}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  Remove
                </button>
              </div>

              <button
                onClick={processVideo}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Generate Subtitles
              </button>
            </div>
          )}

          {(status === 'uploading' || status === 'processing') && (
            <div className="space-y-6">
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
                <p className="text-white text-lg mb-2">
                  {status === 'uploading' ? 'Uploading video...' : 'Processing subtitles...'}
                </p>
                <p className="text-purple-200 text-sm">This may take a few moments</p>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-purple-900/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-purple-200 text-sm text-center">{progress}%</p>
              </div>
            </div>
          )}

          {status === 'completed' && resultUrl && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <p className="text-white text-lg mb-2">Subtitles added successfully!</p>
                <p className="text-purple-200 text-sm">Your video is ready to download</p>
              </div>

              <video
                src={resultUrl}
                controls
                className="w-full rounded-lg shadow-lg"
              />

              <div className="flex gap-4">
                <a
                  href={resultUrl}
                  download={`subtitled_${file?.name}`}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Video
                </a>
                <button
                  onClick={resetApp}
                  className="flex-1 bg-white/10 text-white py-3 rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
                >
                  Process Another
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <p className="text-white text-lg mb-2">Processing failed</p>
                <p className="text-purple-200 text-sm">{errorMessage || 'Please try again'}</p>
              </div>

              <button
                onClick={resetApp}
                className="w-full bg-white/10 text-white py-3 rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-white/5 backdrop-blur rounded-lg p-4 text-center border border-white/10">
            <p className="text-purple-400 text-2xl font-bold mb-1">AI-Powered</p>
            <p className="text-purple-200 text-xs">Accurate transcription</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-lg p-4 text-center border border-white/10">
            <p className="text-purple-400 text-2xl font-bold mb-1">Dynamic</p>
            <p className="text-purple-200 text-xs">Animated styling</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-lg p-4 text-center border border-white/10">
            <p className="text-purple-400 text-2xl font-bold mb-1">Fast</p>
            <p className="text-purple-200 text-xs">Quick processing</p>
          </div>
        </div>
      </div>
    </div>
  );
}