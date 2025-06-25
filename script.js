import UserDatabase from './src/database.js';
import CameraSystem from './src/camera.js';
import QRCode from 'qrcode';

// Sistema de Usuários com banco de dados e câmera personalizada
class UserSystem {
  constructor() {
    this.database = new UserDatabase();
    this.camera = new CameraSystem();
    this.usuarios = [];
    this.usuariosFiltrados = [];
    this.paginaAtual = 1;
    this.itensPorPagina = 4;
    this.modoVisualizacao = 'grid';
    this.usuarioEditando = null;
    this.init();
  }

  async init() {
    try {
      // Wait for database initialization
      await this.database.init();
      
      // Populate initial data if needed
      await this.database.populateInitialData();
      
      // Load users from database
      await this.carregarUsuarios();
      
      // Setup camera callbacks
      this.setupCameraCallbacks();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initial render
      this.renderizarUsuarios();
      this.atualizarEstatisticas();
      this.atualizarPaginacao();
      
      console.log('Sistema inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar sistema:', error);
      this.mostrarToast('Erro ao inicializar sistema', 'error');
    }
  }

  async carregarUsuarios() {
    try {
      this.usuarios = await this.database.getAllUsers();
      this.usuariosFiltrados = [...this.usuarios];
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      this.mostrarToast('Erro ao carregar usuários', 'error');
    }
  }

  setupCameraCallbacks() {
    // Handle photo capture
    this.camera.onCapture((file) => {
      this.processarFotoCapturada(file);
    });

    // Handle QR code detection
    this.camera.onQRDetected((data) => {
      this.processarQRDetectado(data);
    });
  }

