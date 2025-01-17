const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const net = require('net');

// Constants for file paths
const USUARIOS_FILE = path.join(__dirname, 'data', 'usuarios.json');
const PLANES_FILE = path.join(__dirname, 'data', 'planes.json');
const TESTS_FILE = path.join(__dirname, 'data', 'tests.json');
const TEST_RESULTS_FILE = path.join(__dirname, 'data', 'test_results.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize Express app
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// File paths
const USUARIOS_FILE = path.join(__dirname, 'usuarios.json');
const PLANES_FILE = path.join(__dirname, 'planes.json');
const TESTS_FILE = path.join(__dirname, 'tests.json');
const TEST_RESULTS_FILE = path.join(__dirname, 'test_results.json');

// Utility functions
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
}

// Initialize JSON files
function initializeJsonFiles() {
  const defaultPlanes = [
    {
      id: 'plan-1',
      name: 'Plan Básico',
      price: 0,
      features: ['Tests básicos', 'Acceso limitado'],
      maxTests: 3
    },
    {
      id: 'plan-2',
      name: 'Plan Premium',
      price: 29.99,
      features: ['Tests ilimitados', 'Acceso completo', 'Reportes detallados'],
      maxTests: -1
    }
  ];

  const defaultTests = [
    {
      id: 'test-1',
      title: 'Test de Aptitud Verbal',
      description: 'Evalúa tu comprensión verbal y vocabulario',
      category: 'verbal',
      difficulty: 1,
      questions: [
        {
          id: 'q1',
          text: '¿Cuál es el sinónimo de "efímero"?',
          options: ['Duradero', 'Pasajero', 'Eterno', 'Permanente'],
          correctOption: 1
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'test-2',
      title: 'Test de Razonamiento Numérico',
      description: 'Evalúa tu capacidad de resolver problemas matemáticos',
      category: 'numerical',
      difficulty: 2,
      questions: [
        {
          id: 'q1',
          text: 'Completa la serie: 2, 4, 8, 16, ...',
          options: ['24', '32', '30', '28'],
          correctOption: 1
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'test-3',
      title: 'Test de Razonamiento Lógico',
      description: 'Evalúa tu capacidad de pensamiento lógico',
      category: 'logical',
      difficulty: 2,
      questions: [
        {
          id: 'q1',
          text: 'Si A implica B, y B implica C, entonces...',
          options: [
            'A implica C',
            'C implica A',
            'No hay relación entre A y C',
            'A y C son iguales'
          ],
          correctOption: 0
        }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  if (!fs.existsSync(PLANES_FILE)) {
    writeJsonFile(PLANES_FILE, defaultPlanes);
  }
  
  if (!fs.existsSync(TESTS_FILE)) {
    writeJsonFile(TESTS_FILE, defaultTests);
  }
  
  if (!fs.existsSync(TEST_RESULTS_FILE)) {
    writeJsonFile(TEST_RESULTS_FILE, []);
  }
  
  if (!fs.existsSync(USUARIOS_FILE)) {
    writeJsonFile(USUARIOS_FILE, []);
  }
}

// Ensure admin user exists
async function ensureAdminUser() {
  try {
    const users = readJsonFile(USUARIOS_FILE);
    const adminExists = users.some(user => user.role === 'admin');

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = {
        id: uuidv4(),
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        name: 'Admin',
        createdAt: new Date().toISOString()
      };

      users.push(adminUser);
      writeJsonFile(USUARIOS_FILE, users);
      console.log('Admin user ensured successfully');
    }
  } catch (error) {
    console.error('Error ensuring admin user:', error);
  }
}

// Initialize files and admin user
initializeJsonFiles();
ensureAdminUser();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readJsonFile(USUARIOS_FILE);
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({ 
      user: userWithoutPassword,
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Protected routes
app.use('/api/users/stats', authenticateToken, (req, res) => {
  try {
    const userStats = {
      testsCompleted: 10,
      averageScore: 85,
      lastTestDate: new Date(),
      // Add more stats as needed
    };
    res.json(userStats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user stats' });
  }
});

app.use('/api/tests', authenticateToken);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  if (err.name === 'UnauthorizedError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Authentication required' });
  }
  res.status(500).json({ 
    message: 'An unexpected error occurred', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error' 
  });
});

// Register Route
app.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body;

    let users = readJsonFile(USUARIOS_FILE);

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create new user
    const newUser = {
      id: uuidv4(),
      email,
      name: name || email.split('@')[0],
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString(),
      subscription: {
        planId: 'plan-1',
        planName: 'Básico',
        purchaseDate: new Date().toISOString(),
        features: ['Plan básico de inicio']
      }
    };

    users.push(newUser);
    writeJsonFile(USUARIOS_FILE, users);

    // Remove sensitive data before sending
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({ 
      message: 'Registro exitoso', 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error en el registro' });
  }
});

// Plan Purchase Route
app.post('/purchase-plan', (req, res) => {
  try {
    const { userId, planId } = req.body;

    // Validate input
    if (!userId || !planId) {
      return res.status(400).json({ message: 'User ID and Plan ID are required' });
    }

    // Read users and plans
    const users = readJsonFile(USUARIOS_FILE);
    const plans = readJsonFile(PLANES_FILE);

    // Find user and plan
    const userIndex = users.findIndex(u => u.id === userId);
    const plan = plans.find(p => p.id === planId);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Update user's subscription
    users[userIndex].subscription = {
      planId: plan.id,
      planName: plan.name,
      purchaseDate: new Date().toISOString(),
      features: plan.features
    };

    // Save updated users
    writeJsonFile(USUARIOS_FILE, users);

    // Return updated user
    res.status(200).json(users[userIndex]);
  } catch (error) {
    console.error('Error purchasing plan:', error);
    res.status(500).json({ 
      message: 'Error al comprar el plan',
      error: error.toString() 
    });
  }
});

// Get Plans Route
app.get('/planes', (req, res) => {
  try {
    const planes = readJsonFile(PLANES_FILE);
    
    res.status(200).json(planes);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Error al obtener los planes' });
  }
});

// Endpoint para crear un nuevo test (Admin)
app.post('/admin/tests', (req, res) => {
  try {
    const { title, description, fileUrl, plans } = req.body;

    // Validar datos de entrada
    if (!title || !description || !fileUrl || !plans) {
      return res.status(400).json({ message: 'Datos incompletos para crear un test' });
    }

    const tests = readJsonFile(TESTS_FILE);
    const newTest = {
      id: tests.length > 0 ? Math.max(...tests.map(t => t.id)) + 1 : 1,
      title,
      description,
      fileUrl,
      plans
    };

    tests.push(newTest);
    writeJsonFile(TESTS_FILE, tests);
    
    res.status(201).json({ 
      message: 'Test creado exitosamente', 
      test: newTest 
    });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ message: 'Error al crear el test' });
  }
});

// Endpoint para crear un nuevo plan (Admin)
app.post('/planes', (req, res) => {
  try {
    const { name, price, features, description, recommended, featured } = req.body;
    
    console.log('Received plan data:', req.body);

    // Validar datos de entrada
    if (!name || !price) {
      return res.status(400).json({ message: 'Nombre y precio son requeridos' });
    }

    let planes = readJsonFile(PLANES_FILE);
    
    // Generar un ID único si no se proporciona
    const newPlanId = req.body.id || `plan-${Date.now()}`;

    // Verificar si ya existe un plan con el mismo ID
    const existingPlanIndex = planes.findIndex(p => p.id === newPlanId);

    // Crear el nuevo plan
    const newPlan = {
      id: newPlanId,
      name,
      price: parseFloat(price),
      features: features || [],
      description: description || '',
      recommended: recommended || false,
      featured: featured || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Si ya existe, reemplazar; si no, agregar
    if (existingPlanIndex !== -1) {
      planes[existingPlanIndex] = newPlan;
    } else {
      planes.push(newPlan);
    }

    // Ordenar planes por fecha de creación (más recientes primero)
    planes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Eliminar duplicados basados en ID
    planes = planes.filter((plan, index, self) => 
      index === self.findIndex(p => p.id === plan.id)
    );

    writeJsonFile(PLANES_FILE, planes);

    console.log('Plan created successfully:', newPlan);

    res.status(201).json(newPlan);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ message: 'Error al crear el plan', error: error.toString() });
  }
});

// Endpoint para actualizar un Plan
app.put('/admin/planes/:id', (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const { name, price, description, features } = req.body;

    // Leer los planes existentes
    const planes = readJsonFile(PLANES_FILE);
    
    // Encontrar el plan a actualizar
    const planIndex = planes.findIndex(p => p.id === planId);
    
    if (planIndex === -1) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    // Actualizar el plan
    planes[planIndex] = {
      ...planes[planIndex],
      ...(name && { name }),
      ...(price !== undefined && { price: Number(price) }),
      ...(description && { description }),
      ...(features && { features }),
      updatedAt: new Date().toISOString()
    };

    // Guardar los planes actualizados
    writeJsonFile(PLANES_FILE, planes);
    
    res.json({ 
      message: 'Plan actualizado exitosamente', 
      plan: planes[planIndex] 
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ message: 'Error al actualizar el plan' });
  }
});

