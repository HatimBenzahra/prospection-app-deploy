import { io } from 'socket.io-client';

export class AudioConnectionTester {
  private socket: any = null;

  async testConnection() {
    console.log('🔍 Testing audio streaming connection...');
    
    try {
      // Test 1: Socket.IO Connection
      console.log('📡 Testing Socket.IO connection...');
      const SERVER_HOST = import.meta.env.VITE_SERVER_HOST || window.location.hostname;
      const API_PORT = import.meta.env.VITE_API_PORT || '3000';
      this.socket = io(`https://${SERVER_HOST}:${API_PORT}`, {
        secure: true,
        transports: ['websocket', 'polling'],
        forceNew: true,
        upgrade: true,
      });
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout after 5 seconds'));
        }, 5000);

        this.socket.on('connect', () => {
          console.log('✅ Socket.IO connected successfully');
          console.log('🔗 Socket ID:', this.socket.id);
          clearTimeout(timeout);
          
          // Test 2: WebRTC Support
          this.testWebRTCSupport();
          
          // Test 3: Media Devices Support
          this.testMediaDevicesSupport();
          
          resolve(true);
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('❌ Socket.IO connection failed:', error);
          clearTimeout(timeout);
          reject(error);
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('🔌 Socket.IO disconnected:', reason);
        });
      });

    } catch (error) {
      console.error('❌ Connection test failed:', error);
      throw error;
    }
  }

  testWebRTCSupport() {
    console.log('🌐 Testing WebRTC support...');
    
    if (typeof RTCPeerConnection !== 'undefined') {
      console.log('✅ RTCPeerConnection is supported');
      
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        console.log('✅ RTCPeerConnection created successfully');
        pc.close();
      } catch (error) {
        console.error('❌ RTCPeerConnection creation failed:', error);
      }
    } else {
      console.error('❌ RTCPeerConnection not supported');
    }

    if (typeof MediaRecorder !== 'undefined') {
      console.log('✅ MediaRecorder is supported');
    } else {
      console.error('❌ MediaRecorder not supported');
    }
  }

  async testMediaDevicesSupport() {
    console.log('🎤 Testing media devices support...');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia not supported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('✅ Microphone access granted');
      console.log('🎵 Audio tracks:', stream.getAudioTracks().length);
      
      // Test MediaRecorder with the stream
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        console.log('✅ WebM/Opus recording supported');
        
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        recorder.ondataavailable = (event) => {
          console.log('📊 Audio data chunk received:', event.data.size, 'bytes');
        };
        
        recorder.start(100);
        
        setTimeout(() => {
          recorder.stop();
          console.log('✅ MediaRecorder test completed');
        }, 1000);
      } else {
        console.warn('⚠️ WebM/Opus not supported, checking alternatives...');
        
        const supportedTypes = [
          'audio/webm',
          'audio/mp4',
          'audio/ogg',
          'audio/wav'
        ];
        
        supportedTypes.forEach(type => {
          if (MediaRecorder.isTypeSupported(type)) {
            console.log(`✅ ${type} is supported`);
          }
        });
      }
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('❌ Microphone access denied or failed:', error);
    }
  }

  testSocketEvents() {
    if (!this.socket) {
      console.error('❌ Socket not connected');
      return;
    }

    console.log('🧪 Testing socket events...');
    
    // Test joining a room
    this.socket.emit('join-audio-room', { 
      userId: 'test-user', 
      roomId: 'test-room' 
    });
    
    // Listen for custom events
    this.socket.on('audio-offer', (data: any) => {
      console.log('📨 Received audio-offer:', data);
    });
    
    this.socket.on('audio-answer', (data: any) => {
      console.log('📨 Received audio-answer:', data);
    });
    
    this.socket.on('ice-candidate', (data: any) => {
      console.log('📨 Received ice-candidate:', data);
    });
    
    this.socket.on('audio-chunk', (data: any) => {
      console.log('📨 Received audio-chunk:', data);
    });
    
    // Test sending a test message
    this.socket.emit('test-message', { message: 'Hello from audio tester!' });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('🔌 Test connection closed');
    }
  }
}

// Helper function to run all tests
export async function runAudioTests() {
  const tester = new AudioConnectionTester();
  
  try {
    await tester.testConnection();
    tester.testSocketEvents();
    
    // Keep connection alive for a few seconds to test events
    setTimeout(() => {
      tester.disconnect();
    }, 5000);
    
  } catch (error) {
    console.error('❌ Audio tests failed:', error);
    tester.disconnect();
  }
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).runAudioTests = runAudioTests;
  (window as any).AudioConnectionTester = AudioConnectionTester;
}