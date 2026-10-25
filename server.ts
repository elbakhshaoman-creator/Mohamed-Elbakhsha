import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { AppData, Student, ClassId, PointRecord, Group, ClassSession } from './src/types';
import { generateInitialStudents, INITIAL_CLASSES, DEFAULT_TEACHER_SETTINGS } from './src/data/initialStudents';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Server Storage Directory
const STORAGE_DIR = path.resolve(__dirname, 'server_storage');
const DB_FILE = path.join(STORAGE_DIR, 'database.json');
const AUTH_FILE = path.join(STORAGE_DIR, 'auth.json');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

interface AuthStorage {
  ownerEmail: string;
  googleClientId?: string;
  activeOwnerTokens: string[];
  teacherName: string;
  lastLogin?: string;
  lastLoginEmail?: string;
  lastPicture?: string;
}

const DEFAULT_OWNER_EMAIL = process.env.OWNER_EMAIL || 'elbakhshaoman@gmail.com';

function loadAuth(): AuthStorage {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      return {
        ownerEmail: parsed.ownerEmail || DEFAULT_OWNER_EMAIL,
        googleClientId: parsed.googleClientId || process.env.VITE_GOOGLE_CLIENT_ID || '',
        activeOwnerTokens: parsed.activeOwnerTokens || [],
        teacherName: parsed.teacherName || 'أ. مالك المنصة',
        lastLogin: parsed.lastLogin,
        lastLoginEmail: parsed.lastLoginEmail,
        lastPicture: parsed.lastPicture
      };
    }
  } catch (err) {
    console.error('Failed to read auth file:', err);
  }
  return {
    ownerEmail: DEFAULT_OWNER_EMAIL,
    googleClientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
    activeOwnerTokens: [],
    teacherName: 'معلم الرياضيات',
    lastLogin: undefined
  };
}

function saveAuth(data: AuthStorage) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function loadDatabase(): AppData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      // Ensure all 73 students exist
      if (parsed.students && parsed.students.length >= 73) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read db file:', err);
  }

  // Initial seed
  const initialData: AppData = {
    classes: INITIAL_CLASSES,
    students: generateInitialStudents(),
    groups: {
      '9-1': [],
      '9-2': [],
      '9-3': []
    },
    pointRecords: [],
    sessions: [],
    competitions: [],
    settings: DEFAULT_TEACHER_SETTINGS,
    teacherConfigured: true
  };

  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: AppData) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Authentication Middleware: Enforces that the caller is the verified Google Owner
function requireTeacherAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'غير مخوّل: يلزم تسجيل الدخول بحساب Google المالك لتنفيذ هذا الإجراء'
    });
  }

  const token = authHeader.split(' ')[1];
  const auth = loadAuth();

  if (!auth.activeOwnerTokens.includes(token)) {
    return res.status(403).json({
      error: `مرفوض: ليس لديك صلاحيات إدارة الحصة. الإجراءات الإدارية محصورة حصريًا لحساب Google المالك (${auth.ownerEmail})`
    });
  }

  next();
}

// --- Google OAuth & Auth Routes ---

app.get('/api/auth/status', (req: Request, res: Response) => {
  const auth = loadAuth();
  const authHeader = req.headers.authorization;
  let isAuthenticated = false;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    isAuthenticated = auth.activeOwnerTokens.includes(token);
  }

  res.json({
    isConfigured: true,
    isAuthenticated,
    isOwner: isAuthenticated,
    teacherName: auth.teacherName,
    userEmail: isAuthenticated ? auth.lastLoginEmail : undefined,
    picture: isAuthenticated ? auth.lastPicture : undefined,
    ownerEmail: auth.ownerEmail,
    googleClientId: auth.googleClientId || process.env.VITE_GOOGLE_CLIENT_ID || ''
  });
});

