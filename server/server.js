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
app.post('/admin/planes', (req, res) => {
  try {
    const { name, price, description, features = [] } = req.body;

    // Validar datos de entrada
    if (!name || price === undefined || !description) {
      return res.status(400).json({ message: 'Datos incompletos para crear un plan' });
    }

    // Leer los planes existentes
    const planes = readJsonFile(PLANES_FILE);
    
    // Generar un nuevo ID incremental
    const newId = planes.length > 0 
      ? Math.max(...planes.map(p => p.id)) + 1 
      : 1;

    const newPlan = {
      id: newId,
      name,
      price: Number(price),
      description,
      features,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    planes.push(newPlan);

    // Guardar los planes actualizados
    writeJsonFile(PLANES_FILE, planes);
    
    res.status(201).json({ 
      message: 'Plan creado exitosamente', 
      plan: newPlan 
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ message: 'Error al crear el plan' });
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

// File upload endpoint
app.post('/upload', (req, res) => {
  try {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public/tests'))
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) // Unique filename
      }
    });
    const upload = multer({ storage: storage });
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      res.json({ 
        message: 'File uploaded successfully', 
        filename: req.file.filename,
        path: `/tests/${req.file.filename}`
      });
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error al subir el archivo' });
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