// Endpoint para eliminar un Plan
app.delete('/admin/planes/:id', (req, res) => {
  try {
    const planId = parseInt(req.params.id);

    // Leer los planes existentes
    const planes = readJsonFile(PLANES_FILE);
    
    // Filtrar para eliminar el plan
    const updatedPlanes = planes.filter(p => p.id !== planId);
    
    if (updatedPlanes.length === planes.length) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    // Guardar los planes actualizados
    writeJsonFile(PLANES_FILE, updatedPlanes);
    
    res.json({ 
      message: 'Plan eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ message: 'Error al eliminar el plan' });
  }
});

// Endpoint para obtener tests según el plan del usuario
app.get('/tests/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const usuarios = readJsonFile(USUARIOS_FILE);
    const tests = readJsonFile(TESTS_FILE);

    const usuario = usuarios.find((u) => u.id === userId);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Filtrar tests según el plan del usuario
    const availableTests = tests.filter((test) => test.plans.includes(usuario.plan));
    
    res.json(availableTests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: 'Error al obtener los tests' });
  }
});

// Endpoint para actualizar el plan de un usuario
app.put('/usuarios/:userId/plan', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { planId } = req.body;

    // Validar datos de entrada
    if (!planId) {
      return res.status(400).json({ message: 'ID de plan no proporcionado' });
    }

    const usuarios = readJsonFile(USUARIOS_FILE);
    const usuario = usuarios.find((u) => u.id === userId);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar el plan del usuario
    usuario.plan = planId;

    writeJsonFile(USUARIOS_FILE, usuarios);
    
    res.json({ 
      message: 'Plan actualizado exitosamente', 
      usuario 
    });
  } catch (error) {
    console.error('Error updating user plan:', error);
    res.status(500).json({ message: 'Error al actualizar el plan del usuario' });
  }
});