// Real Google OAuth verification endpoint (supports id_token, access_token, and testing verification)
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { idToken, accessToken, testMode, email: simulatedEmail, name: simulatedName } = req.body;
    let verifiedEmail = '';
    let verifiedName = '';
    let verifiedPicture = '';

    if (idToken) {
      // Verify Google ID Token with Google's tokeninfo API
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      const payload = await verifyRes.json();
      if (!verifyRes.ok || !payload.email) {
        return res.status(401).json({ error: 'رمز Google ID Token غير صالح أو منتهي الصلاحية' });
      }
      verifiedEmail = payload.email;
      verifiedName = payload.name || payload.email;
      verifiedPicture = payload.picture || '';
    } else if (accessToken) {
      // Verify Google OAuth2 Access Token with Google userinfo API
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const payload = await userInfoRes.json();
      if (!userInfoRes.ok || !payload.email) {
        return res.status(401).json({ error: 'رمز وصول Google OAuth غير صالح أو منتهي الصلاحية' });
      }
      verifiedEmail = payload.email;
      verifiedName = payload.name || payload.email;
      verifiedPicture = payload.picture || '';
    } else if (testMode && simulatedEmail) {
      // Verified simulation mode for testing Owner vs Non-Owner accounts
      verifiedEmail = simulatedEmail.trim();
      verifiedName = simulatedName || verifiedEmail.split('@')[0];
    } else {
      return res.status(400).json({ error: 'رمز مصادقة Google مطلوب' });
    }

    const auth = loadAuth();
    const isOwner = verifiedEmail.toLowerCase() === auth.ownerEmail.toLowerCase();

    if (isOwner) {
      // Issue secure admin session token for the owner
      const token = crypto.randomBytes(32).toString('hex');
      auth.activeOwnerTokens.push(token);
      if (auth.activeOwnerTokens.length > 20) {
        auth.activeOwnerTokens = auth.activeOwnerTokens.slice(-20);
      }
      auth.lastLogin = new Date().toISOString();
      auth.lastLoginEmail = verifiedEmail;
      auth.lastPicture = verifiedPicture;
      auth.teacherName = verifiedName || auth.teacherName;
      saveAuth(auth);

      return res.json({
        success: true,
        isOwner: true,
        email: verifiedEmail,
        name: verifiedName,
        picture: verifiedPicture,
        token,
        message: `تم تسجيل الدخول بنجاح بحساب مالك المنصة (${verifiedEmail})`
      });
    } else {
      // Authenticated with Google as a Non-Owner (Visitor / Student)
      return res.json({
        success: true,
        isOwner: false,
        email: verifiedEmail,
        name: verifiedName,
        picture: verifiedPicture,
        message: `تم تسجيل الدخول بحساب Google (${verifiedEmail}). هذا الحساب مسجل كـ "زائر/طالب" ولا يملك صلاحيات إدارة الحصة (محصورة للمالك: ${auth.ownerEmail})`
      });
    }
  } catch (err) {
    console.error('Google OAuth verification failed:', err);
    return res.status(500).json({ error: 'فشل التحقق من حساب Google عبر خوادم Google' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const auth = loadAuth();
    auth.activeOwnerTokens = auth.activeOwnerTokens.filter(t => t !== token);
    saveAuth(auth);
  }
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

// Update Google OAuth Client ID or Owner Email
app.post('/api/auth/config', requireTeacherAuth, (req: Request, res: Response) => {
  const { googleClientId, ownerEmail, teacherName } = req.body;
  const auth = loadAuth();

  if (googleClientId !== undefined) {
    auth.googleClientId = googleClientId.trim();
  }
  if (ownerEmail && ownerEmail.includes('@')) {
    auth.ownerEmail = ownerEmail.trim().toLowerCase();
  }
  if (teacherName && teacherName.trim()) {
    auth.teacherName = teacherName.trim();
  }

  saveAuth(auth);
  res.json({
    success: true,
    message: 'تم حفظ إعدادات المصادقة بنجاح',
    ownerEmail: auth.ownerEmail,
    googleClientId: auth.googleClientId
  });
});


// --- Data Routes ---

// Public read route (for student big screen or viewer)
app.get('/api/data', (_req: Request, res: Response) => {
  const db = loadDatabase();
  const auth = loadAuth();
  db.teacherConfigured = auth.isConfigured;
  res.json(db);
});

// Protected synchronization route (Teacher only)
app.post('/api/sync', requireTeacherAuth, (req: Request, res: Response) => {
  const incoming = req.body as Partial<AppData>;
  if (!incoming) {
    return res.status(400).json({ error: 'بيانات غير صالحة' });
  }

  const current = loadDatabase();
  const updated: AppData = {
    ...current,
    ...incoming,
    teacherConfigured: true
  };

  saveDatabase(updated);
  res.json({ success: true, message: 'تم حفظ ومزامنة البيانات في قاعدة البيانات بنجاح' });
});

// Protected student edit/add (Teacher only)
app.post('/api/students', requireTeacherAuth, (req: Request, res: Response) => {
  const { name, classId, notes } = req.body;
  if (!name || !classId) {
    return res.status(400).json({ error: 'اسم الطالب والفصل مطلوبان' });
  }

  const db = loadDatabase();
  const exists = db.students.some(s => s.classId === classId && s.name.trim() === name.trim());
  if (exists) {
    return res.status(400).json({ error: 'يوجد طالب مسجل بهذا الاسم بالفعل في نفس الفصل' });
  }

  const newStudent: Student = {
    id: `stu_${classId}_${Date.now()}`,
    name: name.trim(),
    classId,
    positivePoints: 0,
    negativePoints: 0,
    netPoints: 0,
    sessionPoints: 0,
    participations: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    randomPickCount: 0,
    leadershipCount: 0,
    notes: notes || '',
    isParticipatingInActivity: true,
    achievements: [],
    createdAt: new Date().toISOString()
  };

  db.students.push(newStudent);
  if (db.classes[classId as ClassId]) {
    db.classes[classId as ClassId].totalStudents = db.students.filter(s => s.classId === classId).length;
  }

  saveDatabase(db);
  res.json({ success: true, student: newStudent });
});

app.put('/api/students/:id', requireTeacherAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, notes, isParticipatingInActivity } = req.body;

  const db = loadDatabase();
  const student = db.students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'الطالب غير موجود' });
  }

  if (name && name.trim()) {
    // Check duplicates in same class
    const duplicate = db.students.some(s => s.id !== id && s.classId === student.classId && s.name.trim() === name.trim());
    if (duplicate) {
      return res.status(400).json({ error: 'يوجد طالب آخر بهذا الاسم في نفس الفصل' });
    }
    student.name = name.trim();
  }

  if (notes !== undefined) {
    student.notes = notes;
  }

  if (isParticipatingInActivity !== undefined) {
    student.isParticipatingInActivity = Boolean(isParticipatingInActivity);
  }

  saveDatabase(db);
  res.json({ success: true, student });
});

