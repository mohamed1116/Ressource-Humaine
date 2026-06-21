import { useState, useMemo, useEffect, useRef } from "react";
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from "../../api/users.api";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  status: string;
  phone: string;
  created_at: string;
  last_login: string;
}

interface ToastState {
  message: string;
  type: string;
}

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin", color: "#1e1b4b", bg: "#ede9fe" },
  { value: "ADMIN_HR", label: "Admin / HR", color: "#1e3a5f", bg: "#dbeafe" },
  { value: "DEPARTMENT_HEAD", label: "Department Head", color: "#14532d", bg: "#dcfce7" },
  { value: "PROFESSOR", label: "Professor", color: "#713f12", bg: "#fef9c3" },
  { value: "STAFF", label: "Staff", color: "#4a1942", bg: "#fae8ff" },
  { value: "STUDENT", label: "Student", color: "#374151", bg: "#f3f4f6" },
];

const PAGE_SIZE = 15;

function getRoleInfo(value: string) {
  return ROLES.find(r => r.value === value) || ROLES[5];
}

function getInitials(first: string, last: string) {
  return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
}

function RoleBadge({ role }: { role: string }) {
  const info = getRoleInfo(role);
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500,
      background: info.bg, color: info.color, letterSpacing: "0.01em", whiteSpace: "nowrap"
    }}>{info.label}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4,
      fontSize: 11, fontWeight: 500,
      background: active ? "#dcfce7" : "#f3f4f6",
      color: active ? "#14532d" : "#6b7280"
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "#16a34a" : "#9ca3af", display: "inline-block" }} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Avatar({ first, last, size = 36 }: { first: string; last: string; size?: number }) {
  const initials = getInitials(first, last);
  const colors = ["#0f172a", "#1e3a5f", "#14532d", "#713f12", "#4a1942", "#374151"];
  const idx = (first.charCodeAt(0) + last.charCodeAt(0)) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: colors[idx],
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.35, fontWeight: 500, flexShrink: 0,
      fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.01em"
    }}>{initials}</div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 12, width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
      }}>{children}</div>
    </div>
  );
}

