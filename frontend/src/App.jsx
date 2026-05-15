import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './App.css';

/* const API = 'http://localhost:5000/students'; */
const API = 'http://localhost:5000/students';

const EMPTY_FORM = {
  name: '', rollNumber: '', email: '', phone: '',
  course: '', year: '', gender: '', age: '',
};

// ── Toast ────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`}>
      <span>{toast.message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

// ── Edit Modal ───────────────────────────────────────────────
function EditModal({ student, onClose, onSave }) {
  const [form, setForm] = useState({
    name: student.name,
    rollNumber: student.rollNumber,
    email: student.email,
    phone: student.phone,
    course: student.course,
    year: student.year,
    gender: student.gender,
    age: student.age,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.put(`${API}/${student._id}`, form);
      onSave(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>✏️ Edit Student</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Riya Sharma" required />
            </div>
            <div className="form-group">
              <label>Roll Number</label>
              <input name="rollNumber" value={form.rollNumber} onChange={handleChange} placeholder="e.g. CS2024001" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="e.g. riya@example.com" required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit number" maxLength={10} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Course</label>
              <input name="course" value={form.course} onChange={handleChange} placeholder="e.g. B.Tech CSE" required />
            </div>
            <div className="form-group">
              <label>Year</label>
              <select name="year" value={form.year} onChange={handleChange} required>
                <option value="">Select Year</option>
                {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Age</label>
              <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="e.g. 20" min={15} max={60} required />
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────
function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formError, setFormError] = useState('');

  const showToast = (message, type = 'success') => setToast({ message, type });
  const closeToast = useCallback(() => setToast(null), []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get(API);
      setStudents(res.data);
    } catch {
      showToast('Failed to load students. Is the backend running?', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const { name, rollNumber, email, phone, course, year, gender, age } = form;
    if (!name || !rollNumber || !email || !phone || !course || !year || !gender || !age) {
      setFormError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(API, form);
      setForm(EMPTY_FORM);
      showToast('Student added successfully!');
      fetchStudents();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Backend is not reachable or MongoDB authentication failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = (updated) => {
    setStudents((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    setEditTarget(null);
    showToast('Student updated successfully!');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student record? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/${id}`);
      setStudents((prev) => prev.filter((s) => s._id !== id));
      showToast('Student deleted.');
    } catch {
      showToast('Failed to delete student.', 'error');
    }
  };

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.course.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="app">
      <Toast toast={toast} onClose={closeToast} />
      {editTarget && (
        <EditModal
          student={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-icon">🎓</div>
        <h1>Student Record System</h1>
        <p>Manage student records with full CRUD operations</p>
        <div className="header-stat">{students.length} students enrolled</div>
      </header>

      <main className="container">
        {/* Add Form */}
        <section className="card">
          <h2>➕ Add New Student</h2>
          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input id="name" name="name" type="text" placeholder="e.g. Riya Sharma" value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="rollNumber">Roll Number</label>
                <input id="rollNumber" name="rollNumber" type="text" placeholder="e.g. CS2024001" value={form.rollNumber} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="e.g. riya@example.com" value={form.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="text" placeholder="10-digit number" value={form.phone} onChange={handleChange} maxLength={10} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="course">Course</label>
                <input id="course" name="course" type="text" placeholder="e.g. B.Tech CSE" value={form.course} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="year">Year</label>
                <select id="year" name="year" value={form.year} onChange={handleChange}>
                  <option value="">Select Year</option>
                  {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input id="age" name="age" type="number" placeholder="e.g. 20" value={form.age} onChange={handleChange} min={15} max={60} />
              </div>
            </div>
            {formError && <p className="form-error">{formError}</p>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : '+ Add Student'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setForm(EMPTY_FORM); setFormError(''); }}>
                Clear
              </button>
            </div>
          </form>
        </section>

        {/* Students Table */}
        <section className="card">
          <div className="list-header">
            <div>
              <h2>📋 All Students</h2>
              <p className="list-sub">{filtered.length} of {students.length} records</p>
            </div>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search name, roll, course, email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner"></div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p>{searchQuery ? 'No results found.' : 'No students yet. Add one above!'}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Roll No.</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Course</th>
                    <th>Year</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Added On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, idx) => (
                    <tr key={s._id}>
                      <td className="td-index">{idx + 1}</td>
                      <td className="td-name">
                        <div className="avatar">{s.name.charAt(0).toUpperCase()}</div>
                        {s.name}
                      </td>
                      <td><span className="roll-badge">{s.rollNumber}</span></td>
                      <td>{s.email}</td>
                      <td>{s.phone}</td>
                      <td>{s.course}</td>
                      <td>Year {s.year}</td>
                      <td>{s.gender}</td>
                      <td>{s.age}</td>
                      <td>{formatDate(s.createdAt)}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-edit" onClick={() => setEditTarget(s)}>✏️ Edit</button>
                          <button className="btn btn-delete" onClick={() => handleDelete(s._id)}>🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>Student Record System &bull; Built with MERN Stack</p>
      </footer>
    </div>
  );
}

export default App;