  processarFotoCapturada(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('filePreview');
      preview.innerHTML = `<img src="${e.target.result}" alt="Foto capturada">`;
      preview.classList.add('has-image');
      
      // Store the file for form submission
      const fotoInput = document.getElementById('foto');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fotoInput.files = dataTransfer.files;
      
      this.mostrarToast('Foto capturada com sucesso!', 'success');
    };
    reader.readAsDataURL(file);
  }

  processarQRDetectado(data) {
    try {
      const userData = JSON.parse(data);
      if (userData.nome && userData.email) {
        // Fill form with QR data
        document.getElementById('nome').value = userData.nome || '';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('telefone').value = userData.telefone || '';
        document.getElementById('cargo').value = userData.cargo || '';
        
        this.mostrarToast('Dados do QR Code carregados!', 'success');
      } else {
        this.mostrarToast('QR Code não contém dados de usuário válidos', 'warning');
      }
    } catch (error) {
      this.mostrarToast('QR Code inválido', 'error');
    }
  }

  setupEventListeners() {
    // Form submission
    document.getElementById('userForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.adicionarUsuario();
    });

    // Clear form
    document.getElementById('clearForm').addEventListener('click', () => {
      this.limparFormulario();
    });

    // File input
    document.getElementById('foto').addEventListener('change', (e) => {
      this.processarArquivo(e.target.files[0]);
    });

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.buscarUsuarios(e.target.value);
    });

    // Clear search
    document.getElementById('clearSearch').addEventListener('click', () => {
      document.getElementById('searchInput').value = '';
      this.buscarUsuarios('');
    });

    // Filters
    document.getElementById('cargoFilter').addEventListener('change', () => {
      this.aplicarFiltros();
    });

    document.getElementById('sortBy').addEventListener('change', () => {
      this.aplicarFiltros();
    });

    // View toggle
    document.getElementById('gridView').addEventListener('click', () => {
      this.alterarModoVisualizacao('grid');
    });

    document.getElementById('listView').addEventListener('click', () => {
      this.alterarModoVisualizacao('list');
    });

    // Pagination
    document.getElementById('firstPage').addEventListener('click', () => {
      this.irParaPagina(1);
    });

    document.getElementById('prevPage').addEventListener('click', () => {
      this.irParaPagina(this.paginaAtual - 1);
    });

    document.getElementById('nextPage').addEventListener('click', () => {
      this.irParaPagina(this.paginaAtual + 1);
    });

    document.getElementById('lastPage').addEventListener('click', () => {
      const totalPaginas = Math.ceil(this.usuariosFiltrados.length / this.itensPorPagina);
      this.irParaPagina(totalPaginas);
    });

    document.getElementById('itemsPerPageSelect').addEventListener('change', (e) => {
      this.itensPorPagina = parseInt(e.target.value);
      this.paginaAtual = 1;
      this.renderizarUsuarios();
      this.atualizarPaginacao();
    });

    // Export functionality
    document.getElementById('exportData').addEventListener('click', () => {
      this.exportarDados();
    });

    // Modal event listeners
    this.setupModalEventListeners();
  }

  setupModalEventListeners() {
    // Confirmation modal
    document.getElementById('modalClose').addEventListener('click', () => {
      this.fecharModal('confirmModal');
    });

    document.getElementById('modalCancel').addEventListener('click', () => {
      this.fecharModal('confirmModal');
    });

    // Edit modal
    document.getElementById('editModalClose').addEventListener('click', () => {
      this.fecharModal('editModal');
    });

    document.getElementById('editModalCancel').addEventListener('click', () => {
      this.fecharModal('editModal');
    });

    document.getElementById('editModalSave').addEventListener('click', () => {
      this.salvarEdicaoUsuario();
    });

    // Share modal
    document.getElementById('shareModalClose').addEventListener('click', () => {
      this.fecharModal('shareModal');
    });

    document.getElementById('downloadQRBtn').addEventListener('click', () => {
      this.baixarQRCode();
    });

    document.getElementById('shareQRBtn').addEventListener('click', () => {
      this.compartilharQRCode();
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.fecharModal(modal.id);
        }
      });
    });
  }

  async adicionarUsuario() {
    try {
      const formData = this.obterDadosFormulario();
      
      if (!this.validarFormulario(formData)) {
        return;
      }

      // Add user to database
      const novoUsuario = await this.database.addUser(formData);
      
      // Update local arrays
      this.usuarios.push(novoUsuario);
      this.aplicarFiltros();
      
      this.limparFormulario();
      this.renderizarUsuarios();
      this.atualizarEstatisticas();
      this.atualizarPaginacao();
      
      this.mostrarToast('Usuário cadastrado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      this.mostrarToast('Erro ao cadastrar usuário', 'error');
    }
  }

  obterDadosFormulario() {
    const fotoInput = document.getElementById('foto');
    let fotoUrl = 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    
    if (fotoInput.files && fotoInput.files[0]) {
      fotoUrl = URL.createObjectURL(fotoInput.files[0]);
    }

    return {
      nome: document.getElementById('nome').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefone: document.getElementById('telefone').value.trim(),
      cargo: document.getElementById('cargo').value,
      foto: fotoUrl
    };
  }

  validarFormulario(dados) {
    let valido = true;
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(error => {
      error.textContent = '';
    });

    // Validate name
    if (!dados.nome || dados.nome.length < 2) {
      document.getElementById('nomeError').textContent = 'Nome deve ter pelo menos 2 caracteres';
      valido = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!dados.email || !emailRegex.test(dados.email)) {
      document.getElementById('emailError').textContent = 'Email inválido';
      valido = false;
    }

    // Check if email already exists
    if (this.usuarios.some(user => user.email === dados.email && (!this.usuarioEditando || user.id !== this.usuarioEditando.id))) {
      document.getElementById('emailError').textContent = 'Este email já está cadastrado';
      valido = false;
    }

    // Validate phone
    const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (!dados.telefone || !telefoneRegex.test(dados.telefone)) {
      document.getElementById('telefoneError').textContent = 'Telefone deve estar no formato (11) 99999-9999';
      valido = false;
    }

    // Validate position
    if (!dados.cargo) {
      document.getElementById('cargoError').textContent = 'Selecione um cargo';
      valido = false;
    }

    return valido;
  }

  processarArquivo(arquivo) {
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      this.mostrarToast('Por favor, selecione apenas arquivos de imagem', 'error');
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      this.mostrarToast('A imagem deve ter no máximo 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('filePreview');
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview da foto">`;
      preview.classList.add('has-image');
    };
    reader.readAsDataURL(arquivo);
  }

  limparFormulario() {
    document.getElementById('userForm').reset();
    const preview = document.getElementById('filePreview');
    preview.innerHTML = `
      <iconify-icon icon="mdi:camera-plus"></iconify-icon>
      <span>Clique para adicionar foto</span>
    `;
    preview.classList.remove('has-image');
    
    // Clear errors
    document.querySelectorAll('.error-message').forEach(error => {
      error.textContent = '';
    });
  }

  async buscarUsuarios(termo) {
    try {
      if (!termo.trim()) {
        this.usuariosFiltrados = [...this.usuarios];
      } else {
        this.usuariosFiltrados = await this.database.searchUsers(termo);
      }
      
      this.paginaAtual = 1;
      this.renderizarUsuarios();
      this.atualizarEstatisticas();
      this.atualizarPaginacao();
      
      // Update clear button visibility
      const clearBtn = document.getElementById('clearSearch');
      clearBtn.classList.toggle('show', termo.length > 0);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      this.mostrarToast('Erro na busca', 'error');
    }
  }

  aplicarFiltros() {
    const cargoFiltro = document.getElementById('cargoFilter').value;
    const ordenacao = document.getElementById('sortBy').value;
    
    let usuariosFiltrados = [...this.usuarios];
    
    // Apply position filter
    if (cargoFiltro) {
      usuariosFiltrados = usuariosFiltrados.filter(user => user.cargo === cargoFiltro);
    }
    
    // Apply search filter if there's a search term
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      usuariosFiltrados = usuariosFiltrados.filter(user =>
        user.nome.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.cargo.toLowerCase().includes(searchLower) ||
        user.telefone.includes(searchTerm)
      );
    }
    
    // Apply sorting
    usuariosFiltrados.sort((a, b) => {
      switch (ordenacao) {
        case 'nome':
          return a.nome.localeCompare(b.nome);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'cargo':
          return a.cargo.localeCompare(b.cargo);
        case 'data':
          return new Date(b.dataRegistro) - new Date(a.dataRegistro);
        default:
          return 0;
      }
    });
    
    this.usuariosFiltrados = usuariosFiltrados;
    this.paginaAtual = 1;
    this.renderizarUsuarios();
    this.atualizarEstatisticas();
    this.atualizarPaginacao();
  }

  alterarModoVisualizacao(modo) {
    this.modoVisualizacao = modo;
    
    // Update button states
    document.getElementById('gridView').classList.toggle('active', modo === 'grid');
    document.getElementById('listView').classList.toggle('active', modo === 'list');
    
    // Update container class
    const container = document.getElementById('usuariosContainer');
    container.className = modo === 'grid' ? 'usuarios-grid' : 'usuarios-list';
    
    this.renderizarUsuarios();
  }

  renderizarUsuarios() {
    const container = document.getElementById('usuariosContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (this.usuariosFiltrados.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    
    emptyState.style.display = 'none';
    
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    const usuariosPagina = this.usuariosFiltrados.slice(inicio, fim);
    
    container.innerHTML = usuariosPagina.map((usuario, index) => {
      const isListView = this.modoVisualizacao === 'list';
      return `
        <div class="usuario-card ${isListView ? 'list-view' : ''}" style="animation-delay: ${index * 0.1}s">
          <img src="${usuario.foto}" alt="${usuario.nome}" onerror="this.src='https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'">
          <div class="usuario-info">
            <h3>${usuario.nome}</h3>
            <p><iconify-icon icon="mdi:email"></iconify-icon> ${usuario.email}</p>
            <p><iconify-icon icon="mdi:phone"></iconify-icon> ${usuario.telefone}</p>
            <span class="cargo">${usuario.cargo}</span>
          </div>
          <div class="usuario-actions">
            <button class="action-btn edit-btn" onclick="userSystem.editarUsuario(${usuario.id})">
              <iconify-icon icon="mdi:pencil"></iconify-icon> Editar
            </button>
            <button class="action-btn share-btn" onclick="userSystem.compartilharUsuario(${usuario.id})">
              <iconify-icon icon="mdi:share"></iconify-icon> Compartilhar
            </button>
            <button class="action-btn remove-btn" onclick="userSystem.confirmarRemocao(${usuario.id})">
              <iconify-icon icon="mdi:delete"></iconify-icon> Remover
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  atualizarEstatisticas() {
    const total = this.usuarios.length;
    const hoje = new Date().toDateString();
    const novosHoje = this.usuarios.filter(user => 
      new Date(user.dataRegistro).toDateString() === hoje
    ).length;
    const filtrados = this.usuariosFiltrados.length;
    
    // Animate number changes
    this.animarNumero('totalUsers', total);
    this.animarNumero('newUsersToday', novosHoje);
    this.animarNumero('filteredUsers', filtrados);
  }

  animarNumero(elementId, novoValor) {
    const elemento = document.getElementById(elementId);
    const valorAtual = parseInt(elemento.textContent) || 0;
    
    if (valorAtual === novoValor) return;
    
    const duracao = 500;
    const incremento = (novoValor - valorAtual) / (duracao / 16);
    let valorTemp = valorAtual;
    
    const animar = () => {
      valorTemp += incremento;
      if ((incremento > 0 && valorTemp >= novoValor) || (incremento < 0 && valorTemp <= novoValor)) {
        elemento.textContent = novoValor;
      } else {
        elemento.textContent = Math.round(valorTemp);
        requestAnimationFrame(animar);
      }
    };
    
    animar();
  }

  atualizarPaginacao() {
    const totalPaginas = Math.ceil(this.usuariosFiltrados.length / this.itensPorPagina);
    
    // Update navigation buttons
    document.getElementById('firstPage').disabled = this.paginaAtual === 1;
    document.getElementById('prevPage').disabled = this.paginaAtual === 1;
    document.getElementById('nextPage').disabled = this.paginaAtual === totalPaginas;
    document.getElementById('lastPage').disabled = this.paginaAtual === totalPaginas;
    
    // Update page numbers
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.paginaAtual - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPaginas, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const button = document.createElement('button');
      button.textContent = i;
      button.classList.toggle('active', i === this.paginaAtual);
      button.addEventListener('click', () => this.irParaPagina(i));
      pageNumbers.appendChild(button);
    }
    
    // Update page info
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina + 1;
    const fim = Math.min(this.paginaAtual * this.itensPorPagina, this.usuariosFiltrados.length);
    document.getElementById('pageInfo').textContent = 
      `Página ${this.paginaAtual} de ${totalPaginas} (${inicio}-${fim} de ${this.usuariosFiltrados.length})`;
  }

  irParaPagina(pagina) {
    const totalPaginas = Math.ceil(this.usuariosFiltrados.length / this.itensPorPagina);
    
    if (pagina < 1 || pagina > totalPaginas) return;
    
    this.paginaAtual = pagina;
    this.renderizarUsuarios();
    this.atualizarPaginacao();
    
    // Scroll to top of users section
    document.querySelector('.users-section').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }

  async editarUsuario(id) {
    try {
      const usuario = this.usuarios.find(u => u.id === id);
      if (!usuario) return;
      
      this.usuarioEditando = usuario;
      
      // Fill edit form
      document.getElementById('editUserId').value = usuario.id;
      document.getElementById('editNome').value = usuario.nome;
      document.getElementById('editEmail').value = usuario.email;
      document.getElementById('editTelefone').value = usuario.telefone;
      document.getElementById('editCargo').value = usuario.cargo;
      
      this.abrirModal('editModal');
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      this.mostrarToast('Erro ao carregar dados do usuário', 'error');
    }
  }

  async salvarEdicaoUsuario() {
    try {
      const id = parseInt(document.getElementById('editUserId').value);
      const dadosAtualizados = {
        nome: document.getElementById('editNome').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
        telefone: document.getElementById('editTelefone').value.trim(),
        cargo: document.getElementById('editCargo').value
      };
      
      // Update in database
      await this.database.updateUser(id, dadosAtualizados);
      
      // Update local arrays
      const index = this.usuarios.findIndex(u => u.id === id);
      if (index !== -1) {
        Object.assign(this.usuarios[index], dadosAtualizados);
      }
      
      this.aplicarFiltros();
      this.renderizarUsuarios();
      this.fecharModal('editModal');
      this.usuarioEditando = null;
      
      this.mostrarToast('Usuário atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      this.mostrarToast('Erro ao salvar alterações', 'error');
    }
  }

  confirmarRemocao(id) {
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) return;
    
    document.getElementById('modalTitle').textContent = 'Confirmar Remoção';
    document.getElementById('modalMessage').textContent = 
      `Tem certeza que deseja remover o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`;
    
    const confirmBtn = document.getElementById('modalConfirm');
    confirmBtn.onclick = () => this.removerUsuario(id);
    
    this.abrirModal('confirmModal');
  }

  async removerUsuario(id) {
    try {
      // Remove from database
      await this.database.deleteUser(id);
      
      // Remove from local arrays
      this.usuarios = this.usuarios.filter(u => u.id !== id);
      this.aplicarFiltros();
      
      this.renderizarUsuarios();
      this.atualizarEstatisticas();
      this.atualizarPaginacao();
      this.fecharModal('confirmModal');
      
      this.mostrarToast('Usuário removido com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      this.mostrarToast('Erro ao remover usuário', 'error');
    }
  }

  async compartilharUsuario(id) {
    try {
      const usuario = this.usuarios.find(u => u.id === id);
      if (!usuario) return;
      
      // Update share modal content
      document.getElementById('shareUserName').textContent = usuario.nome;
      document.getElementById('shareUserDetails').textContent = 
        `${usuario.cargo} • ${usuario.email}`;
      
      // Generate QR code
      const userData = {
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        cargo: usuario.cargo
      };
      
      const canvas = document.getElementById('qrCodeCanvas');
      await QRCode.toCanvas(canvas, JSON.stringify(userData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      this.abrirModal('shareModal');
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      this.mostrarToast('Erro ao gerar QR code', 'error');
    }
  }

  baixarQRCode() {
    const canvas = document.getElementById('qrCodeCanvas');
    const link = document.createElement('a');
    link.download = 'qr-code-usuario.png';
    link.href = canvas.toDataURL();
    link.click();
    
    this.mostrarToast('QR Code baixado!', 'success');
  }

  async compartilharQRCode() {
    try {
      const canvas = document.getElementById('qrCodeCanvas');
      canvas.toBlob(async (blob) => {
        if (navigator.share) {
          const file = new File([blob], 'qr-code-usuario.png', { type: 'image/png' });
          await navigator.share({
            title: 'QR Code do Usuário',
            text: 'Compartilhando dados do usuário via QR Code',
            files: [file]
          });
        } else {
          // Fallback: copy to clipboard
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          this.mostrarToast('QR Code copiado para a área de transferência!', 'success');
        }
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      this.mostrarToast('Erro ao compartilhar QR Code', 'error');
    }
  }

  exportarDados() {
    try {
      const dados = this.usuariosFiltrados.map(usuario => ({
        Nome: usuario.nome,
        Email: usuario.email,
        Telefone: usuario.telefone,
        Cargo: usuario.cargo,
        'Data de Registro': new Date(usuario.dataRegistro).toLocaleDateString('pt-BR')
      }));
      
      const csv = this.converterParaCSV(dados);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      link.href = URL.createObjectURL(blob);
      link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      this.mostrarToast('Dados exportados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      this.mostrarToast('Erro ao exportar dados', 'error');
    }
  }

  converterParaCSV(dados) {
    if (dados.length === 0) return '';
    
    const headers = Object.keys(dados[0]);
    const csvContent = [
      headers.join(','),
      ...dados.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    return '\uFEFF' + csvContent; // Add BOM for proper UTF-8 encoding
  }

  abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    
    // Focus trap for accessibility
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
  }

  mostrarToast(mensagem, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    const icones = {
      success: 'mdi:check-circle',
      error: 'mdi:alert-circle',
      warning: 'mdi:alert',
      info: 'mdi:information'
    };
    
    toast.innerHTML = `
      <iconify-icon icon="${icones[tipo] || icones.info}"></iconify-icon>
      <div class="toast-content">
        <div class="toast-title">${mensagem}</div>
      </div>
      <button class="toast-close">
        <iconify-icon icon="mdi:close"></iconify-icon>
      </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300);
    }, 5000);
    
    // Manual close
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
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.userSystem = new UserSystem();
});

// Phone number formatting
document.getElementById('telefone')?.addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length <= 11) {
    value = value.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    e.target.value = value;
  }
});

// Edit form phone formatting
document.getElementById('editTelefone')?.addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length <= 11) {
    value = value.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    e.target.value = value;
  }
});