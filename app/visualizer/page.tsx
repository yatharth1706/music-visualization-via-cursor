'use client';

import { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { BiSkipPrevious, BiSkipNext } from 'react-icons/bi';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export default function MusicVisualizer() {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const cleanupAudioContext = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      cleanupAudioContext();
      const objectUrl = URL.createObjectURL(file);
      setAudioSrc(objectUrl);
      setFileName(file.name);
      setCustomName(file.name.split('.').slice(0, -1).join('.'));
      setIsPlaying(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav']
    }
  });

  useEffect(() => {
    const loadedAudioSrc = searchParams.get('audioSrc');
    const loadedName = searchParams.get('name');
    if (loadedAudioSrc) {
      cleanupAudioContext();
      setAudioSrc(decodeURIComponent(loadedAudioSrc));
      setCustomName(loadedName ? decodeURIComponent(loadedName) : '');
      setFileName(loadedName ? decodeURIComponent(loadedName) : 'Loaded File');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!audioSrc || !audioRef.current) return;

    const audioElement = audioRef.current;

    const setupAudioContext = () => {
      cleanupAudioContext();
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    };

    setupAudioContext();

    return () => {
      cleanupAudioContext();
    };
  }, [audioSrc]);

  const togglePlay = () => {
    if (!audioRef.current || !audioContextRef.current) return;

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        console.log('Audio started playing');
        visualize();
      }).catch(error => console.error('Error playing audio:', error));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      console.log('Audio paused');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  };

  const visualize = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(15, 23, 42)'; // Tailwind's slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        const hue = i / bufferLength * 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const saveVisualization = () => {
    if (!audioSrc || !customName) return;

    const savedVisualizations = JSON.parse(localStorage.getItem('savedVisualizations') || '[]');
    savedVisualizations.push({
      name: customName,
      fileName: fileName,
      date: new Date().toISOString(),
      audioSrc: audioSrc
    });
    localStorage.setItem('savedVisualizations', JSON.stringify(savedVisualizations));
    alert('Visualization saved!');
    router.push('/'); // Changed from '/history' to '/'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
      <h1 className="text-4xl font-bold mb-8 text-slate-800">Music Visualizer</h1>
      <Link href="/" className="mb-4 text-blue-500 hover:text-blue-700">
        View History
      </Link>
      <div {...getRootProps()} className="mb-8 p-8 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-500 transition-colors">
        <input {...getInputProps()} />
        <p className="text-slate-600">Drag & drop an audio file here, or click to select one</p>
      </div>
      {audioSrc && (
        <div className="w-full max-w-3xl">
          <div className="mb-4">
            <p className="text-slate-700">File: {fileName}</p>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="mt-2 p-2 border border-slate-300 rounded"
              placeholder="Enter custom name"
            />
            <button
              onClick={saveVisualization}
              className="ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Save
            </button>
          </div>
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg bg-slate-800 p-6">
            <audio ref={audioRef} src={audioSrc} className="w-full" />
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => {/* Previous track logic */}}
                className="text-white hover:text-blue-500 transition-colors"
              >
                <BiSkipPrevious size={24} />
              </button>
              <button
                onClick={togglePlay}
                className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button
                onClick={() => {/* Next track logic */}}
                className="text-white hover:text-blue-500 transition-colors"
              >
                <BiSkipNext size={24} />
              </button>
            </div>
            <div className="flex items-center mt-4">
              <button onClick={toggleMute} className="text-white mr-2">
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full"
              />
            </div>
          </div>
          <canvas ref={canvasRef} width="800" height="200" className="w-full border border-slate-300 rounded-lg shadow-md" />
        </div>
      )}
    </div>
  );
}