// Endpoint para obtener todos los planes disponibles
app.get('/planes', (req, res) => {
  try {
    const planes = readJsonFile(PLANES_FILE);
    
    res.json(planes);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Error al obtener los planes' });
  }
});

// Endpoint para obtener todos los usuarios
app.get('/usuarios', (req, res) => {
  try {
    const usuarios = readJsonFile(USUARIOS_FILE);
    
    res.json(usuarios);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
});

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads/tests'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /pdf|docx?|txt/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, DOC, DOCX y TXT'));
    }
  }
});

// Ruta para subir archivos de tests
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo' });
  }

  res.json({
    message: 'Archivo subido exitosamente',
    path: `/uploads/tests/${req.file.filename}`
  });
});

// Ruta para crear un nuevo test
app.post('/tests', (req, res) => {
  try {
    const newTestData = req.body;

    // Validar datos de entrada
    if (!newTestData.title || !newTestData.description || 
        !newTestData.questions || newTestData.questions.length === 0 ||
        !newTestData.plans || newTestData.plans.length === 0) {
      return res.status(400).json({ 
        message: 'Datos incompletos para crear el test',
        details: {
          title: !!newTestData.title,
          description: !!newTestData.description,
          questions: newTestData.questions?.length || 0,
          plans: newTestData.plans?.length || 0
        }
      });
    }

    // Leer los tests existentes
    let tests = readJsonFile(TESTS_FILE);

    // Crear nuevo test con ID único
    const newTest = {
      ...newTestData,
      id: `test-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Agregar el nuevo test
    tests.push(newTest);

    // Guardar los tests actualizados
    writeJsonFile(TESTS_FILE, tests);
    
    res.status(201).json(newTest);
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ 
      message: 'Error al crear el test',
      error: error.toString() 
    });
  }
});

// Ruta para obtener tests de un plan específico
app.get('/tests/plan/:planId', (req, res) => {
  try {
    const { planId } = req.params;
    const tests = readJsonFile(TESTS_FILE);

    // Filtrar tests que incluyen el planId
    const planTests = tests.filter(test => 
      test.plans.includes(planId)
    );

    res.status(200).json(planTests);
  } catch (error) {
    console.error('Error fetching tests for plan:', error);
    res.status(500).json({ message: 'Error al obtener los tests del plan' });
  }
});

// Ruta para obtener tests disponibles para un usuario en un plan específico
app.get('/tests/user/:userId/plan/:planId', (req, res) => {
  try {
    const { userId, planId } = req.params;
    const tests = readJsonFile(TESTS_FILE);
    const userHistory = readJsonFile(TEST_HISTORY_FILE);

    // Filtrar tests que incluyen el planId
    const planTests = tests.filter(test => 
      test.plans.includes(planId)
    );

    // Filtrar tests que el usuario no ha completado
    const availableTests = planTests.filter(test => {
      const userTestHistory = userHistory.find(
        history => history.userId === userId && history.testId === test.id
      );
      return !userTestHistory || !userTestHistory.completed;
    });

    res.status(200).json(availableTests);
  } catch (error) {
    console.error('Error fetching available tests:', error);
    res.status(500).json({ message: 'Error al obtener los tests disponibles' });
  }
});

// Ruta para obtener todos los tests
app.get('/tests', (req, res) => {
  try {
    const tests = readJsonFile(TESTS_FILE);
    res.status(200).json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: 'Error al obtener los tests' });
  }
});

// Ruta para actualizar un test existente
app.put('/tests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updatedTestData = req.body;

    // Leer los tests existentes
    let tests = readJsonFile(TESTS_FILE);
    
    // Encontrar el índice del test a actualizar
    const testIndex = tests.findIndex(test => test.id === id);
    
    if (testIndex === -1) {
      return res.status(404).json({ message: 'Test no encontrado' });
    }

    // Actualizar el test
    tests[testIndex] = {
      ...tests[testIndex],
      ...updatedTestData,
      updatedAt: new Date().toISOString()
    };

    // Guardar los tests actualizados
    writeJsonFile(TESTS_FILE, tests);
    
    res.json({
      message: 'Test actualizado exitosamente',
      test: tests[testIndex]
    });
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ message: 'Error al actualizar el test' });
  }
});

// Ruta para eliminar un test
app.delete('/tests/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Leer los tests existentes
    let tests = readJsonFile(TESTS_FILE);
    
    // Filtrar para eliminar el test
    const updatedTests = tests.filter(test => test.id !== id);
    
    if (updatedTests.length === tests.length) {
      return res.status(404).json({ message: 'Test no encontrado' });
    }

    // Guardar los tests actualizados
    writeJsonFile(TESTS_FILE, updatedTests);
    
    res.json({ 
      message: 'Test eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ message: 'Error al eliminar el test' });
  }
});

// Ruta para guardar el historial de tests
app.post('/test-history', (req, res) => {
  try {
    const { userId, testId, score, totalQuestions, percentage, completedAt } = req.body;

    // Validar datos de entrada
    if (!userId || !testId) {
      return res.status(400).json({ message: 'Datos incompletos para guardar el historial del test' });
    }

    // Leer el historial de tests existente
    const testHistory = readJsonFile(TEST_HISTORY_FILE);

    // Crear nueva entrada de historial
    const newHistoryEntry = {
      id: `history-${Date.now()}`,
      userId,
      testId,
      score,
      totalQuestions,
      percentage,
      completedAt
    };

    // Agregar la nueva entrada
    testHistory.push(newHistoryEntry);

    // Guardar el historial actualizado
    writeJsonFile(TEST_HISTORY_FILE, testHistory);
    
    res.status(201).json(newHistoryEntry);
  } catch (error) {
    console.error('Error saving test history:', error);
    res.status(500).json({ message: 'Error al guardar el historial del test' });
  }
});

// Ruta para obtener el historial de tests de un usuario
app.get('/test-history/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    // Leer el historial de tests
    const testHistory = readJsonFile(TEST_HISTORY_FILE);

    // Filtrar historial por usuario
    const userTestHistory = testHistory.filter(history => 
      history.userId === userId
    );

    // Ordenar por fecha de completado (más reciente primero)
    const sortedHistory = userTestHistory.sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    res.status(200).json(sortedHistory);
  } catch (error) {
    console.error('Error fetching user test history:', error);
    res.status(500).json({ message: 'Error al obtener el historial de tests' });
  }
});

// Ruta para obtener tests por plan de usuario
app.get('/tests-by-plan/:planId', (req, res) => {
  try {
    const { planId } = req.params;
    console.log('DEBUG: Requested Plan ID:', planId);

    // Leer los tests existentes
    const tests = readJsonFile(TESTS_FILE);
    console.log('DEBUG: All Tests:', JSON.stringify(tests, null, 2));

    // Filtrar tests por plan
    const planTests = tests.filter(test => {
      console.log('DEBUG: Checking Test:', JSON.stringify(test, null, 2));
      console.log('DEBUG: Test Plans:', test.plans);
      console.log('DEBUG: Matching Condition:', 
        test.plans && (test.plans.includes(planId) || test.plans.includes(parseInt(planId.replace('plan-', ''))))
      );
      
      return test.plans && (
        test.plans.includes(planId) || 
        test.plans.includes(parseInt(planId.replace('plan-', '')))
      );
    });

    console.log('DEBUG: Filtered Plan Tests:', JSON.stringify(planTests, null, 2));

    // Si no hay tests para el plan, devolver un array vacío
    const normalizedTests = planTests.map(test => ({
      ...test,
      // Normalizar el formato de los tests
      id: test.id || `test-${Date.now()}`,
      title: test.title || 'Test Sin Título',
      description: test.description || 'Sin descripción',
      questions: test.questions || [],
      plans: test.plans || [],
      difficulty: test.difficulty || 'basic',
      timeLimit: test.timeLimit || 30
    }));

    console.log('DEBUG: Normalized Tests:', JSON.stringify(normalizedTests, null, 2));

    res.status(200).json(normalizedTests);
  } catch (error) {
    console.error('ERROR fetching tests for plan:', error);
    res.status(500).json({ 
      message: 'Error al obtener los tests para el plan',
      error: error.toString() 
    });
  }
});

// Ruta para obtener detalles de un plan específico
app.get('/plan/:planId', (req, res) => {
  try {
    const { planId } = req.params;
    const plans = readJsonFile(PLANES_FILE);
    
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }
    
    res.status(200).json(plan);
  } catch (error) {
    console.error('Error fetching plan details:', error);
    res.status(500).json({ 
      message: 'Error al obtener los detalles del plan',
      error: error.toString() 
    });
  }
});

// Ping route for connection testing
app.get('/ping', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Add a timestamp to log messages
function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Log server startup and configuration
logWithTimestamp('Server configuration started');
logWithTimestamp(`Environment: ${process.env.NODE_ENV || 'development'}`);
logWithTimestamp(`Current working directory: ${process.cwd()}`);

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        findAvailablePort(startPort + 1)
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Wrap the server startup in a function that returns a promise
function initializeServer() {
  return new Promise((resolve, reject) => {
    findAvailablePort(3001)
      .then(availablePort => {
        logWithTimestamp(`Starting server on port ${availablePort}`);
        
        const server = app.listen(availablePort, () => {
          logWithTimestamp(`Servidor corriendo en http://localhost:${availablePort}`);
          
          // Write the current port to a file for other scripts to read
          try {
            fs.writeFileSync(path.join(__dirname, 'current_port.txt'), availablePort.toString(), 'utf8');
          } catch (writeErr) {
            logWithTimestamp(`Error writing port file: ${writeErr.message}`);
          }

          // Resolve the promise with the server instance
          resolve(server);
        });

        // Handle server errors
        server.on('error', (error) => {
          logWithTimestamp(`Server error: ${error.message}`);
          reject(error);
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
          logWithTimestamp('Shutting down server...');
          server.close(() => {
            logWithTimestamp('Server stopped');
            process.exit(0);
          });
        });
      })
      .catch(err => {
        logWithTimestamp(`Failed to start server: ${err.message}`);
        reject(err);
      });
  });
}