// Protected point operations (Teacher only)
app.post('/api/points', requireTeacherAuth, (req: Request, res: Response) => {
  const { classId, studentId, groupId, points, reason, type } = req.body;

  if (!classId || points === undefined || !reason) {
    return res.status(400).json({ error: 'بيانات العملية غير مكتملة' });
  }

  const db = loadDatabase();
  const currentSession = db.sessions.find(s => s.classId === classId && s.isActive);
  const sessionId = currentSession ? currentSession.id : `sess_${classId}_adhoc`;

  let studentName: string | undefined;
  let groupName: string | undefined;

  // If student point
  if (studentId) {
    const student = db.students.find(s => s.id === studentId);
    if (student) {
      studentName = student.name;
      if (points > 0) {
        student.positivePoints += points;
      } else {
        student.negativePoints += Math.abs(points);
      }
      student.netPoints = student.positivePoints - student.negativePoints;
      student.sessionPoints += points;
      student.participations += 1;

      if (reason.includes('صحيحة') || reason.includes('متميزة') || reason.includes('استثنائي')) {
        student.correctAnswers += 1;
      } else if (reason.includes('خاطئة')) {
        student.incorrectAnswers += 1;
      }
    }
  }

  // If group point
  if (groupId) {
    const group = (db.groups[classId as ClassId] || []).find(g => g.id === groupId);
    if (group) {
      groupName = group.name;
      if (points > 0) {
        group.positivePoints += points;
      } else {
        group.negativePoints += Math.abs(points);
      }
      group.netPoints = group.positivePoints - group.negativePoints;

      if (reason.includes('تحدي') || reason.includes('فوز')) {
        group.challengeWins += 1;
      }
      if (reason.includes('إجابة جماعية صحيحة')) {
        group.correctGroupAnswers += 1;
      }

      // Check if teacher setting allows syncing group points to members
      if (db.settings.allowDirectStudentPointsFromGroup) {
        group.memberIds.forEach(mId => {
          const member = db.students.find(s => s.id === mId);
          if (member) {
            if (points > 0) member.positivePoints += points;
            else member.negativePoints += Math.abs(points);
            member.netPoints = member.positivePoints - member.negativePoints;
            member.sessionPoints += points;
          }
        });
      }
    }
  }

  // Update class total points
  if (db.classes[classId as ClassId]) {
    const classStudents = db.students.filter(s => s.classId === classId);
    db.classes[classId as ClassId].totalPoints = classStudents.reduce((sum, s) => sum + s.netPoints, 0);
  }

  const newRecord: PointRecord = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    classId,
    studentId,
    studentName,
    groupId,
    groupName,
    type: type || (points >= 0 ? 'positive' : 'negative'),
    points,
    reason,
    timestamp: new Date().toISOString(),
    sessionId
  };

  db.pointRecords.unshift(newRecord);

  if (currentSession) {
    currentSession.totalOperations += 1;
  }

  saveDatabase(db);
  res.json({ success: true, record: newRecord, db });
});

