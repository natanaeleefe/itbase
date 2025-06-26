// Custom QR Scanner with System Design
import QrScanner from 'qr-scanner';

class CustomQRScanner {
  constructor() {
    this.scanner = null;
    this.video = null;
    this.isScanning = false;
    this.onDetectedCallback = null;
    this.onErrorCallback = null;
    this.animationFrame = null;
    this.permissionGranted = false;
  }

  async init(videoElement, onDetected, onError) {
    this.video = videoElement;
    this.onDetectedCallback = onDetected;
    this.onErrorCallback = onError;

    try {
      // Show permission request UI
      this.showPermissionRequest();
      
      // Request camera permission with custom UI
      await this.requestCameraPermission();
      
      // Hide permission UI and show scanner
      this.hidePermissionRequest();
      this.showScannerInterface();
      
      // Initialize QR Scanner with custom settings
      this.scanner = new QrScanner(
        this.video,
        (result) => this.handleQRDetected(result),
        {
          returnDetailedScanResult: true,
          highlightScanRegion: false,
          highlightCodeOutline: false,
          preferredCamera: 'environment',
          maxScansPerSecond: 5,
          calculateScanRegion: () => {
            const frame = document.querySelector('.qr-frame');
            if (frame) {
              const rect = frame.getBoundingClientRect();
              const videoRect = this.video.getBoundingClientRect();
              return {
                x: Math.max(0, (rect.left - videoRect.left) / videoRect.width),
                y: Math.max(0, (rect.top - videoRect.top) / videoRect.height),
                width: Math.min(1, rect.width / videoRect.width),
                height: Math.min(1, rect.height / videoRect.height)
              };
            }
            return { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
          }
        }
      );

      // Start scanning animation
      this.startScanAnimation();
      
      return true;
    } catch (error) {
      console.error('Error initializing QR scanner:', error);
      this.hidePermissionRequest();
      if (this.onErrorCallback) {
        this.onErrorCallback('Erro ao inicializar scanner: ' + error.message);
      }
      return false;
    }
  }

  showPermissionRequest() {
    const overlay = document.querySelector('.qr-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div class="permission-request">
          <div class="permission-icon">
            <iconify-icon icon="mdi:camera"></iconify-icon>
          </div>
          <h3>Permissão da Câmera</h3>
          <p>Este aplicativo precisa acessar sua câmera para escanear códigos QR</p>
          <div class="permission-loading">
            <div class="loading-spinner"></div>
            <span>Aguardando permissão...</span>
          </div>
        </div>
      `;
      overlay.style.display = 'flex';
    }
  }

  hidePermissionRequest() {
    const overlay = document.querySelector('.qr-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  showScannerInterface() {
    const overlay = document.querySelector('.qr-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div class="qr-scanner-interface">
          <div class="qr-frame">
            <div class="qr-corner top-left"></div>
            <div class="qr-corner top-right"></div>
            <div class="qr-corner bottom-left"></div>
            <div class="qr-corner bottom-right"></div>
            <div class="qr-scan-line"></div>
          </div>
          <div class="qr-instruction">
            <iconify-icon icon="mdi:qrcode-scan"></iconify-icon>
            <p>Posicione o QR Code dentro do quadro</p>
          </div>
          <div class="qr-controls">
            <button class="qr-control-btn" id="qrFlashBtn">
              <iconify-icon icon="mdi:flash-off"></iconify-icon>
            </button>
            <button class="qr-control-btn" id="qrSwitchBtn">
              <iconify-icon icon="mdi:camera-flip"></iconify-icon>
            </button>
          </div>
        </div>
      `;
      overlay.style.display = 'flex';
      
      // Setup control buttons
      this.setupControlButtons();
    }
  }

  setupControlButtons() {
    const flashBtn = document.getElementById('qrFlashBtn');
    const switchBtn = document.getElementById('qrSwitchBtn');
    
    if (flashBtn) {
      flashBtn.addEventListener('click', () => this.toggleFlash());
    }
    
    if (switchBtn) {
      switchBtn.addEventListener('click', () => this.switchCamera());
    }
  }

  async requestCameraPermission() {
    try {
      // Check if permission is already granted
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        if (permission.state === 'granted') {
          this.permissionGranted = true;
          return true;
        }
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      this.permissionGranted = true;
      return true;
    } catch (error) {
      this.permissionGranted = false;
      
      let errorMessage = 'Permissão de câmera negada';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Câmera não suportada neste navegador.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Câmera está sendo usada por outro aplicativo.';
      }
      
      throw new Error(errorMessage);
    }
  }

