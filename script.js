document.addEventListener("DOMContentLoaded", () => {
    // Elementos do DOM
    const userForm = document.getElementById("userForm");
    const usuariosContainer = document.getElementById("usuariosContainer");
    const searchInput = document.getElementById("searchInput");
    const clearSearchBtn = document.getElementById("clearSearch");
    const cargoFilter = document.getElementById("cargoFilter");
    const sortBy = document.getElementById("sortBy");
    const exportBtn = document.getElementById("exportData");
    const gridViewBtn = document.getElementById("gridView");
    const listViewBtn = document.getElementById("listView");
    const itemsPerPageSelect = document.getElementById("itemsPerPageSelect");
    
    // Elementos de paginação
    const firstPageBtn = document.getElementById("firstPage");
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");
    const lastPageBtn = document.getElementById("lastPage");
    const pageNumbers = document.getElementById("pageNumbers");
    const pageInfo = document.getElementById("pageInfo");
    
    // Elementos de estatísticas
    const totalUsersEl = document.getElementById("totalUsers");
    const newUsersTodayEl = document.getElementById("newUsersToday");
    const filteredUsersEl = document.getElementById("filteredUsers");
    
    // Elementos do modal
    const confirmModal = document.getElementById("confirmModal");
    const editModal = document.getElementById("editModal");
    const emptyState = document.getElementById("emptyState");
    
    // Elementos de preview de arquivo
    const fotoInput = document.getElementById("foto");
    const filePreview = document.getElementById("filePreview");
    
    // Estado da aplicação
    let usuarios = [];
    let filteredUsuarios = [];
    let currentPage = 1;
    let itemsPerPage = 4;
    let currentView = 'grid';
    let currentSort = 'nome';
    let currentFilter = '';
    let currentSearch = '';
    
    // Inicialização
    init();
    
    function init() {
        carregarUsuarios();
        setupEventListeners();
        updateStats();
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
        
        // Adicionar efeitos de entrada
        addPageLoadEffects();
    }
    
    function addPageLoadEffects() {
        // Animar números das estatísticas
        animateCounters();
        
        // Adicionar efeito de digitação no placeholder da busca
        addTypingEffect();
        
        // Adicionar efeitos de hover nos elementos interativos
        addHoverEffects();
    }
    
    function animateCounters() {
        const counters = [totalUsersEl, newUsersTodayEl, filteredUsersEl];
        
        counters.forEach((counter, index) => {
            const target = parseInt(counter.textContent) || 0;
            let current = 0;
            const increment = target / 30;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, 50 + (index * 20));
        });
    }
    
    function addTypingEffect() {
        const placeholder = "Buscar por nome, email ou cargo...";
        let index = 0;
        
        const typeEffect = () => {
            if (index < placeholder.length) {
                searchInput.placeholder = placeholder.substring(0, index + 1);
                index++;
                setTimeout(typeEffect, 100);
            }
        };
        
        setTimeout(typeEffect, 2000);
    }
    
    function addHoverEffects() {
        // Efeito de ripple nos botões
        document.querySelectorAll('button, .btn-primary, .btn-secondary, .btn-danger, .btn-export').forEach(button => {
            button.addEventListener('click', createRippleEffect);
        });
        
        // Efeito de shake nos campos com erro
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('invalid', (e) => {
                e.target.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    e.target.style.animation = '';
                }, 500);
            });
        });
    }
    
    function createRippleEffect(e) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    function setupEventListeners() {
        // Formulário principal
        userForm.addEventListener("submit", handleFormSubmit);
        document.getElementById("clearForm").addEventListener("click", clearForm);
        
        // Busca e filtros com debounce
        searchInput.addEventListener("input", debounce(handleSearch, 300));
        clearSearchBtn.addEventListener("click", clearSearch);
        cargoFilter.addEventListener("change", handleFilter);
        sortBy.addEventListener("change", handleSort);
        
        // Visualização com animação
        gridViewBtn.addEventListener("click", () => setView('grid'));
        listViewBtn.addEventListener("click", () => setView('list'));
        
        // Paginação
        firstPageBtn.addEventListener("click", () => goToPage(1));
        prevPageBtn.addEventListener("click", () => goToPage(currentPage - 1));
        nextPageBtn.addEventListener("click", () => goToPage(currentPage + 1));
        lastPageBtn.addEventListener("click", () => goToPage(getTotalPages()));
        itemsPerPageSelect.addEventListener("change", handleItemsPerPageChange);
        
        // Export com animação
        exportBtn.addEventListener("click", exportData);
        
        // Preview de arquivo com animação
        fotoInput.addEventListener("change", handleFilePreview);
        
        // Modal events
        setupModalEvents();
        
        // Validação em tempo real
        setupRealTimeValidation();
        
        // Adicionar efeitos de teclado
        setupKeyboardEffects();
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function setupKeyboardEffects() {
        // Efeito de digitação nos inputs
        document.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(input => {
            input.addEventListener('keydown', (e) => {
                input.style.transform = 'scale(1.01)';
                setTimeout(() => {
                    input.style.transform = 'scale(1)';
                }, 100);
            });
        });
        
        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K para focar na busca
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
            
            // Escape para limpar busca
            if (e.key === 'Escape' && document.activeElement === searchInput) {
                clearSearch();
            }
        });
    }
    
    function setupModalEvents() {
        // Confirm Modal
        document.getElementById("modalClose").addEventListener("click", closeConfirmModal);
        document.getElementById("modalCancel").addEventListener("click", closeConfirmModal);
        document.getElementById("modalConfirm").addEventListener("click", handleConfirmAction);
        
        // Edit Modal
        document.getElementById("editModalClose").addEventListener("click", closeEditModal);
        document.getElementById("editModalCancel").addEventListener("click", closeEditModal);
        document.getElementById("editModalSave").addEventListener("click", handleEditSave);
        
        // Close modal on backdrop click
        confirmModal.addEventListener("click", (e) => {
            if (e.target === confirmModal) closeConfirmModal();
        });
        
        editModal.addEventListener("click", (e) => {
            if (e.target === editModal) closeEditModal();
        });
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (confirmModal.classList.contains('show')) {
                    closeConfirmModal();
                }
                if (editModal.classList.contains('show')) {
                    closeEditModal();
                }
            }
        });
    }
    
    function setupRealTimeValidation() {
        const inputs = [
            { id: 'nome', validator: validateNome },
            { id: 'email', validator: validateEmail },
            { id: 'telefone', validator: validateTelefone },
            { id: 'cargo', validator: validateCargo }
        ];
        
        inputs.forEach(({ id, validator }) => {
            const input = document.getElementById(id);
            const errorEl = document.getElementById(`${id}Error`);
            
            input.addEventListener('blur', () => {
                const error = validator(input.value.trim());
                showFieldError(errorEl, error, input);
            });
            
            input.addEventListener('input', () => {
                if (errorEl.textContent) {
                    const error = validator(input.value.trim());
                    showFieldError(errorEl, error, input);
                }
            });
            
            // Efeito visual de validação em tempo real
            input.addEventListener('input', () => {
                const isValid = !validator(input.value.trim());
                input.style.borderColor = isValid ? 'var(--success-color)' : '';
                
                if (isValid && input.value.trim()) {
                    input.style.boxShadow = '0 0 0 3px rgba(52, 199, 89, 0.1)';
                } else {
                    input.style.boxShadow = '';
                }
            });
        });
    }
    
    function showFieldError(errorEl, error, input) {
        errorEl.textContent = error || '';
        
        if (error) {
            input.style.borderColor = 'var(--danger-color)';
            input.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                input.style.animation = '';
            }, 500);
        } else {
            input.style.borderColor = '';
        }
    }
    
    // Validadores
    function validateNome(nome) {
        if (!nome) return 'Nome é obrigatório';
        if (nome.length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        if (nome.length > 100) return 'Nome deve ter no máximo 100 caracteres';
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nome)) return 'Nome deve conter apenas letras e espaços';
        return '';
    }
    
    function validateEmail(email) {
        if (!email) return 'Email é obrigatório';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Email inválido';
        if (email.length > 255) return 'Email muito longo';
        
        // Verificar se email já existe (exceto na edição)
        const existingUser = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
        const editingUserId = document.getElementById("editUserId")?.value;
        if (existingUser && existingUser.id != editingUserId) {
            return 'Este email já está cadastrado';
        }
        
        return '';
    }
    
    function validateTelefone(telefone) {
        if (!telefone) return 'Telefone é obrigatório';
        const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
        if (!phoneRegex.test(telefone)) return 'Formato inválido. Use: (11) 99999-9999';
        return '';
    }
    
    function validateCargo(cargo) {
        if (!cargo) return 'Cargo é obrigatório';
        return '';
    }
    
    function carregarUsuarios() {
        const stored = localStorage.getItem("usuarios");
        if (stored) {
            usuarios = JSON.parse(stored);
        } else {
            // Dados iniciais mais realistas
            usuarios = [
                {
                    id: 1,
                    nome: "Ana Silva Santos",
                    email: "ana.santos@empresa.com",
                    telefone: "(11) 98765-4321",
                    cargo: "Desenvolvedor",
                    foto: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
                    dataCadastro: new Date().toISOString()
                },
                {
                    id: 2,
                    nome: "Carlos Eduardo Lima",
                    email: "carlos.lima@empresa.com",
                    telefone: "(21) 99876-5432",
                    cargo: "Designer",
                    foto: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
                    dataCadastro: new Date().toISOString()
                },
                {
                    id: 3,
                    nome: "Mariana Costa Oliveira",
                    email: "mariana.oliveira@empresa.com",
                    telefone: "(31) 97654-3210",
                    cargo: "Gerente",
                    foto: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
                    dataCadastro: new Date().toISOString()
                }
            ];
            salvarUsuarios();
        }
    }
    
    function salvarUsuarios() {
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        updateStats();
    }
    
    function updateStats() {
        const today = new Date().toDateString();
        const newToday = usuarios.filter(u => 
            new Date(u.dataCadastro).toDateString() === today
        ).length;
        
        // Animar mudanças nos números
        animateNumberChange(totalUsersEl, usuarios.length);
        animateNumberChange(newUsersTodayEl, newToday);
        animateNumberChange(filteredUsersEl, filteredUsuarios.length);
    }
    
    function animateNumberChange(element, newValue) {
        const currentValue = parseInt(element.textContent) || 0;
        if (currentValue === newValue) return;
        
        const duration = 500;
        const steps = 20;
        const stepValue = (newValue - currentValue) / steps;
        let current = currentValue;
        let step = 0;
        
        const timer = setInterval(() => {
            step++;
            current += stepValue;
            
            if (step >= steps) {
                element.textContent = newValue;
                clearInterval(timer);
            } else {
                element.textContent = Math.round(current);
            }
        }, duration / steps);
    }
    
    function applyFiltersAndSort() {
        let result = [...usuarios];
        
        // Aplicar busca
        if (currentSearch) {
            result = result.filter(u =>
                u.nome.toLowerCase().includes(currentSearch.toLowerCase()) ||
                u.email.toLowerCase().includes(currentSearch.toLowerCase()) ||
                u.cargo.toLowerCase().includes(currentSearch.toLowerCase())
            );
        }
        
        // Aplicar filtro de cargo
        if (currentFilter) {
            result = result.filter(u => u.cargo === currentFilter);
        }
        
        // Aplicar ordenação
        result.sort((a, b) => {
            switch (currentSort) {
                case 'nome':
                    return a.nome.localeCompare(b.nome);
                case 'email':
                    return a.email.localeCompare(b.email);
                case 'cargo':
                    return a.cargo.localeCompare(b.cargo);
                case 'data':
                    return new Date(b.dataCadastro) - new Date(a.dataCadastro);
                default:
                    return 0;
            }
        });
        
        filteredUsuarios = result;
        updateStats();
        
        // Ajustar página atual se necessário
        const totalPages = getTotalPages();
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        } else if (currentPage < 1) {
            currentPage = 1;
        }
    }
    
    function mostrarUsuarios() {
        usuariosContainer.innerHTML = "";
        usuariosContainer.className = currentView === 'grid' ? 'usuarios-grid' : 'usuarios-list';
        
        if (filteredUsuarios.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedUsers = filteredUsuarios.slice(startIndex, startIndex + itemsPerPage);
        
        paginatedUsers.forEach((usuario, index) => {
            const div = document.createElement("div");
            div.className = `usuario-card ${currentView === 'list' ? 'list-view' : ''}`;
            div.style.animationDelay = `${index * 0.1}s`;
            
            const dataFormatada = new Date(usuario.dataCadastro).toLocaleDateString('pt-BR');
            
            div.innerHTML = `
                <img src="${usuario.foto}" alt="Foto de ${usuario.nome}" 
                     onerror="this.src='https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'">
                <div class="usuario-info">
                    <h3>${usuario.nome}</h3>
                    <p><iconify-icon icon="mdi:email"></iconify-icon> ${usuario.email}</p>
                    <p><iconify-icon icon="mdi:phone"></iconify-icon> ${usuario.telefone}</p>
                    <p><iconify-icon icon="mdi:calendar"></iconify-icon> Cadastrado em ${dataFormatada}</p>
                    <span class="cargo">${usuario.cargo}</span>
                </div>
                <div class="usuario-actions">
                    <button class="action-btn edit-btn" data-user-id="${usuario.id}">
                        <iconify-icon icon="mdi:pencil"></iconify-icon> Editar
                    </button>
                    <button class="action-btn remove-btn" data-user-id="${usuario.id}">
                        <iconify-icon icon="mdi:delete"></iconify-icon> Remover
                    </button>
                </div>
            `;
            
            usuariosContainer.appendChild(div);
        });
        
        // Adicionar event listeners para os botões
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.currentTarget.dataset.userId);
                editUser(userId);
            });
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.currentTarget.dataset.userId);
                confirmRemoveUser(userId);
            });
        });
        
        // Adicionar efeito de hover nos cards
        document.querySelectorAll('.usuario-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = currentView === 'grid' ? 'translateY(-8px) scale(1.02)' : 'translateX(8px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'none';
            });
        });
    }
    
    function updatePagination() {
        const totalPages = getTotalPages();
        
        // Atualizar botões de navegação
        firstPageBtn.disabled = currentPage === 1;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        lastPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        
        // Atualizar números das páginas
        pageNumbers.innerHTML = '';
        
        if (totalPages <= 7) {
            // Mostrar todas as páginas
            for (let i = 1; i <= totalPages; i++) {
                createPageButton(i);
            }
        } else {
            // Mostrar páginas com ellipsis
            createPageButton(1);
            
            if (currentPage > 4) {
                createEllipsis();
            }
            
            const start = Math.max(2, currentPage - 2);
            const end = Math.min(totalPages - 1, currentPage + 2);
            
            for (let i = start; i <= end; i++) {
                createPageButton(i);
            }
            
            if (currentPage < totalPages - 3) {
                createEllipsis();
            }
            
            if (totalPages > 1) {
                createPageButton(totalPages);
            }
        }
        
        // Atualizar informações da página
        pageInfo.textContent = totalPages > 0 
            ? `Página ${currentPage} de ${totalPages}` 
            : 'Nenhum resultado';
    }
    
    function createPageButton(pageNum) {
        const btn = document.createElement('button');
        btn.textContent = pageNum;
        btn.className = currentPage === pageNum ? 'active' : '';
        btn.addEventListener('click', () => goToPage(pageNum));
        pageNumbers.appendChild(btn);
    }
    
    function createEllipsis() {
        const span = document.createElement('span');
        span.textContent = '...';
        span.style.padding = '8px';
        span.style.color = 'var(--text-secondary)';
        pageNumbers.appendChild(span);
    }
    
    function getTotalPages() {
        return Math.ceil(filteredUsuarios.length / itemsPerPage);
    }
    
    function goToPage(page) {
        const totalPages = getTotalPages();
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            mostrarUsuarios();
            updatePagination();
            
            // Scroll suave para o topo da lista
            usuariosContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            nome: document.getElementById("nome").value.trim(),
            email: document.getElementById("email").value.trim(),
            telefone: document.getElementById("telefone").value.trim(),
            cargo: document.getElementById("cargo").value,
            foto: fotoInput.files?.[0]
        };
        
        // Validar todos os campos
        const errors = {
            nome: validateNome(formData.nome),
            email: validateEmail(formData.email),
            telefone: validateTelefone(formData.telefone),
            cargo: validateCargo(formData.cargo)
        };
        
        // Mostrar erros
        Object.keys(errors).forEach(field => {
            const errorEl = document.getElementById(`${field}Error`);
            const input = document.getElementById(field);
            showFieldError(errorEl, errors[field], input);
        });
        
        // Se há erros, não prosseguir
        if (Object.values(errors).some(error => error)) {
            showToast('Erro', 'Por favor, corrija os erros no formulário.', 'error');
            return;
        }
        
        // Adicionar loading ao botão
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<iconify-icon icon="mdi:loading" class="animate-spin"></iconify-icon> Salvando...';
        submitBtn.disabled = true;
        
        // Processar foto
        if (formData.foto) {
            const reader = new FileReader();
            reader.onload = function(event) {
                setTimeout(() => {
                    saveUser({
                        ...formData,
                        foto: event.target.result
                    });
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 1000); // Simular delay de processamento
            };
            reader.readAsDataURL(formData.foto);
        } else {
            setTimeout(() => {
                saveUser({
                    ...formData,
                    foto: "https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
                });
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 1000);
        }
    }
    
    function saveUser(userData) {
        const novoUsuario = {
            id: Date.now(),
            ...userData,
            dataCadastro: new Date().toISOString()
        };
        
        usuarios.unshift(novoUsuario);
        salvarUsuarios();
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
        clearForm();
        
        showToast('Sucesso', 'Usuário cadastrado com sucesso!', 'success');
        
        // Ir para a primeira página para mostrar o novo usuário
        goToPage(1);
        
        // Efeito de confetti
        createConfettiEffect();
    }
    
    function createConfettiEffect() {
        const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}vw;
                top: -10px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }
    
    function clearForm() {
        userForm.reset();
        
        // Limpar preview da foto com animação
        filePreview.style.transform = 'scale(0.9)';
        filePreview.style.opacity = '0.5';
        
        setTimeout(() => {
            filePreview.innerHTML = `
                <iconify-icon icon="mdi:camera-plus"></iconify-icon>
                <span>Clique para adicionar foto</span>
            `;
            filePreview.classList.remove('has-image');
            filePreview.style.transform = 'scale(1)';
            filePreview.style.opacity = '1';
        }, 200);
        
        // Limpar erros
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        
        // Resetar estilos dos campos
        document.querySelectorAll('input, select').forEach(el => {
            el.style.borderColor = '';
            el.style.boxShadow = '';
        });
    }
    
    function handleFilePreview(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB
                showToast('Erro', 'Arquivo muito grande. Máximo 5MB.', 'error');
                e.target.value = '';
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                showToast('Erro', 'Por favor, selecione apenas imagens.', 'error');
                e.target.value = '';
                return;
            }
            
            // Animação de loading
            filePreview.innerHTML = `
                <iconify-icon icon="mdi:loading" class="animate-spin"></iconify-icon>
                <span>Carregando...</span>
            `;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                setTimeout(() => {
                    filePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                    filePreview.classList.add('has-image');
                }, 500);
            };
            reader.readAsDataURL(file);
        }
    }
    
    function handleSearch(e) {
        currentSearch = e.target.value.trim();
        clearSearchBtn.classList.toggle('show', currentSearch.length > 0);
        currentPage = 1;
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
        
        // Efeito visual de busca
        if (currentSearch) {
            searchInput.style.background = 'rgba(0, 122, 255, 0.05)';
        } else {
            searchInput.style.background = '';
        }
    }
    
    function clearSearch() {
        searchInput.value = '';
        currentSearch = '';
        clearSearchBtn.classList.remove('show');
        searchInput.style.background = '';
        currentPage = 1;
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
        
        // Efeito de limpeza
        searchInput.style.transform = 'scale(1.05)';
        setTimeout(() => {
            searchInput.style.transform = 'scale(1)';
        }, 150);
    }
    
    function handleFilter(e) {
        currentFilter = e.target.value;
        currentPage = 1;
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
        
        // Efeito visual no filtro
        e.target.style.transform = 'scale(1.02)';
        setTimeout(() => {
            e.target.style.transform = 'scale(1)';
        }, 150);
    }
    
    function handleSort(e) {
        currentSort = e.target.value;
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
        
        // Efeito visual na ordenação
        e.target.style.transform = 'scale(1.02)';
        setTimeout(() => {
            e.target.style.transform = 'scale(1)';
        }, 150);
    }
    
    function setView(view) {
        currentView = view;
        gridViewBtn.classList.toggle('active', view === 'grid');
        listViewBtn.classList.toggle('active', view === 'list');
        
        // Animação de transição entre views
        usuariosContainer.style.opacity = '0';
        usuariosContainer.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            mostrarUsuarios();
            usuariosContainer.style.opacity = '1';
            usuariosContainer.style.transform = 'scale(1)';
        }, 200);
    }
    
    function handleItemsPerPageChange(e) {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        mostrarUsuarios();
        updatePagination();
        
        // Efeito visual
        e.target.style.transform = 'scale(1.05)';
        setTimeout(() => {
            e.target.style.transform = 'scale(1)';
        }, 150);
    }
    
    function confirmRemoveUser(userId) {
        const usuario = usuarios.find(u => u.id === userId);
        if (!usuario) return;
        
        document.getElementById('modalTitle').textContent = 'Confirmar Remoção';
        document.getElementById('modalMessage').textContent = 
            `Tem certeza que deseja remover "${usuario.nome}"? Esta ação não pode ser desfeita.`;
        
        confirmModal.classList.add('show');
        
        // Armazenar o ID do usuário para remoção
        confirmModal.dataset.userId = userId;
        confirmModal.dataset.action = 'remove';
    }
    
    function handleConfirmAction() {
        const action = confirmModal.dataset.action;
        const userId = parseInt(confirmModal.dataset.userId);
        
        if (action === 'remove') {
            usuarios = usuarios.filter(u => u.id !== userId);
            salvarUsuarios();
            applyFiltersAndSort();
            mostrarUsuarios();
            updatePagination();
            
            showToast('Sucesso', 'Usuário removido com sucesso!', 'success');
        }
        
        closeConfirmModal();
    }
    
    function closeConfirmModal() {
        confirmModal.classList.remove('show');
        delete confirmModal.dataset.userId;
        delete confirmModal.dataset.action;
    }
    
    function editUser(userId) {
        const usuario = usuarios.find(u => u.id === userId);
        if (!usuario) return;
        
        // Preencher o formulário de edição
        document.getElementById('editUserId').value = usuario.id;
        document.getElementById('editNome').value = usuario.nome;
        document.getElementById('editEmail').value = usuario.email;
        document.getElementById('editTelefone').value = usuario.telefone;
        document.getElementById('editCargo').value = usuario.cargo;
        
        editModal.classList.add('show');
    }
    
    function handleEditSave() {
        const userId = parseInt(document.getElementById('editUserId').value);
        const formData = {
            nome: document.getElementById('editNome').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            telefone: document.getElementById('editTelefone').value.trim(),
            cargo: document.getElementById('editCargo').value
        };
        
        // Validar campos
        const errors = {
            nome: validateNome(formData.nome),
            email: validateEmail(formData.email),
            telefone: validateTelefone(formData.telefone),
            cargo: validateCargo(formData.cargo)
        };
        
        if (Object.values(errors).some(error => error)) {
            showToast('Erro', 'Por favor, corrija os erros no formulário.', 'error');
            return;
        }
        
        // Adicionar loading ao botão
        const saveBtn = document.getElementById('editModalSave');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<iconify-icon icon="mdi:loading" class="animate-spin"></iconify-icon> Salvando...';
        saveBtn.disabled = true;
        
        setTimeout(() => {
            // Atualizar usuário
            const userIndex = usuarios.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                usuarios[userIndex] = {
                    ...usuarios[userIndex],
                    ...formData
                };
                
                salvarUsuarios();
                applyFiltersAndSort();
                mostrarUsuarios();
                updatePagination();
                
                showToast('Sucesso', 'Usuário atualizado com sucesso!', 'success');
                closeEditModal();
            }
            
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }, 1000);
    }
    
    function closeEditModal() {
        editModal.classList.remove('show');
    }
    
    function exportData() {
        if (filteredUsuarios.length === 0) {
            showToast('Aviso', 'Não há dados para exportar.', 'warning');
            return;
        }
        
        // Animação no botão de export
        exportBtn.innerHTML = '<iconify-icon icon="mdi:loading" class="animate-spin"></iconify-icon> Exportando...';
        exportBtn.disabled = true;
        
        setTimeout(() => {
            const csvContent = [
                ['Nome', 'Email', 'Telefone', 'Cargo', 'Data de Cadastro'],
                ...filteredUsuarios.map(u => [
                    u.nome,
                    u.email,
                    u.telefone,
                    u.cargo,
                    new Date(u.dataCadastro).toLocaleDateString('pt-BR')
                ])
            ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Sucesso', 'Dados exportados com sucesso!', 'success');
            
            exportBtn.innerHTML = '<iconify-icon icon="mdi:download"></iconify-icon> Exportar';
            exportBtn.disabled = false;
        }, 1500);
    }
    
    function showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'mdi:check-circle',
            error: 'mdi:alert-circle',
            warning: 'mdi:alert',
            info: 'mdi:information'
        };
        
        toast.innerHTML = `
            <iconify-icon icon="${icons[type] || icons.info}"></iconify-icon>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <iconify-icon icon="mdi:close"></iconify-icon>
            </button>
        `;
        
        // Event listener para fechar
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
        
        toastContainer.appendChild(toast);
        
        // Auto remove após 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlideOut 0.3s ease forwards';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }
        }, 5000);
    }
    
    // Adicionar estilos de animação dinamicamente
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        @keyframes confetti-fall {
            to {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
        
        @keyframes toastSlideOut {
            to {
                opacity: 0;
                transform: translateX(100%) scale(0.9);
            }
        }
        
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});