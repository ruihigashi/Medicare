import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

interface VRMViewerProps {
  isSpeaking?: boolean;
}

export interface VRMViewerRef {
  startSpeaking: () => void;
  stopSpeaking: () => void;
}

const VRMViewer = forwardRef<VRMViewerRef, VRMViewerProps>(({ isSpeaking = false }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speakingRef = useRef<boolean>(false);
  const mouthAnimationRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    startSpeaking: () => {
      speakingRef.current = true;
    },
    stopSpeaking: () => {
      speakingRef.current = false;
      mouthAnimationRef.current = 0;
    }
  }));

  const initializeScene = () => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    
    // Create gradient background
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    
    // Create simple gradient background
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#f8fafc'); // Light gray top
    gradient.addColorStop(1, '#e2e8f0'); // Slightly darker gray bottom
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    const backgroundTexture = new THREE.CanvasTexture(canvas);
    scene.background = backgroundTexture;
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    // スマホではより近い位置にカメラを配置
    const isMobile = width < 768;
    if (isMobile) {
      camera.position.set(0, 1.6, -0.4);
      camera.lookAt(0, 1.6, 0);
    } else {
      camera.position.set(0, 1.7, -0.8);
      camera.lookAt(0, 1.5, 0);
    }
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 3, 2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Key light (main lighting)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(-2, 2, 1);
    scene.add(keyLight);
    
    // Rim light (edge lighting)
    const rimLight = new THREE.DirectionalLight(0x6366f1, 0.4);
    rimLight.position.set(-1, 1, -2);
    scene.add(rimLight);
    
    // Fill light (soft fill)
    const fillLight = new THREE.DirectionalLight(0x8b5cf6, 0.3);
    fillLight.position.set(1, -1, 1);
    scene.add(fillLight);

    // Subtle ground plane with gradient
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 256;
    groundCanvas.height = 256;
    const groundContext = groundCanvas.getContext('2d')!;
    
    const groundGradient = groundContext.createRadialGradient(128, 128, 0, 128, 128, 128);
    groundGradient.addColorStop(0, 'rgba(148, 163, 184, 0.1)'); // Subtle gray center
    groundGradient.addColorStop(1, 'rgba(148, 163, 184, 0.05)'); // Transparent edges
    
    groundContext.fillStyle = groundGradient;
    groundContext.fillRect(0, 0, 256, 256);
    
    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      map: groundTexture,
      transparent: true,
      opacity: 0.6
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Start animation loop
    animate();
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    animationFrameRef.current = requestAnimationFrame(animate);

    // Update VRM
    if (vrmRef.current) {
      const time = Date.now() * 0.001;
      
      // Subtle breathing and idle animation
      vrmRef.current.scene.rotation.y = Math.sin(time * 0.3) * 0.05;
      vrmRef.current.scene.position.y = -0.3 + Math.sin(time * 0.8) * 0.02; // Gentle breathing
      
      // Head movement and mouth animation
      if (vrmRef.current.humanoid) {
        // Natural arm positions - relaxed at sides
        const leftUpperArm = vrmRef.current.humanoid.getNormalizedBoneNode('leftUpperArm');
        const rightUpperArm = vrmRef.current.humanoid.getNormalizedBoneNode('rightUpperArm');
        const leftLowerArm = vrmRef.current.humanoid.getNormalizedBoneNode('leftLowerArm');
        const rightLowerArm = vrmRef.current.humanoid.getNormalizedBoneNode('rightLowerArm');
        const leftHand = vrmRef.current.humanoid.getNormalizedBoneNode('leftHand');
        const rightHand = vrmRef.current.humanoid.getNormalizedBoneNode('rightHand');
        const spine = vrmRef.current.humanoid.getNormalizedBoneNode('spine');
        const leftUpperLeg = vrmRef.current.humanoid.getNormalizedBoneNode('leftUpperLeg');
        const rightUpperLeg = vrmRef.current.humanoid.getNormalizedBoneNode('rightUpperLeg');
        
        // Set natural, relaxed arm positions
        if (leftUpperArm) {
          leftUpperArm.rotation.x = 0; // Natural down position
          leftUpperArm.rotation.z = 0.05; // Very slightly away from body
          leftUpperArm.rotation.y = 0; // No rotation
        }
        if (rightUpperArm) {
          rightUpperArm.rotation.x = 0; // Natural down position
          rightUpperArm.rotation.z = -0.05; // Very slightly away from body
          rightUpperArm.rotation.y = 0; // No rotation
        }
        
        // Natural elbow bend
        if (leftLowerArm) {
          leftLowerArm.rotation.x = -0.1; // Slight natural bend
        }
        if (rightLowerArm) {
          rightLowerArm.rotation.x = -0.1; // Slight natural bend
        }
        
        // Relaxed hand positions
        if (leftHand) {
          leftHand.rotation.x = 0;
          leftHand.rotation.z = 0;
        }
        if (rightHand) {
          rightHand.rotation.x = 0;
          rightHand.rotation.z = 0;
        }
        
        // Natural spine posture with subtle breathing
        if (spine) {
          spine.rotation.x = -0.03 + Math.sin(time * 0.8) * 0.01; // Slight forward lean with breathing
          spine.rotation.y = Math.sin(time * 0.3) * 0.02; // Subtle side-to-side movement
        }
        
        // Stable leg positioning
        if (leftUpperLeg) {
          leftUpperLeg.rotation.z = 0.02; // Very slight outward
        }
        if (rightUpperLeg) {
          rightUpperLeg.rotation.z = -0.02; // Very slight outward
        }
        
        const head = vrmRef.current.humanoid.getNormalizedBoneNode('head');
        if (head) {
          // Natural head movement - looking slightly down and gentle side movement
          head.rotation.x = Math.sin(time * 0.6) * 0.02 - 0.08; // Gentle nod with slight downward gaze
          head.rotation.y = Math.cos(time * 0.4) * 0.03; // Gentle side-to-side look
          head.rotation.z = Math.sin(time * 0.5) * 0.01; // Very subtle head tilt
        }
        
        // Mouth animation when speaking
        if (speakingRef.current && vrmRef.current.expressionManager) {
          mouthAnimationRef.current += 0.3;
          const mouthValue = Math.abs(Math.sin(mouthAnimationRef.current)) * 0.8;
          
          // Try different mouth expression names
          const mouthExpressions = ['aa', 'a', 'mouth_a', 'A', 'Aa'];
          for (const expr of mouthExpressions) {
            try {
              vrmRef.current.expressionManager.setValue(expr, mouthValue);
              break;
            } catch (e) {
              // Continue to next expression name
            }
          }
          
          // Add slight head movement when speaking
          if (head) {
            head.rotation.x += Math.sin(mouthAnimationRef.current * 2) * 0.02;
            head.rotation.z = Math.sin(mouthAnimationRef.current * 1.5) * 0.01;
          }
        } else if (vrmRef.current.expressionManager) {
          // Reset mouth when not speaking
          const mouthExpressions = ['aa', 'a', 'mouth_a', 'A', 'Aa'];
          for (const expr of mouthExpressions) {
            try {
              vrmRef.current.expressionManager.setValue(expr, 0);
            } catch (e) {
              // Continue to next expression name
            }
          }
        }
      } else {
        // Fallback avatar animations
        const head = vrmRef.current.scene.children.find((child: any) => child.position.y > 1.6);
        if (head) {
          // Simple head movement for fallback avatar
          head.rotation.x = Math.sin(time * 0.6) * 0.02 - 0.05;
          head.rotation.y = Math.cos(time * 0.4) * 0.03;
          
          // Simple mouth animation simulation for fallback
          if (speakingRef.current) {
            mouthAnimationRef.current += 0.3;
            head.scale.y = 1 + Math.abs(Math.sin(mouthAnimationRef.current)) * 0.05;
          } else {
            head.scale.y = 1;
          }
        }
      }

      if (vrmRef.current.update) {
        vrmRef.current.update(0.016);
      }
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const loadVRM = async () => {
    if (!sceneRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Remove existing VRM
      if (vrmRef.current) {
        sceneRef.current.remove(vrmRef.current.scene);
        vrmRef.current = null;
      }

      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));

      // Setup DRACOLoader for compressed meshes
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      loader.setDRACOLoader(dracoLoader);

      // デプロイ環境対応のパス解決
      // VRMファイルのパスを修正
      const vrmPath = '/joy.vrm';
      
      console.log('VRM loading attempt - Path:', vrmPath);
      console.log('VRM loading attempt - Full URL:', window.location.origin + vrmPath);
      
      try {
        console.log(`🔄 Loading VRM from: ${vrmPath}`);
        
        // Check if file exists first
        const checkResponse = await fetch(vrmPath, { method: 'HEAD' });
        if (!checkResponse.ok) {
          throw new Error(`VRMファイルが見つかりません (${checkResponse.status})`);
        }
        
        const gltf = await loader.loadAsync(vrmPath);
        console.log(`✅ Successfully loaded VRM from: ${vrmPath}`);
        
        const vrm = gltf.userData.vrm as VRM;

        if (!vrm) {
          throw new Error('VRMデータが見つかりません');
        }

        // Position the VRM
        const isMobile = mountRef.current?.clientWidth && mountRef.current.clientWidth < 768;
        if (isMobile) {
          vrm.scene.position.set(0, -0.1, 0); // スマホでは少し高い位置
          vrm.scene.scale.set(0.9, 0.9, 0.9); // スマホでは少し小さく
        } else {
          vrm.scene.position.set(0, -0.3, 0);
          vrm.scene.scale.set(1.3, 1.3, 1.3); // デスクトップでは30%拡大
        }
        vrm.scene.rotation.y = Math.PI; // Try 180 degrees rotation
        
        vrm.scene.castShadow = true;
        vrm.scene.receiveShadow = true;

        // Traverse and enable shadows
        vrm.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        sceneRef.current.add(vrm.scene);
        vrmRef.current = vrm;

        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ VRM loading failed:', error);
        
        // Create fallback 3D avatar when VRM fails
        createFallbackAvatar();
        
        let errorMessage = 'VRMファイルの読み込みに失敗しました。';
        if (error instanceof Error) {
          if (error.message.includes('404') || error.message.includes('Not Found')) {
            errorMessage = 'VRMファイルが見つかりません。フォールバック3Dアバターを表示します。';
          } else if (error.message.includes('CORS')) {
            errorMessage = 'ファイルアクセスが制限されています。フォールバック3Dアバターを表示します。';
          } else if (error.message.includes('JSON')) {
            errorMessage = 'VRMファイルの形式が正しくありません。フォールバック3Dアバターを表示します。';
          } else {
            errorMessage = `読み込みエラー: ${error.message}。フォールバック3Dアバターを表示します。`;
          }
        }
        
        console.warn('🎭 Using fallback 3D avatar due to VRM loading failure');
        setError(null); // Don't show error since we have fallback
        setIsLoading(false);
      }
    } catch (err) {
      console.error('VRM loading setup failed:', err);
      createFallbackAvatar();
      setError(null); // Don't show error since we have fallback
      setIsLoading(false);
    }
  };

  const createFallbackAvatar = () => {
    if (!sceneRef.current) return;

    console.log('🎭 Creating fallback 3D avatar...');

    // Remove existing VRM if any
    if (vrmRef.current) {
      sceneRef.current.remove(vrmRef.current.scene);
      vrmRef.current = null;
    }

    // Create a simple 3D avatar using basic geometries
    const avatarGroup = new THREE.Group();

    // Head
    const headGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.65, 0);
    head.castShadow = true;
    avatarGroup.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.05, 1.68, 0.12);
    avatarGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.05, 1.68, 0.12);
    avatarGroup.add(rightEye);

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.6, 16);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4f46e5 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 1.2, 0);
    body.castShadow = true;
    avatarGroup.add(body);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 12);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.2, 1.1, 0);
    leftArm.rotation.z = 0.3;
    leftArm.castShadow = true;
    avatarGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.2, 1.1, 0);
    rightArm.rotation.z = -0.3;
    rightArm.castShadow = true;
    avatarGroup.add(rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.08, 0.6, 0);
    leftLeg.castShadow = true;
    avatarGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.08, 0.6, 0);
    rightLeg.castShadow = true;
    avatarGroup.add(rightLeg);

    // Add to scene
    const isMobile = mountRef.current?.clientWidth && mountRef.current.clientWidth < 768;
    if (isMobile) {
      avatarGroup.position.set(0, 0.1, 0); // スマホでは顔が窓枠に来るように調整
      avatarGroup.scale.set(0.7, 0.7, 0.7); // スマホでは小さく
    } else {
      avatarGroup.position.set(0, -0.3, 0);
      avatarGroup.scale.set(1.0, 1.0, 1.0); // デスクトップでは標準サイズ
    }
    sceneRef.current.add(avatarGroup);

    // Store reference for animation
    const fallbackVRM = {
      scene: avatarGroup,
      update: () => {},
      humanoid: null,
      expressionManager: null
    };
    
    vrmRef.current = fallbackVRM as any;

    console.log('✅ Fallback 3D avatar created successfully');
  };



  const handleResize = () => {
    if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };

  useEffect(() => {
    initializeScene();
    window.addEventListener('resize', handleResize);
    
    // Auto-load test.vrm on component mount with delay to ensure scene is ready
    const timer = setTimeout(() => {
      loadVRM();
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && mountRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (vrmRef.current) {
        if (sceneRef.current) {
          sceneRef.current.remove(vrmRef.current.scene);
        }
        vrmRef.current = null;
      }
    };
  }, []);

  // Update speaking state
  useEffect(() => {
    speakingRef.current = isSpeaking;
  }, [isSpeaking]);

  return (
    <div ref={mountRef} className="w-full h-full min-h-[200px] sm:min-h-[300px] lg:min-h-[400px] relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-white text-center">
            <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>VRMファイルを読み込み中...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-lg p-6 text-white text-center max-w-md">
            <p className="text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* Default message when no VRM is loaded */}
      {!vrmRef.current && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/60">
            <div className="w-24 h-24 border-4 border-white/20 border-dashed rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-60"></div>
            </div>
            <p className="text-lg mb-2">🤖 AIアバター</p>
            <p className="text-sm opacity-80">VRMファイルを読み込み中...</p>
            <button
              onClick={loadVRM}
              className="mt-4 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-white/80 hover:text-white transition-all"
            >
              🔄 再読み込み
            </button>
          </div>
        </div>
      )}

      {/* Success message for fallback avatar */}
      {vrmRef.current && !error && (
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">🤖 AIアバター準備完了</span>
          </div>
        </div>
      )}
    </div>
  );
});

VRMViewer.displayName = 'VRMViewer';

export default VRMViewer;