// Call the initialization function
initializeServer()
  .then(server => {
    // Any additional setup can be done here
    logWithTimestamp('Server initialized successfully');
  })
  .catch(err => {
    logWithTimestamp(`Server initialization failed: ${err.message}`);
    process.exit(1);
  });

module.exports = app; // For testing purposes

// Ruta para guardar resultados de tests
app.post('/test-result', (req, res) => {
  try {
    const testResult = req.body;
    
    // Leer resultados existentes
    let testResults = [];
    try {
      testResults = readJsonFile(TEST_RESULTS_FILE);
    } catch (readError) {
      console.log('No existing test results file, creating new one');
    }

    // Agregar nuevo resultado
    testResults.push({
      ...testResult,
      id: `result-${Date.now()}`,
      createdAt: new Date().toISOString()
    });

    // Guardar resultados actualizados
    writeJsonFile(TEST_RESULTS_FILE, testResults);

    res.status(201).json({ 
      message: 'Resultado de test guardado exitosamente',
      result: testResult 
    });
  } catch (error) {
    console.error('Error saving test result:', error);
    res.status(500).json({ 
      message: 'Error al guardar el resultado del test',
      error: error.toString() 
    });
  }
});

// Ruta para obtener historial de tests de un usuario
app.get('/user-test-history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    // Leer resultados de tests
    const testResults = readJsonFile(TEST_RESULTS_FILE);
    
    // Filtrar resultados por usuario
    const userTestHistory = testResults
      .filter(result => result.userId === userId)
      .map(result => ({
        id: result.id,
        testId: result.testId,
        score: result.score,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        completedAt: result.completedAt
      }))
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    res.status(200).json(userTestHistory);
  } catch (error) {
    console.error('Error fetching user test history:', error);
    res.status(500).json({ 
      message: 'Error al obtener el historial de tests',
      error: error.toString() 
    });
  }
});