function SidePanel({ user, onClose, onSave, onDelete, onResetPassword, currentUserId }: { user: User; onClose: () => void; onSave: (form: any) => void; onDelete: (user: User) => void; onResetPassword: (user: User) => void; currentUserId?: string }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({ ...user });
  const isSelf = user.id === currentUserId;

  const handle = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const save = () => { onSave(form); setEditing(false); };

  const labelStyle: React.CSSProperties = { fontSize: 11, color: "#9ca3af", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2, display: "block" };
  const valStyle: React.CSSProperties = { fontSize: 13, color: "#1f2937", fontWeight: 400 };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, outline: "none", fontFamily: "inherit", background: "#fafafa", boxSizing: "border-box" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar first={user.first_name} last={user.last_name} size={48} />
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 16, color: "#0f172a" }}>{user.first_name} {user.last_name}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>@{user.username}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, padding: 4 }}>✕</button>
      </div>

      <div style={{ padding: "20px 24px" }}>
        <p style={{ ...labelStyle, color: "#0f172a", fontSize: 12, marginBottom: 12 }}>Personal Information</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          {editing ? (<>
            <div><label style={labelStyle}>First Name</label><input style={inputStyle} value={form.first_name} onChange={handle("first_name")} /></div>
            <div><label style={labelStyle}>Last Name</label><input style={inputStyle} value={form.last_name} onChange={handle("last_name")} /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={labelStyle}>Email</label><input style={inputStyle} value={form.email} onChange={handle("email")} /></div>
            <div><label style={labelStyle}>Username</label><input style={inputStyle} value={form.username} onChange={handle("username")} /></div>
            <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={form.phone} onChange={handle("phone")} /></div>
          </>) : (<>
            <div><span style={labelStyle}>First Name</span><span style={valStyle}>{user.first_name}</span></div>
            <div><span style={labelStyle}>Last Name</span><span style={valStyle}>{user.last_name}</span></div>
            <div style={{ gridColumn: "1/-1" }}><span style={labelStyle}>Email</span><span style={valStyle}>{user.email}</span></div>
            <div><span style={labelStyle}>Username</span><span style={valStyle}>@{user.username}</span></div>
            <div><span style={labelStyle}>Phone</span><span style={valStyle}>{user.phone || "—"}</span></div>
          </>)}
        </div>

        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16, marginBottom: 20 }}>
          <p style={{ ...labelStyle, color: "#0f172a", fontSize: 12, marginBottom: 12 }}>Account Information</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {editing ? (<>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Role</label>
                <select style={{ ...inputStyle }} value={form.role} onChange={handle("role")}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" id="status-toggle" checked={form.status === "active"} onChange={e => setForm((f: any) => ({ ...f, status: e.target.checked ? "active" : "inactive" }))} style={{ width: 14, height: 14, cursor: "pointer" }} />
                <label htmlFor="status-toggle" style={{ fontSize: 13, color: "#374151", cursor: "pointer" }}>Account Active</label>
              </div>
            </>) : (<>
              <div><span style={labelStyle}>Role</span><RoleBadge role={user.role} /></div>
              <div><span style={labelStyle}>Status</span><StatusBadge status={user.status} /></div>
            </>)}
            <div><span style={labelStyle}>Created</span><span style={valStyle}>{user.created_at}</span></div>
            <div><span style={labelStyle}>Last Login</span><span style={valStyle}>{user.last_login}</span></div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {editing ? (<>
            <button onClick={save} style={{ padding: "7px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Save Changes</button>
            <button onClick={() => { setEditing(false); setForm({ ...user }); }} style={{ padding: "7px 16px", background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </>) : (<>
            <button onClick={() => setEditing(true)} style={{ padding: "7px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Edit User</button>
            <button onClick={() => onResetPassword(user)} style={{ padding: "7px 16px", background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Reset Password</button>
            {!isSelf && <button onClick={() => onDelete(user)} style={{ padding: "7px 16px", background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Delete User</button>}
          </>)}
        </div>
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, onSave, editUser }: { onClose: () => void; onSave: (form: any) => void; editUser?: any }) {
  const empty = { first_name: "", last_name: "", email: "", username: "", password: "", role: "STUDENT", phone: "", status: "active" };
  const [form, setForm] = useState<any>(editUser ? { ...editUser } : empty);
  const [errors, setErrors] = useState<any>({});

  const handle = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: any = {};
    if (!form.first_name?.trim()) e.first_name = "Required";
    if (!form.last_name?.trim()) e.last_name = "Required";
    if (!form.email?.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.username?.trim()) e.username = "Required";
    if (!editUser && !form.password?.trim()) e.password = "Required for new users";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => { if (validate()) onSave(form); };

  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280", fontWeight: 500, display: "block", marginBottom: 4 };
  const inputStyle = (err?: string): React.CSSProperties => ({ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${err ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 6, outline: "none", fontFamily: "inherit", background: "#fafafa", boxSizing: "border-box" });

  return (
    <Modal onClose={onClose}>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{editUser ? "Edit User" : "Create New User"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input style={inputStyle(errors.first_name)} value={form.first_name} onChange={handle("first_name")} placeholder="First name" />
              {errors.first_name && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#dc2626" }}>{errors.first_name}</p>}
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input style={inputStyle(errors.last_name)} value={form.last_name} onChange={handle("last_name")} placeholder="Last name" />
              {errors.last_name && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#dc2626" }}>{errors.last_name}</p>}
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Email *</label>
              <input style={inputStyle(errors.email)} value={form.email} onChange={handle("email")} placeholder="email@edu.ma" />
              {errors.email && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#dc2626" }}>{errors.email}</p>}
            </div>
            <div>
              <label style={labelStyle}>Username *</label>
              <input style={inputStyle(errors.username)} value={form.username} onChange={handle("username")} placeholder="username" />
              {errors.username && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#dc2626" }}>{errors.username}</p>}
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle()} value={form.phone} onChange={handle("phone")} placeholder="+212 6xx-xxx-xxx" />
            </div>
            {!editUser && <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Password *</label>
              <input type="password" style={inputStyle(errors.password)} value={form.password} onChange={handle("password")} placeholder="Minimum 8 characters" />
              {errors.password && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#dc2626" }}>{errors.password}</p>}
            </div>}
            <div>
              <label style={labelStyle}>Role</label>
              <select style={{ ...inputStyle(), cursor: "pointer" }} value={form.role} onChange={handle("role")}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
              <input type="checkbox" id="new-status" checked={form.status === "active"} onChange={e => setForm((f: any) => ({ ...f, status: e.target.checked ? "active" : "inactive" }))} style={{ width: 14, height: 14, cursor: "pointer" }} />
              <label htmlFor="new-status" style={{ fontSize: 13, color: "#374151", cursor: "pointer" }}>Active Account</label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "8px 18px", background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={submit} style={{ padding: "8px 18px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>{editUser ? "Save Changes" : "Create User"}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (userId: string, pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!pw || pw.length < 8) return setErr("Password must be at least 8 characters");
    if (pw !== confirm) return setErr("Passwords do not match");
    onSave(user.id, pw);
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Reset Password</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280" }}>Setting new password for <strong>{user.first_name} {user.last_name}</strong></p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>New Password</label>
            <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(""); }} placeholder="Min. 8 characters" style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, fontFamily: "inherit", background: "#fafafa", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Confirm Password</label>
            <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setErr(""); }} placeholder="Repeat password" style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, fontFamily: "inherit", background: "#fafafa", boxSizing: "border-box" }} />
          </div>
          {err && <p style={{ margin: 0, fontSize: 12, color: "#dc2626" }}>{err}</p>}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={submit} style={{ padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Reset Password</button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteConfirmModal({ user, onClose, onConfirm }: { user: User; onClose: () => void; onConfirm: (id: string) => void }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", padding: 24, textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 20 }}>⚠</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Delete User</h3>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{user.first_name} {user.last_name}</strong>? This action cannot be undone and will permanently remove their account and all associated data.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => onConfirm(user.id)} style={{ padding: "8px 20px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Delete Permanently</button>
        </div>
      </div>
    </Modal>
  );
}

function Toast({ message, type }: { message: string; type: string }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      padding: "12px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
      background: type === "success" ? "#0f172a" : "#dc2626", color: "#fff",
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)", fontFamily: "'DM Sans', sans-serif",
      animation: "fadeSlide 0.25s ease"
    }}>{message}</div>
  );
}

function ImportExcelModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file) return setError("Veuillez sélectionner un fichier Excel.");
    setLoading(true); setError(""); setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/auth/users/bulk-import/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data);
      if (res.data.created > 0) onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Erreur lors de l'importation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Importer depuis Excel</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280" }}>
            Le fichier Excel doit contenir les colonnes : <strong>first_name, last_name, email, username, password</strong><br />
            Colonnes optionnelles : <strong>role</strong> (STUDENT, PROFESSOR, STAFF, DEPARTMENT_HEAD, ADMIN_HR), <strong>phone</strong>
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: "2px dashed #e5e7eb", borderRadius: 8, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: file ? "#f0fdf4" : "#fafafa", marginBottom: 16 }}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); setError(""); }} />
            {file ? (
              <p style={{ margin: 0, fontSize: 13, color: "#16a34a", fontWeight: 500 }}>✓ {file.name}</p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Cliquez pour sélectionner un fichier .xlsx</p>
            )}
          </div>
          {error && <p style={{ margin: "0 0 12px", fontSize: 12, color: "#dc2626" }}>{error}</p>}
          {result && (
            <div style={{ background: result.errors?.length ? "#fef9c3" : "#f0fdf4", border: `1px solid ${result.errors?.length ? "#fde047" : "#bbf7d0"}`, borderRadius: 6, padding: "10px 14px", marginBottom: 12 }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{result.detail}</p>
              {result.errors?.map((e: any, i: number) => (
                <p key={i} style={{ margin: "2px 0", fontSize: 12, color: "#dc2626" }}>Ligne {e.row}: {e.email} — {e.error}</p>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "8px 16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Fermer</button>
            <button onClick={handleSubmit} disabled={loading || !file} style={{ padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: loading || !file ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 500, opacity: loading || !file ? 0.6 : 1 }}>
              {loading ? "Importation..." : "Importer"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // جلب جميع المستخدمين (مع pagination)
      let allUsers: any[] = [];
      let nextUrl = null;
      let page = 1;
      
      do {
        const response = await getUsers(page > 1 ? { page: page.toString() } : undefined);
        const data = response.data;
        
        // التعامل مع pagination response
        if (data.results) {
          allUsers = [...allUsers, ...data.results];
          nextUrl = data.next;
          page++;
        } else if (Array.isArray(data)) {
          // إذا كانت البيانات قائمة مباشرة
          allUsers = data;
          nextUrl = null;
        } else {
          nextUrl = null;
        }
      } while (nextUrl);
      
      const usersData = allUsers.map((u: any) => ({
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        username: u.username,
        role: u.role,
        status: u.is_active ? "active" : "inactive",
        phone: u.phone || "—",
        created_at: u.created_at?.split("T")[0] || "—",
        last_login: u.updated_at?.split("T")[0] || "—"
      }));
      
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || `${u.first_name} ${u.last_name} ${u.email} ${u.username}`.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSaveUser = async (form: any) => {
    try {
      if (form.id) {
        const updateData = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          username: form.username,
          phone: form.phone,
          role: form.role,
          is_active: form.status === "active"
        };
        await updateUser(form.id, updateData);
        setSelectedUser(null);
        showToast("User updated successfully");
        fetchUsers();
      } else {
        const createData = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          username: form.username,
          password: form.password,
          phone: form.phone,
          role: form.role,
          is_active: form.status === "active"
        };
        await createUser(createData);
        setShowCreate(false);
        showToast("User created successfully");
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to save user:", error);
      showToast("Failed to save user", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      setDeleteTarget(null);
      setSelectedUser(null);
      showToast("User deleted");
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      showToast("Failed to delete user", "error");
    }
  };

  const handleResetPassword = async (userId: string, pw: string) => {
    try {
      await resetUserPassword(userId, pw);
      setResetTarget(null);
      showToast("Password reset successfully");
    } catch (error) {
      console.error("Failed to reset password:", error);
      showToast("Failed to reset password", "error");
    }
  };

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    inactive: users.filter(u => u.status === "inactive").length,
  }), [users]);

  const thStyle: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" };
  const tdStyle: React.CSSProperties = { padding: "11px 12px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f9fafb", verticalAlign: "middle" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap'); @keyframes fadeSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#0f172a" }}>User Management</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>Super Admin · Manage system accounts and permissions</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowImport(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#fff", color: "#0f172a", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
            📅 Importer Excel
          </button>
          <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Users", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Inactive", value: stats.inactive },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 8, padding: "14px 18px" }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: "#9ca3af", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#0f172a" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 8, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13 }}>⌕</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, email, or username…" style={{ width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "#fafafa" }} />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ padding: "7px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, fontFamily: "inherit", background: "#fafafa", color: "#374151", cursor: "pointer" }}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: "7px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, fontFamily: "inherit", background: "#fafafa", color: "#374151", cursor: "pointer" }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(search || roleFilter !== "all" || statusFilter !== "all") && (
          <button onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); setPage(1); }} style={{ padding: "7px 12px", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontFamily: "inherit", color: "#6b7280" }}>Clear</button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 8, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Loading users...</div>
        ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={thStyle}>Full Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No users found matching your filters.</td></tr>
              ) : paged.map((user: User) => (
                <tr key={user.id} style={{ transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar first={user.first_name} last={user.last_name} size={30} />
                      <span style={{ fontWeight: 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.first_name} {user.last_name}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#6b7280" }}>{user.email}</td>
                  <td style={{ ...tdStyle, color: "#6b7280" }}>@{user.username}</td>
                  <td style={tdStyle}><RoleBadge role={user.role} /></td>
                  <td style={tdStyle}><StatusBadge status={user.status} /></td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button onClick={() => setSelectedUser(user)} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 5, background: "#fff", cursor: "pointer", fontFamily: "inherit", color: "#374151" }}>View</button>
                      <button onClick={() => setResetTarget(user)} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 5, background: "#fff", cursor: "pointer", fontFamily: "inherit", color: "#374151" }}>Reset PW</button>
                      {user.id !== currentUser?.id && <button onClick={() => setDeleteTarget(user)} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid #fecaca", borderRadius: 5, background: "#fff", cursor: "pointer", fontFamily: "inherit", color: "#dc2626" }}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #f3f4f6" }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 10px", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 5, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#d1d5db" : "#374151", fontFamily: "inherit" }}>‹ Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1).map((n, idx, arr) => [
                idx > 0 && arr[idx - 1] !== n - 1 ? <span key={`gap-${n}`} style={{ padding: "5px 4px", fontSize: 12, color: "#9ca3af" }}>…</span> : null,
                <button key={n} onClick={() => setPage(n)} style={{ padding: "5px 10px", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 5, background: n === page ? "#0f172a" : "#fff", color: n === page ? "#fff" : "#374151", cursor: "pointer", fontFamily: "inherit", fontWeight: n === page ? 500 : 400 }}>{n}</button>
              ])}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "5px 10px", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 5, background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#d1d5db" : "#374151", fontFamily: "inherit" }}>Next ›</button>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel */}
      {selectedUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900 }} onClick={() => setSelectedUser(null)}>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 420, background: "#fff", boxShadow: "-4px 0 30px rgba(0,0,0,0.1)", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <SidePanel
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onSave={handleSaveUser}
              onDelete={setDeleteTarget}
              onResetPassword={setResetTarget}
              currentUserId={currentUser?.id}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onSave={handleSaveUser} editUser={undefined} />}
      {showImport && <ImportExcelModal onClose={() => setShowImport(false)} onSuccess={fetchUsers} />}
      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} onSave={handleResetPassword} />}
      {deleteTarget && <DeleteConfirmModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}