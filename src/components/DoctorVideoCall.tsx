import React, { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

interface DoctorVideoCallProps {
  doctorName: string;
  department: string;
  isActive: boolean;
}

const DoctorVideoCall: React.FC<DoctorVideoCallProps> = ({
  doctorName,
  department,
  isActive
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  // Cloudflare Calls configuration
  const CF_CALLS_APP_ID = 'cc76d619d54422a6cf5c32c26f9ec4ca';
  const CF_CALLS_APP_SECRET = '344dc3edf44b8a5fa98a42eb7df61448ae86d720712ffaeea42251367bb6efc6';
  const TURN_SERVICE_ID = '07096796fca930ffe4fcbee26f396c93';
  const TURN_SERVICE_TOKEN = '063e6bb9f2e64b4a6d730b735a888dc277a99f78672af31e91e4f66780dad87c';

  useEffect(() => {
    if (isActive) {
      initializeCall();
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [isActive]);

  const initializeCall = async () => {
    try {
      setIsConnecting(true);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection with TURN servers
      const pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: `turn:${TURN_SERVICE_ID}.cloudflarestream.com:3478`,
            username: TURN_SERVICE_ID,
            credential: TURN_SERVICE_TOKEN
          },
          {
            urls: 'stun:stun.cloudflare.com:3478'
          }
        ]
      });

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsConnected(false);
          setIsConnecting(false);
        }
      };

      setPeerConnection(pc);

      // Simulate doctor connection (in real implementation, this would be handled by signaling server)
      setTimeout(() => {
        simulateDoctorConnection(pc);
      }, 2000);

    } catch (error) {
      console.error('Failed to initialize call:', error);
      setIsConnecting(false);
    }
  };

  const simulateDoctorConnection = async (pc: RTCPeerConnection) => {
    try {
      // Create mock doctor video stream
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;
      
      // Draw doctor avatar
      const drawDoctorFrame = () => {
        // Clear canvas
        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw doctor avatar
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(220, 120, 200, 240);
        
        // Draw face
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(320, 200, 60, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(300, 185, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(340, 185, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw smile
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(320, 200, 25, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Draw stethoscope
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(320, 280, 20, 0, Math.PI);
        ctx.stroke();
        
        // Add text
        ctx.fillStyle = '#1f2937';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(doctorName, 320, 400);
        ctx.font = '16px Arial';
        ctx.fillText(department, 320, 430);
        
        // Add "LIVE" indicator
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(20, 20, 60, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText('LIVE', 50, 40);
      };
      
      // Animate the doctor video
      const animate = () => {
        drawDoctorFrame();
        requestAnimationFrame(animate);
      };
      animate();
      
      const mockStream = canvas.captureStream(30);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = mockStream;
      }
      
      setIsConnected(true);
      setIsConnecting(false);
      
    } catch (error) {
      console.error('Failed to simulate doctor connection:', error);
      setIsConnecting(false);
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  };


  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Doctor's video (main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* Connection status overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-3 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-medium">医師に接続中...</p>
            <p className="text-sm opacity-75">Cloudflare Calls経由</p>
          </div>
        </div>
      )}
      
      {/* Doctor info overlay */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
        <h3 className="font-bold text-lg">{doctorName}</h3>
        <p className="text-sm opacity-90">{department}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs">
            {isConnected ? 'オンライン' : isConnecting ? '接続中...' : 'オフライン'}
          </span>
        </div>
      </div>
      
      {/* Local video (picture-in-picture) */}
      <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Cloudflare Calls branding */}
      <div className="absolute top-4 right-4 bg-orange-500/20 backdrop-blur-sm rounded-lg px-3 py-1">
        <p className="text-white text-xs font-medium">Powered by Cloudflare Calls</p>
      </div>
    </div>
  );
};

export default DoctorVideoCall;