  async start() {
    if (!this.scanner) {
      throw new Error('Scanner não inicializado');
    }

    if (!this.permissionGranted) {
      throw new Error('Permissão de câmera não concedida');
    }

    try {
      await this.scanner.start();
      this.isScanning = true;
      this.startScanAnimation();
      this.startPulseAnimation();
    } catch (error) {
      console.error('Error starting scanner:', error);
      throw new Error('Erro ao iniciar scanner: ' + error.message);
    }
  }

  stop() {
    if (this.scanner) {
      this.scanner.stop();
      this.isScanning = false;
    }
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.stopPulseAnimation();
  }

  destroy() {
    this.stop();
    if (this.scanner) {
      this.scanner.destroy();
      this.scanner = null;
    }
  }

  handleQRDetected(result) {
    if (this.onDetectedCallback) {
      // Add success animation
      this.showSuccessAnimation();
      
      // Vibrate if available
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      // Call the callback with the detected data
      setTimeout(() => {
        this.onDetectedCallback(result.data);
      }, 500);
    }
  }

  startScanAnimation() {
    const scanLine = document.querySelector('.qr-scan-line');
    if (!scanLine) return;

    let position = 0;
    const animate = () => {
      if (!this.isScanning) return;
      
      position += 1.5;
      if (position > 100) position = 0;
      
      scanLine.style.top = `${position}%`;
      
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
  }

  startPulseAnimation() {
    const frame = document.querySelector('.qr-frame');
    if (frame) {
      frame.classList.add('qr-scanning');
    }
  }

  stopPulseAnimation() {
    const frame = document.querySelector('.qr-frame');
    if (frame) {
      frame.classList.remove('qr-scanning');
    }
  }

  showSuccessAnimation() {
    const frame = document.querySelector('.qr-frame');
    const instruction = document.querySelector('.qr-instruction');
    
    if (frame) {
      frame.classList.add('qr-success');
      frame.classList.remove('qr-scanning');
    }
    
    if (instruction) {
      instruction.innerHTML = `
        <iconify-icon icon="mdi:check-circle" style="color: #34C759;"></iconify-icon>
        <p style="color: #34C759;">QR Code detectado com sucesso!</p>
      `;
    }
    
    setTimeout(() => {
      if (frame) {
        frame.classList.remove('qr-success');
      }
    }, 1000);
  }

  async switchCamera() {
    if (this.scanner) {
      try {
        const currentCamera = await this.scanner.getCamera();
        const newCamera = currentCamera === 'environment' ? 'user' : 'environment';
        await this.scanner.setCamera(newCamera);
        
        // Add switch animation
        const switchBtn = document.getElementById('qrSwitchBtn');
        if (switchBtn) {
          switchBtn.style.transform = 'rotateY(180deg)';
          setTimeout(() => {
            switchBtn.style.transform = 'rotateY(0deg)';
          }, 300);
        }
      } catch (error) {
        console.error('Error switching camera:', error);
      }
    }
  }

  async toggleFlash() {
    if (this.scanner) {
      try {
        const flashBtn = document.getElementById('qrFlashBtn');
        const icon = flashBtn?.querySelector('iconify-icon');
        
        await this.scanner.toggleFlash();
        
        if (icon) {
          const isFlashOn = icon.getAttribute('icon') === 'mdi:flash-off';
          icon.setAttribute('icon', isFlashOn ? 'mdi:flash' : 'mdi:flash-off');
          
          // Add flash animation
          flashBtn.style.transform = 'scale(1.2)';
          setTimeout(() => {
            flashBtn.style.transform = 'scale(1)';
          }, 200);
        }
      } catch (error) {
        console.error('Error toggling flash:', error);
      }
    }
  }
}

export default CustomQRScanner;