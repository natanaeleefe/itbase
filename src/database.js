// Database simulation with IndexedDB for persistent storage
class UserDatabase {
  constructor() {
    this.dbName = 'UserSystemDB';
    this.version = 1;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('users')) {
          const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
          store.createIndex('email', 'email', { unique: true });
          store.createIndex('nome', 'nome', { unique: false });
          store.createIndex('cargo', 'cargo', { unique: false });
          store.createIndex('dataRegistro', 'dataRegistro', { unique: false });
        }
      };
    });
  }

  async addUser(userData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      
      const user = {
        ...userData,
        dataRegistro: new Date().toISOString(),
        id: Date.now() + Math.random()
      };
      
      const request = store.add(user);
      request.onsuccess = () => resolve(user);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateUser(id, userData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const user = getRequest.result;
        if (user) {
          Object.assign(user, userData);
          const updateRequest = store.put(user);
          updateRequest.onsuccess = () => resolve(user);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('User not found'));
        }
      };
    });
  }

  async deleteUser(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async searchUsers(query) {
    const users = await this.getAllUsers();
    const searchTerm = query.toLowerCase();
    
    return users.filter(user => 
      user.nome.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.cargo.toLowerCase().includes(searchTerm) ||
      user.telefone.includes(searchTerm)
    );
  }

  async populateInitialData() {
    const existingUsers = await this.getAllUsers();
    if (existingUsers.length > 0) return;

    const sampleUsers = [
      {
        nome: "Ana Silva Santos",
        email: "ana.silva@empresa.com",
        telefone: "(11) 99876-5432",
        cargo: "Desenvolvedor",
        foto: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Carlos Eduardo Lima",
        email: "carlos.lima@empresa.com",
        telefone: "(11) 98765-4321",
        cargo: "Designer",
        foto: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Mariana Costa Oliveira",
        email: "mariana.costa@empresa.com",
        telefone: "(11) 97654-3210",
        cargo: "Gerente",
        foto: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "João Pedro Almeida",
        email: "joao.almeida@empresa.com",
        telefone: "(11) 96543-2109",
        cargo: "Analista",
        foto: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Fernanda Rodrigues",
        email: "fernanda.rodrigues@empresa.com",
        telefone: "(11) 95432-1098",
        cargo: "Coordenador",
        foto: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Rafael Santos Pereira",
        email: "rafael.pereira@empresa.com",
        telefone: "(11) 94321-0987",
        cargo: "Desenvolvedor",
        foto: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Juliana Mendes Silva",
        email: "juliana.mendes@empresa.com",
        telefone: "(11) 93210-9876",
        cargo: "Designer",
        foto: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Bruno Ferreira Costa",
        email: "bruno.ferreira@empresa.com",
        telefone: "(11) 92109-8765",
        cargo: "Diretor",
        foto: "https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Camila Souza Lima",
        email: "camila.souza@empresa.com",
        telefone: "(11) 91098-7654",
        cargo: "Estagiário",
        foto: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Diego Martins Oliveira",
        email: "diego.martins@empresa.com",
        telefone: "(11) 90987-6543",
        cargo: "Desenvolvedor",
        foto: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Larissa Barbosa Santos",
        email: "larissa.barbosa@empresa.com",
        telefone: "(11) 89876-5432",
        cargo: "Analista",
        foto: "https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Thiago Ribeiro Silva",
        email: "thiago.ribeiro@empresa.com",
        telefone: "(11) 88765-4321",
        cargo: "Gerente",
        foto: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Patrícia Gomes Alves",
        email: "patricia.gomes@empresa.com",
        telefone: "(11) 87654-3210",
        cargo: "Designer",
        foto: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Rodrigo Carvalho Lima",
        email: "rodrigo.carvalho@empresa.com",
        telefone: "(11) 86543-2109",
        cargo: "Coordenador",
        foto: "https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Vanessa Torres Costa",
        email: "vanessa.torres@empresa.com",
        telefone: "(11) 85432-1098",
        cargo: "Desenvolvedor",
        foto: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Lucas Andrade Pereira",
        email: "lucas.andrade@empresa.com",
        telefone: "(11) 84321-0987",
        cargo: "Estagiário",
        foto: "https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Gabriela Nascimento",
        email: "gabriela.nascimento@empresa.com",
        telefone: "(11) 83210-9876",
        cargo: "Analista",
        foto: "https://images.pexels.com/photos/1181717/pexels-photo-1181717.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Felipe Moreira Santos",
        email: "felipe.moreira@empresa.com",
        telefone: "(11) 82109-8765",
        cargo: "Diretor",
        foto: "https://images.pexels.com/photos/1040882/pexels-photo-1040882.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Amanda Vieira Silva",
        email: "amanda.vieira@empresa.com",
        telefone: "(11) 81098-7654",
        cargo: "Designer",
        foto: "https://images.pexels.com/photos/1181562/pexels-photo-1181562.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Gustavo Fernandes Lima",
        email: "gustavo.fernandes@empresa.com",
        telefone: "(11) 80987-6543",
        cargo: "Desenvolvedor",
        foto: "https://images.pexels.com/photos/1043472/pexels-photo-1043472.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Isabela Cardoso Oliveira",
        email: "isabela.cardoso@empresa.com",
        telefone: "(11) 79876-5432",
        cargo: "Gerente",
        foto: "https://images.pexels.com/photos/1181721/pexels-photo-1181721.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Mateus Rocha Santos",
        email: "mateus.rocha@empresa.com",
        telefone: "(11) 78765-4321",
        cargo: "Coordenador",
        foto: "https://images.pexels.com/photos/1040883/pexels-photo-1040883.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Natália Campos Silva",
        email: "natalia.campos@empresa.com",
        telefone: "(11) 77654-3210",
        cargo: "Analista",
        foto: "https://images.pexels.com/photos/1181725/pexels-photo-1181725.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Pedro Henrique Costa",
        email: "pedro.costa@empresa.com",
        telefone: "(11) 76543-2109",
        cargo: "Desenvolvedor",
        foto: "https://images.pexels.com/photos/1040884/pexels-photo-1040884.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Renata Lopes Almeida",
        email: "renata.lopes@empresa.com",
        telefone: "(11) 75432-1098",
        cargo: "Designer",
        foto: "https://images.pexels.com/photos/1181729/pexels-photo-1181729.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Vinicius Dias Pereira",
        email: "vinicius.dias@empresa.com",
        telefone: "(11) 74321-0987",
        cargo: "Estagiário",
        foto: "https://images.pexels.com/photos/1040885/pexels-photo-1040885.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Beatriz Monteiro Silva",
        email: "beatriz.monteiro@empresa.com",
        telefone: "(11) 73210-9876",
        cargo: "Diretor",
        foto: "https://images.pexels.com/photos/1181733/pexels-photo-1181733.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Eduardo Pinto Santos",
        email: "eduardo.pinto@empresa.com",
        telefone: "(11) 72109-8765",
        cargo: "Gerente",
        foto: "https://images.pexels.com/photos/1040886/pexels-photo-1040886.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Letícia Freitas Lima",
        email: "leticia.freitas@empresa.com",
        telefone: "(11) 71098-7654",
        cargo: "Analista",
        foto: "https://images.pexels.com/photos/1181737/pexels-photo-1181737.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Ricardo Teixeira Costa",
        email: "ricardo.teixeira@empresa.com",
        telefone: "(11) 70987-6543",
        cargo: "Desenvolvedor",
        foto: "https://images.pexels.com/photos/1040887/pexels-photo-1040887.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Sophia Ramos Oliveira",
        email: "sophia.ramos@empresa.com",
        telefone: "(11) 69876-5432",
        cargo: "Coordenador",
        foto: "https://images.pexels.com/photos/1181741/pexels-photo-1181741.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "André Cunha Silva",
        email: "andre.cunha@empresa.com",
        telefone: "(11) 68765-4321",
        cargo: "Designer",
        foto: "https://images.pexels.com/photos/1040888/pexels-photo-1040888.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Carolina Melo Santos",
        email: "carolina.melo@empresa.com",
        telefone: "(11) 67654-3210",
        cargo: "Estagiário",
        foto: "https://images.pexels.com/photos/1181745/pexels-photo-1181745.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Henrique Azevedo Lima",
        email: "henrique.azevedo@empresa.com",
        telefone: "(11) 66543-2109",
        cargo: "Desenvolvedor",
        foto: "https://images.pexels.com/photos/1040889/pexels-photo-1040889.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Priscila Castro Costa",
        email: "priscila.castro@empresa.com",
        telefone: "(11) 65432-1098",
        cargo: "Analista",
        foto: "https://images.pexels.com/photos/1181749/pexels-photo-1181749.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Marcelo Correia Pereira",
        email: "marcelo.correia@empresa.com",
        telefone: "(11) 64321-0987",
        cargo: "Diretor",
        foto: "https://images.pexels.com/photos/1040890/pexels-photo-1040890.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Aline Batista Silva",
        email: "aline.batista@empresa.com",
        telefone: "(11) 63210-9876",
        cargo: "Gerente",
        foto: "https://images.pexels.com/photos/1181753/pexels-photo-1181753.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Daniel Macedo Santos",
        email: "daniel.macedo@empresa.com",
        telefone: "(11) 62109-8765",
        cargo: "Coordenador",
        foto: "https://images.pexels.com/photos/1040891/pexels-photo-1040891.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Tatiana Nunes Lima",
        email: "tatiana.nunes@empresa.com",
        telefone: "(11) 61098-7654",
        cargo: "Designer",
        foto: "https://images.pexels.com/photos/1181757/pexels-photo-1181757.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Fábio Moura Costa",
        email: "fabio.moura@empresa.com",
        telefone: "(11) 60987-6543",
        cargo: "Desenvolvedor",
        foto: "https://images.pexels.com/photos/1040892/pexels-photo-1040892.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Viviane Reis Oliveira",
        email: "viviane.reis@empresa.com",
        telefone: "(11) 59876-5432",
        cargo: "Estagiário",
        foto: "https://images.pexels.com/photos/1181761/pexels-photo-1181761.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Alexandre Farias Silva",
        email: "alexandre.farias@empresa.com",
        telefone: "(11) 58765-4321",
        cargo: "Analista",
        foto: "https://images.pexels.com/photos/1040893/pexels-photo-1040893.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Cristina Borges Santos",
        email: "cristina.borges@empresa.com",
        telefone: "(11) 57654-3210",
        cargo: "Diretor",
        foto: "https://images.pexels.com/photos/1181765/pexels-photo-1181765.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Roberto Siqueira Lima",
        email: "roberto.siqueira@empresa.com",
        telefone: "(11) 56543-2109",
        cargo: "Gerente",
        foto: "https://images.pexels.com/photos/1040894/pexels-photo-1040894.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Simone Vargas Costa",
        email: "simone.vargas@empresa.com",
        telefone: "(11) 55432-1098",
        cargo: "Coordenador",
        foto: "https://images.pexels.com/photos/1181769/pexels-photo-1181769.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Leandro Pacheco Pereira",
        email: "leandro.pacheco@empresa.com",
        telefone: "(11) 54321-0987",
        cargo: "Designer",
        foto: "https://images.pexels.com/photos/1040895/pexels-photo-1040895.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Mônica Tavares Silva",
        email: "monica.tavares@empresa.com",
        telefone: "(11) 53210-9876",
        cargo: "Desenvolvedor",
        foto: "https://images.pexels.com/photos/1181773/pexels-photo-1181773.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Sérgio Duarte Santos",
        email: "sergio.duarte@empresa.com",
        telefone: "(11) 52109-8765",
        cargo: "Estagiário",
        foto: "https://images.pexels.com/photos/1040896/pexels-photo-1040896.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Eliane Medeiros Lima",
        email: "eliane.medeiros@empresa.com",
        telefone: "(11) 51098-7654",
        cargo: "Analista",
        foto: "https://images.pexels.com/photos/1181777/pexels-photo-1181777.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      },
      {
        nome: "Wagner Santana Costa",
        email: "wagner.santana@empresa.com",
        telefone: "(11) 50987-6543",
        cargo: "Outro",
        foto: "https://images.pexels.com/photos/1040897/pexels-photo-1040897.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
      }
    ];

    for (const user of sampleUsers) {
      await this.addUser(user);
    }
  }
}

export default UserDatabase;