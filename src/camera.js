// Custom Camera System with iOS Design
import CustomQRScanner from './qr-scanner.js';

class CameraSystem {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.context = null;
    this.currentCamera = 'user'; // 'user' for front, 'environment' for back
    this.flashEnabled = false;
    this.isQRMode = false;
    this.qrScanner = null;
    this.onCaptureCallback = null;
    this.onQRDetectedCallback = null;
    this.init();
  }

  init() {
    this.video = document.getElementById('cameraVideo');
    this.canvas = document.getElementById('cameraCanvas');
    this.context = this.canvas?.getContext('2d');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close camera button
    document.getElementById('closeCameraBtn')?.addEventListener('click', () => {
      this.closeCamera();
    });

    // Switch camera button
    document.getElementById('switchCameraBtn')?.addEventListener('click', () => {
      this.switchCamera();
    });

    // Flash toggle button
    document.getElementById('flashBtn')?.addEventListener('click', () => {
      this.toggleFlash();
    });

    // Capture button
    document.getElementById('captureBtn')?.addEventListener('click', () => {
      this.capturePhoto();
    });

    // Gallery button
    document.getElementById('galleryBtn')?.addEventListener('click', () => {
      this.openGallery();
    });

    // Open camera buttons
    document.getElementById('openCamera')?.addEventListener('click', () => {
      this.openCamera('photo');
    });

    document.getElementById('scanQR')?.addEventListener('click', () => {
      this.openCamera('qr');
    });
  }

  async openCamera(mode = 'photo') {
    try {
      this.isQRMode = mode === 'qr';
      
      // Update UI based on mode
      const cameraTitle = document.getElementById('cameraTitle');
      const qrOverlay = document.getElementById('qrOverlay');
      
      if (this.isQRMode) {
        cameraTitle.textContent = 'Escanear QR Code';
        qrOverlay.style.display = 'flex';
        
        // Initialize custom QR scanner
        await this.startCustomQRScanner();
      } else {
        cameraTitle.textContent = 'Câmera';
        qrOverlay.style.display = 'none';
        this.stopQRScanner();
        
        // Start regular camera
        await this.startCamera();
      }
      
      // Show camera modal
      const cameraModal = document.getElementById('cameraModal');
      cameraModal.classList.add('show');
      
      // Add iOS-style animations
      this.addCameraAnimations();
      
    } catch (error) {
      console.error('Error opening camera:', error);
      this.showToast('Erro ao acessar a câmera: ' + error.message, 'error');
    }
  }

  async startCustomQRScanner() {
    try {
      // Create QR scanner instance
      this.qrScanner = new CustomQRScanner();
      
      // Initialize with callbacks
      const success = await this.qrScanner.init(
        this.video,
        (data) => {
          if (this.onQRDetectedCallback) {
            this.onQRDetectedCallback(data);
          }
          // Close camera after successful scan
          setTimeout(() => {
            this.closeCamera();
          }, 1000);
        },
        (error) => {
          this.showToast(error, 'error');
        }
      );
      
      if (success) {
        await this.qrScanner.start();
      }
      
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      this.showToast('Erro ao iniciar scanner QR: ' + error.message, 'error');
    }
  }

  async startCamera() {
    try {
      // Stop existing stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: this.currentCamera,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      
      // Setup canvas dimensions
      this.video.addEventListener('loadedmetadata', () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
      });

    } catch (error) {
      throw new Error('Não foi possível acessar a câmera: ' + error.message);
    }
  }

  async switchCamera() {
    try {
      if (this.isQRMode && this.qrScanner) {
        await this.qrScanner.switchCamera();
      } else {
        this.currentCamera = this.currentCamera === 'user' ? 'environment' : 'user';
        await this.startCamera();
      }
      
      // Add switch animation
      const switchBtn = document.getElementById('switchCameraBtn');
      switchBtn.style.transform = 'rotateY(180deg)';
      setTimeout(() => {
        switchBtn.style.transform = 'rotateY(0deg)';
      }, 300);
      
    } catch (error) {
      console.error('Error switching camera:', error);
      this.showToast('Erro ao trocar câmera', 'error');
    }
  }

  async toggleFlash() {
    try {
      if (this.isQRMode && this.qrScanner) {
        await this.qrScanner.toggleFlash();
      } else {
        const track = this.stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if (capabilities.torch) {
          this.flashEnabled = !this.flashEnabled;
          await track.applyConstraints({
            advanced: [{ torch: this.flashEnabled }]
          });
          
          // Update flash button icon
          const flashBtn = document.getElementById('flashBtn');
          const icon = flashBtn.querySelector('iconify-icon');
          icon.setAttribute('icon', this.flashEnabled ? 'mdi:flash' : 'mdi:flash-off');
          
          // Add flash animation
          flashBtn.style.transform = 'scale(1.2)';
          setTimeout(() => {
            flashBtn.style.transform = 'scale(1)';
          }, 200);
          
        } else {
          this.showToast('Flash não disponível neste dispositivo', 'warning');
        }
      }
    } catch (error) {
      console.error('Error toggling flash:', error);
      this.showToast('Erro ao controlar flash', 'error');
    }
  }

  capturePhoto() {
    if (!this.video || !this.canvas || !this.context) return;

    try {
      // Set canvas size to video size
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      
      // Draw video frame to canvas
      this.context.drawImage(this.video, 0, 0);
      
      // Convert to blob
      this.canvas.toBlob((blob) => {
        if (blob && this.onCaptureCallback) {
          this.onCaptureCallback(blob);
        }
        this.closeCamera();
      }, 'image/jpeg', 0.9);
      
      // Add capture animation
      this.addCaptureAnimation();
      
    } catch (error) {
      console.error('Error capturing photo:', error);
      this.showToast('Erro ao capturar foto', 'error');
    }
  }

  openGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && this.onCaptureCallback) {
        this.onCaptureCallback(file);
        this.closeCamera();
      }
    });
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  stopQRScanner() {
    if (this.qrScanner) {
      this.qrScanner.destroy();
      this.qrScanner = null;
    }
  }

  closeCamera() {
    // Stop video stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Stop QR scanner
    this.stopQRScanner();
    
    // Hide modal
    const cameraModal = document.getElementById('cameraModal');
    cameraModal.classList.remove('show');
    
    // Reset flash
    this.flashEnabled = false;
    const flashBtn = document.getElementById('flashBtn');
    const icon = flashBtn?.querySelector('iconify-icon');
    if (icon) {
      icon.setAttribute('icon', 'mdi:flash-off');
    }
  }

  addCameraAnimations() {
    // Animate camera controls
    const controls = document.querySelectorAll('.camera-control-btn');
    controls.forEach((control, index) => {
      control.style.opacity = '0';
      control.style.transform = 'scale(0.8)';
      setTimeout(() => {
        control.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        control.style.opacity = '1';
        control.style.transform = 'scale(1)';
      }, index * 100);
    });

    // Animate capture button
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
      captureBtn.style.opacity = '0';
      captureBtn.style.transform = 'scale(0.5)';
      setTimeout(() => {
        captureBtn.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        captureBtn.style.opacity = '1';
        captureBtn.style.transform = 'scale(1)';
      }, 300);
    }
  }

  addCaptureAnimation() {
    // Flash effect
    const viewport = document.querySelector('.camera-viewport');
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      opacity: 0;
      pointer-events: none;
      z-index: 1000;
    `;
    
    viewport.appendChild(flash);
    
    // Animate flash
    flash.style.transition = 'opacity 0.1s ease';
    flash.style.opacity = '0.8';
    
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        viewport.removeChild(flash);
      }, 100);
    }, 100);

    // Animate capture button
    const captureBtn = document.getElementById('captureBtn');
    const ring = captureBtn.querySelector('.capture-ring');
    const inner = captureBtn.querySelector('.capture-inner');
    
    ring.style.transform = 'scale(1.2)';
    inner.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      ring.style.transform = 'scale(1)';
      inner.style.transform = 'scale(1)';
    }, 200);
  }

  showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
      success: 'mdi:check-circle',
      error: 'mdi:alert-circle',
      warning: 'mdi:alert',
      info: 'mdi:information'
    };
    
    toast.innerHTML = `
      <iconify-icon icon="${iconMap[type] || iconMap.info}"></iconify-icon>
      <div class="toast-content">
        <div class="toast-title">${message}</div>
      </div>
      <button class="toast-close">
        <iconify-icon icon="mdi:close"></iconify-icon>
      </button>
    `;
    
    // Add to container
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300);
    }, 3000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300);
    });
  }

  // Callback setters
  onCapture(callback) {
    this.onCaptureCallback = callback;
  }

  onQRDetected(callback) {
    this.onQRDetectedCallback = callback;
  }
}

export default CameraSystem;