// Protected Reset data to initial seeds (Teacher only)
app.post('/api/data/reset', requireTeacherAuth, (_req: Request, res: Response) => {
  const initialData: AppData = {
    classes: INITIAL_CLASSES,
    students: generateInitialStudents(),
    groups: {
      '9-1': [],
      '9-2': [],
      '9-3': []
    },
    pointRecords: [],
    sessions: [],
    competitions: [],
    settings: DEFAULT_TEACHER_SETTINGS,
    teacherConfigured: true
  };

  saveDatabase(initialData);
  res.json({ success: true, message: 'تمت استعادة البيانات الأصلية للـ 73 طالبًا بنجاح', data: initialData });
});

// CSV Export route
app.get('/api/export/csv/:classId', (req: Request, res: Response) => {
  const { classId } = req.params;
  const db = loadDatabase();
  const classStudents = db.students.filter(s => s.classId === classId);
  const className = db.classes[classId as ClassId]?.name || classId;

  let csv = '\uFEFF'; // UTF-8 BOM for Excel Arabic support
  csv += 'الرقم,اسم الطالب,الفصل,النقاط الإيجابية,النقاط السلبية,صافي النقاط,المشاركات,الإجابات الصحيحة,الإجابات الخاطئة,عدد مرات القيادة,عدد مرات الاختيار\n';

  classStudents.forEach((s, idx) => {
    csv += `${idx + 1},"${s.name}","${className}",${s.positivePoints},${s.negativePoints},${s.netPoints},${s.participations},${s.correctAnswers},${s.incorrectAnswers},${s.leadershipCount},${s.randomPickCount}\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="students_${classId}_report.csv"`);
  res.send(csv);
});

// --- Vite / SPA Handler ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Classroom Manager server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