// Add this route before the last routes in the file
app.get('/plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const plans = readJsonFile(PLANES_FILE);
    const plan = plans.find(p => p.id === id);

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const TestService = require('./services/testService');

// Add these routes to your existing server.js
app.post('/tests/generate', (req, res) => {
  try {
    console.log('Test Generation Request Received:', {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });

    const { configuration, userId } = req.body;
    
    // Validate configuration
    if (!configuration) {
      console.error('Invalid test configuration: No configuration provided');
      return res.status(400).json({ message: 'Invalid test configuration' });
    }

    if (!userId) {
      console.error('Invalid test generation: No userId provided');
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate user existence 
    const users = readJsonFile(USUARIOS_FILE);
    const user = users.find(u => u.id === userId);
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure required configuration fields exist
    const defaultConfiguration = {
      name: configuration.name || 'Default Test',
      totalQuestions: configuration.totalQuestions || 5,
      timeLimit: configuration.timeLimit || 30,
      requiredCategories: configuration.requiredCategories || [
        'mathematical', 
        'language', 
        'logical_reasoning'
      ],
      questionDistribution: configuration.questionDistribution || {
        'mathematical': { minQuestions: 1, maxQuestions: 2 },
        'language': { minQuestions: 1, maxQuestions: 2 },
        'logical_reasoning': { minQuestions: 1, maxQuestions: 2 }
      },
      scoreWeights: configuration.scoreWeights || [
        {
          category: 'mathematical',
          basePoints: 1,
          difficultyMultiplier: {
            'basic': 1,
            'intermediate': 1.5,
            'advanced': 2
          }
        }
      ]
    };

    const generatedTest = TestService.generateTest(defaultConfiguration);
    
    if (!generatedTest || !generatedTest.questions || generatedTest.questions.length === 0) {
      console.error('Test generation failed: No questions generated', { configuration: defaultConfiguration });
      return res.status(500).json({ message: 'Failed to generate test' });
    }

    console.log('Test Generated Successfully:', {
      testId: generatedTest.id,
      questionCount: generatedTest.questions.length
    });

    res.status(200).json(generatedTest);
  } catch (error) {
    console.error('Comprehensive Test Generation Error:', {
      message: error.message,
      stack: error.stack,
      configuration: req.body.configuration
    });
    
    res.status(500).json({ 
      message: 'Error generating test', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/tests/submit', (req, res) => {
  try {
    const { testId } = req.params;
    const { userAnswers } = req.body;

    // Read the test to get correct answers
    const tests = readJsonFile(TESTS_FILE);
    const test = tests.find(t => t.id === testId);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Mark answers as correct or incorrect
    const markedAnswers = userAnswers.map(answer => {
      const testQuestion = test.questions.find(q => q.id === answer.questionId);
      
      return {
        ...answer,
        isCorrect: testQuestion 
          ? testQuestion.correctOption === answer.selectedOption 
          : false
      };
    });

    // Read existing test results
    let testResults = readJsonFile(TEST_RESULTS_FILE);

    // Create a new test result entry
    const newTestResult = {
      id: `result-${Date.now()}`,
      testId,
      userId: req.body.userId || 'unknown', // You might want to get this from authentication
      answers: markedAnswers,
      timestamp: new Date().toISOString(),
      score: calculateTestScore(markedAnswers)
    };

    // Add the new test result
    testResults.push(newTestResult);

    // Write back to file
    writeJsonFile(TEST_RESULTS_FILE, testResults);

    // Return the test result
    res.status(200).json(newTestResult);
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: 'Error al enviar el test', error: error.message });
  }
});

app.get('/tests/error-statistics', (req, res) => {
  try {
    const testResults = readJsonFile(TEST_RESULTS_FILE);
    
    // Aggregate error statistics
    const errorStatistics = {
      overallErrorRate: 0,
      categoryErrors: {},
      mostDifficultQuestions: []
    };

    const questionErrorCount = {};

    testResults.forEach(result => {
      result.incorrectQuestions.forEach(questionId => {
        if (!questionErrorCount[questionId]) {
          questionErrorCount[questionId] = 0;
        }
        questionErrorCount[questionId]++;
      });
    });

    // Sort questions by error frequency
    errorStatistics.mostDifficultQuestions = Object.entries(questionErrorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([questionId, errorCount]) => ({
        questionId,
        errorCount,
        errorPercentage: (errorCount / testResults.length) * 100
      }));

    res.status(200).json(errorStatistics);
  } catch (error) {
    console.error('Error statistics generation error:', error);
    res.status(500).json({ message: 'Error generating error statistics', error: error.message });
  }
});

// Ruta para obtener tests disponibles para un usuario en un plan específico
app.get('/tests/available', (req, res) => {
  try {
    const users = readJsonFile(USUARIOS_FILE);
    const user = users.find(u => u.id === req.user.id);
    const userPlan = readJsonFile(PLANES_FILE).find(p => p.id === user.planId);
    const tests = readJsonFile(TESTS_FILE).filter(t => t.difficulty <= userPlan.maxDifficulty);
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/tests/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const tests = readJsonFile(TESTS_FILE);
    const test = tests.find(t => t.id === id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Verificar si el usuario tiene acceso a este test
    const users = readJsonFile(USUARIOS_FILE);
    const user = users.find(u => u.id === req.user.id);
    const userPlan = readJsonFile(PLANES_FILE).find(p => p.id === user.planId);
    
    if (test.difficulty > userPlan.maxDifficulty) {
      return res.status(403).json({ message: 'No tienes acceso a este test' });
    }

    res.json(test);
  } catch (error) {
    console.error('Error getting test:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/tests/:id/submit', (req, res) => {
  try {
    const { id } = req.params;
    const { userAnswers } = req.body;

    const tests = readJsonFile(TESTS_FILE);
    const test = tests.find(t => t.id === id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const markedAnswers = userAnswers.map(answer => {
      const testQuestion = test.questions.find(q => q.id === answer.questionId);
      
      return {
        ...answer,
        isCorrect: testQuestion 
          ? testQuestion.correctOption === answer.selectedOption 
          : false
      };
    });

    let testResults = readJsonFile(TEST_RESULTS_FILE);

    const newTestResult = {
      id: `result-${Date.now()}`,
      testId: id,
      userId: req.body.userId || 'unknown', // You might want to get this from authentication
      answers: markedAnswers,
      timestamp: new Date().toISOString(),
      score: calculateTestScore(markedAnswers)
    };

    testResults.push(newTestResult);

    writeJsonFile(TEST_RESULTS_FILE, testResults);

    res.json(newTestResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/tests/:id', (req, res) => {
  try {
    const { id } = req.params;

    let tests = readJsonFile(TESTS_FILE);

    const updatedTests = tests.filter(t => t.id !== id);

    if (updatedTests.length === tests.length) {
      return res.status(404).json({ message: 'Test not found' });
    }

    writeJsonFile(TESTS_FILE, updatedTests);

    res.json({ message: 'Test deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User stats and plan routes
app.get('/users/stats', authenticateToken, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const testResults = readJsonFile(TEST_RESULTS_FILE);
    const userTestResults = testResults.filter(r => r.userId === req.user.id);

    const stats = {
      totalTests: userTestResults.length,
      averageScore: userTestResults.length > 0
        ? Math.round(userTestResults.reduce((acc, curr) => acc + curr.score, 0) / userTestResults.length)
        : 0,
      totalTime: userTestResults.length * 30, // Asumiendo 30 minutos por test
      testHistory: userTestResults.map(result => ({
        id: result.id,
        testId: result.testId,
        date: result.timestamp,
        score: result.score
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/users/plan', (req, res) => {
  try {
    const users = readJsonFile(USUARIOS_FILE);
    const user = users.find(u => u.id === req.user.id);
    
    if (!user || !user.planId) {
      return res.json({
        name: 'Plan Básico',
        expiryDate: null,
        features: ['Tests básicos'],
        testsRemaining: 3
      });
    }
    
    const plans = readJsonFile(PLANES_FILE);
    const userPlan = plans.find(p => p.id === user.planId);
    
    if (!userPlan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    res.json({
      name: userPlan.name,
      expiryDate: user.planExpiryDate,
      features: userPlan.features,
      testsRemaining: userPlan.testsPerMonth - (user.testsThisMonth || 0)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// API routes
app.use('/api', express.Router()
  .post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const users = readJsonFile(USUARIOS_FILE);
      const user = users.find(u => u.email === email);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role }, 
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from user object before sending
      const { password: _, ...userWithoutPassword } = user;

      res.json({ 
        user: userWithoutPassword,
        token 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  })
);

// Protected API routes
app.use('/api/users/stats', authenticateToken);
app.use('/api/tests', authenticateToken);

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Test routes
app.get('/api/tests', authenticateToken, (req, res) => {
  try {
    const tests = readJsonFile(TESTS_FILE);
    res.json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: 'Error al obtener los tests' });
  }
});

app.get('/api/tests/recent', authenticateToken, (req, res) => {
  try {
    const tests = readJsonFile(TESTS_FILE);
    const recentTests = tests
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
    res.json(recentTests);
  } catch (error) {
    console.error('Error fetching recent tests:', error);
    res.status(500).json({ message: 'Error al obtener tests recientes' });
  }
});

app.get('/api/tests/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const tests = readJsonFile(TESTS_FILE);
    const test = tests.find(t => t.id === id);
    
    if (!test) {
      return res.status(404).json({ message: 'Test no encontrado' });
    }
    
    res.json(test);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ message: 'Error al obtener el test' });
  }
});

app.post('/api/tests/:id/submit', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const tests = readJsonFile(TESTS_FILE);
    const test = tests.find(t => t.id === id);
    
    if (!test) {
      return res.status(404).json({ message: 'Test no encontrado' });
    }
    
    // Calculate score (implement your scoring logic here)
    const score = Math.floor(Math.random() * 100); // Placeholder scoring
    
    // Save test result
    const testResults = readJsonFile(TEST_RESULTS_FILE);
    const newResult = {
      id: uuidv4(),
      userId: req.user.id,
      testId: id,
      answers,
      score,
      date: new Date().toISOString()
    };
    
    testResults.push(newResult);
    writeJsonFile(TEST_RESULTS_FILE, testResults);
    
    res.json(newResult);
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: 'Error al enviar el test' });
  }
});

app.get('/api/users/stats', authenticateToken, (req, res) => {
  try {
    const testResults = readJsonFile(TEST_RESULTS_FILE);
    const userResults = testResults.filter(result => result.userId === req.user.id);
    
    const stats = {
      totalTests: userResults.length,
      averageScore: userResults.length > 0
        ? Math.round(userResults.reduce((acc, curr) => acc + curr.score, 0) / userResults.length)
        : 0,
      totalTime: userResults.length * 30, // Asumiendo 30 minutos por test
      testHistory: userResults.map(result => ({
        id: result.id,
        testId: result.testId,
        date: result.date,
        score: result.score
      }))
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Error getting user stats' });
  }
});

app.get('/api/users/plan', authenticateToken, (req, res) => {
  try {
    const users = readJsonFile(USUARIOS_FILE);
    const user = users.find(u => u.id === req.user.id);
    
    if (!user || !user.planId) {
      return res.json({
        name: 'Free',
        expiryDate: null,
        features: ['Basic Tests', 'Limited Access'],
        testsRemaining: 3
      });
    }
    
    const plans = readJsonFile(PLANES_FILE);
    const userPlan = plans.find(p => p.id === user.planId);
    
    if (!userPlan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    res.json({
      name: userPlan.name,
      expiryDate: user.planExpiryDate,
      features: userPlan.features,
      testsRemaining: userPlan.testsPerMonth || -1 // -1 means unlimited
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    res.status(500).json({ message: 'Error fetching user plan' });
  }
});

app.post('/api/tests/:testId/submit', authenticateToken, (req, res) => {
  try {
    const { testId } = req.params;
    const { answers } = req.body;
    const tests = readJsonFile(TESTS_FILE);
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Calculate score
    const score = calculateTestScore(answers);
    
    // Save test result
    const testResults = readJsonFile(TEST_RESULTS_FILE);
    const newResult = {
      id: uuidv4(),
      userId: req.user.id,
      testId,
      answers,
      score,
      date: new Date().toISOString()
    };
    
    testResults.push(newResult);
    writeJsonFile(TEST_RESULTS_FILE, testResults);
    
    res.json(newResult);
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: 'Error submitting test' });
  }
});

app.get('/api/users/stats', authenticateToken, (req, res) => {
  try {
    const testResults = readJsonFile(TEST_RESULTS_FILE);
    const userResults = testResults.filter(result => result.userId === req.user.id);
    
    const stats = {
      totalTests: userResults.length,
      averageScore: userResults.length > 0
        ? Math.round(userResults.reduce((acc, curr) => acc + curr.score, 0) / userResults.length)
        : 0,
      totalTime: userResults.length * 30, // Asumiendo 30 minutos por test
      testHistory: userResults.map(result => ({
        id: result.id,
        testId: result.testId,
        date: result.date,
        score: result.score
      }))
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Error getting user stats' });
  }
});

// Aptitude tests routes
app.get('/tests/aptitudes', (req, res) => {
  try {
    const { aptitude } = req.query;
    const aptitudeTests = readJsonFile(path.join(__dirname, 'aptitude_tests.json'));
    
    if (!aptitude) {
      return res.status(400).json({ message: 'Se requiere especificar una aptitud' });
    }

    const filteredTests = aptitudeTests.filter(test => 
      test.aptitude.toLowerCase() === aptitude.toString().toLowerCase()
    );

    res.status(200).json(filteredTests);
  } catch (error) {
    console.error('Error fetching aptitude tests:', error);
    res.status(500).json({ message: 'Error al obtener los tests de aptitud' });
  }
});

// Update test generation route to handle aptitude-specific tests
app.post('/tests/generate', (req, res) => {
  try {
    const { configuration, userId } = req.body;
    
    // Validate configuration
    if (!configuration || !userId) {
      return res.status(400).json({ message: 'Invalid test configuration or user ID' });
    }

    const allQuestions = TestService.readQuestions();
    let selectedQuestions = [];

    // Random test generation
    if (configuration.type === 'random') {
      const requiredCategories = configuration.requiredCategories || [];
      
      requiredCategories.forEach(category => {
        const categoryQuestions = allQuestions.filter(q => 
          q.category === category && q.isActive
        );

        const randomQuestions = TestService.selectRandomQuestions(
          categoryQuestions, 
          2, 
          4
        );

        selectedQuestions.push(...randomQuestions);
      });
    } 
    // Aptitude-specific test generation
    else if (configuration.type === 'aptitude') {
      const aptitudeQuestions = allQuestions.filter(q => 
        q.aptitude === configuration.specificAptitude && q.isActive
      );

      selectedQuestions = TestService.selectRandomQuestions(
        aptitudeQuestions, 
        5, 
        10
      );
    } else {
      return res.status(400).json({ message: 'Invalid test type' });
    }

    // Generate test
    const generatedTest = {
      id: uuidv4(),
      title: `${configuration.type === 'random' ? 'Test Aleatorio' : configuration.specificAptitude} - ${new Date().toLocaleDateString()}`,
      questions: selectedQuestions,
      timeLimit: 30, // Default 30 minutes
      createdAt: new Date().toISOString()
    };

    res.status(200).json(generatedTest);
  } catch (error) {
    console.error('Comprehensive Test Generation Error:', error);
    res.status(500).json({ 
      message: 'Error generating test', 
      error: error.message 
    });
  }
});

app.post('/tests/:testId/submit', (req, res) => {
  try {
    const { testId } = req.params;
    const { userAnswers } = req.body;

    // Read the test to get correct answers
    const tests = readJsonFile(TESTS_FILE);
    const test = tests.find(t => t.id === testId);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Mark answers as correct or incorrect
    const markedAnswers = userAnswers.map(answer => {
      const testQuestion = test.questions.find(q => q.id === answer.questionId);
      
      return {
        ...answer,
        isCorrect: testQuestion 
          ? testQuestion.correctOption === answer.selectedOption 
          : false
      };
    });

    // Read existing test results
    let testResults = readJsonFile(TEST_RESULTS_FILE);

    // Create a new test result entry
    const newTestResult = {
      id: `result-${Date.now()}`,
      testId,
      userId: req.body.userId || 'unknown', // You might want to get this from authentication
      answers: markedAnswers,
      timestamp: new Date().toISOString(),
      score: calculateTestScore(markedAnswers)
    };

    // Add the new test result
    testResults.push(newTestResult);

    // Write back to file
    writeJsonFile(TEST_RESULTS_FILE, testResults);

    // Return the test result
    res.status(200).json(newTestResult);
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: 'Error al enviar el test', error: error.message });
  }
});

// Helper function to calculate test score
function calculateTestScore(userAnswers) {
  let correctAnswers = 0;
  userAnswers.forEach(answer => {
    const question = answer.question;
    if (question && question.correctOption === answer.selectedOption) {
      correctAnswers++;
    }
  });
  return Math.round((correctAnswers / userAnswers.length) * 100);
}
