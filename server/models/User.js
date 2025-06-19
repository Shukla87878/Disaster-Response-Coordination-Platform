// Mock authentication system with hard-coded users
export const mockUsers = {
  'netrunnerX': {
    id: 'netrunnerX',
    name: 'NetRunner X',
    role: 'admin',
    email: 'netrunner@disaster.org'
  },
  'reliefAdmin': {
    id: 'reliefAdmin',
    name: 'Relief Admin',
    role: 'admin', 
    email: 'admin@relief.org'
  },
  'contributor1': {
    id: 'contributor1',
    name: 'Emergency Contributor',
    role: 'contributor',
    email: 'contributor@emergency.org'
  },
  'citizen1': {
    id: 'citizen1',
    name: 'Concerned Citizen',
    role: 'contributor',
    email: 'citizen@community.org'
  }
};

export const authenticateUser = (userId) => {
  return mockUsers[userId] || null;
};

export const requireAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'] || 'netrunnerX'; // Default user for testing
  const user = authenticateUser(userId);
  
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  req.user = user;
  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};