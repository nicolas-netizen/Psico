const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const net = require('net');

const app = express();
const PORT = process.env.PORT || 3001;

// Comprehensive CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    message: 'An unexpected error occurred', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error' 
  });
});

app.use(express.json());

const USUARIOS_FILE = path.join(__dirname, 'usuarios.json');
const PLANES_FILE = path.join(__dirname, 'planes.json');
const TESTS_FILE = path.join(__dirname, 'tests.json');
const TEST_HISTORY_FILE = path.join(__dirname, 'test-history.json');
const TEST_RESULTS_FILE = path.join(__dirname, 'test_results.json');

// Utility functions
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
}

// Ensure admin user exists
function ensureAdminUser() {
  let users = readJsonFile(USUARIOS_FILE);
  const adminIndex = users.findIndex(u => u.email === 'admin@chapiri.com');

  const adminUser = {
    id: 'admin-1',
    email: 'admin@chapiri.com',
    name: 'Admin',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
    subscription: {
      planId: 'plan-1',
      planName: 'Administrador',
      purchaseDate: new Date().toISOString(),
      features: ['Acceso total al sistema']
    }
  };

  if (adminIndex === -1) {
    // Add admin user if not exists
    users.push(adminUser);
  } else {
    // Replace existing admin user to ensure correct credentials
    users[adminIndex] = adminUser;
  }

  writeJsonFile(USUARIOS_FILE, users);
  console.log('Admin user ensured successfully');
}

// Call this function when the server starts
ensureAdminUser();

// Login Route with enhanced error handling
app.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    const users = readJsonFile(USUARIOS_FILE);
    const user = users.find(u => u.email === email);

    if (!user) {
      console.log('User not found:', email);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Remove sensitive data before sending
    const { password: _, ...userWithoutPassword } = user;

    console.log('Login successful for:', email);
    res.status(200).json({ 
      message: 'Inicio de sesión exitoso', 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error en el inicio de sesión' });
  }
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
    const { userId, email, planId } = req.body;

    let users = readJsonFile(USUARIOS_FILE);
    const plans = readJsonFile(PLANES_FILE);

    // Find user by id, email, or generate a new id
    let userIndex = users.findIndex(u => 
      u.id === userId || u.email === userId || u.email === email
    );

    // If user not found, return error
    if (userIndex === -1) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado', 
        error: 'No se pudo identificar al usuario' 
      });
    }

    const plan = plans.find(p => p.id === planId);

    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    // Update user's subscription
    users[userIndex].subscription = {
      planId: plan.id,
      planName: plan.name,
      purchaseDate: new Date().toISOString(),
      features: plan.features
    };

    // Ensure email is present
    if (!users[userIndex].email) {
      users[userIndex].email = email;
    }

    // Write updated users back to file
    writeJsonFile(USUARIOS_FILE, users);

    const { password, ...userWithoutPassword } = users[userIndex];

    res.status(200).json({ 
      message: 'Suscripción comprada exitosamente', 
      subscription: users[userIndex].subscription,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error purchasing plan:', error);
    res.status(500).json({ 
      message: 'Error al comprar el plan', 
      error: error.message 
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

// Plan Routes
app.get('/planes', (req, res) => {
  try {
    const planes = readJsonFile(PLANES_FILE);
    res.status(200).json(planes);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Error al obtener los planes' });
  }
});

app.put('/planes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, features, featured, recommended, description } = req.body;
    
    console.log('Updating plan:', { id, body: req.body });
    
    let planes = readJsonFile(PLANES_FILE);
    const planIndex = planes.findIndex(p => p.id === id);

    if (planIndex === -1) {
      console.error('Plan not found:', id);
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    // Preserve existing values if not provided
    const updatedPlan = {
      ...planes[planIndex],
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(features !== undefined && { features }),
      ...(featured !== undefined && { featured }),
      ...(recommended !== undefined && { recommended }),
      ...(description !== undefined && { description }),
      updatedAt: new Date().toISOString()
    };

    // Remove any duplicate plans with the same ID
    planes = planes.filter(p => p.id !== id);
    
    // Add the updated plan
    planes.push(updatedPlan);

    // Ensure no duplicates
    planes = planes.filter((plan, index, self) => 
      index === self.findIndex(p => p.id === plan.id)
    );

    console.log('Updated plan:', updatedPlan);

    writeJsonFile(PLANES_FILE, planes);

    res.status(200).json({ 
      message: 'Plan actualizado exitosamente', 
      plan: updatedPlan 
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ message: 'Error al actualizar el plan', error: error.toString() });
  }
});

app.delete('/planes/:id', (req, res) => {
  try {
    const { id } = req.params;
    let planes = readJsonFile(PLANES_FILE);
    
    const initialLength = planes.length;
    planes = planes.filter(p => p.id !== id);

    if (planes.length === initialLength) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    writeJsonFile(PLANES_FILE, planes);

    res.status(200).json({ 
      message: 'Plan eliminado exitosamente', 
      planId: id 
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
