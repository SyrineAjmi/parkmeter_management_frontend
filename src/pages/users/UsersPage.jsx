import { useState, useEffect, useCallback } from "react";
import AppLayout from "../../components/layout/AppLayout";
import styles from "./UsersPage.module.css";
import CreateUserModal from "./CreateUserModal";
import Pagination from "../../components/ui/Pagination/Pagination";
import EditUserModal from "./EditUserModal";
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal";

//const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function fetchAllUsers() {
  const res = await fetch(`${BASE_URL}/Users`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Erreur chargement utilisateurs");
  return res.json();
}

async function deleteUser(id) {
  const res = await fetch(`${BASE_URL}/Users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur suppression utilisateur");
}


const ROLE_LABELS = {
  GESTIONNAIRE_SYSTEME: "Gestionnaire système",
  SUPERVISEUR: "Superviseur",
  RESPONSABLE_FINANCIER: "Responsable financier",
  AGENT_INSTALLATION: "Agent d'installation",
  OPERATEUR: "Opérateur",
};

const ROLE_COLORS = {
  GESTIONNAIRE_SYSTEME: { bg: "#eff6ff", text: "#1d4ed8" },
  SUPERVISEUR: { bg: "#fef3c7", text: "#92400e" },
  RESPONSABLE_FINANCIER: { bg: "#d1fae5", text: "#065f46" },
  AGENT_INSTALLATION: { bg: "#f3f4f6", text: "#374151" },
  OPERATEUR: { bg: "#fce7f3", text: "#9d174d" },
};

function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span
      className={styles.badge}
      style={{ background: color.bg, color: color.text }}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function StatusBadge({ isActive }) {
  return (
    <span
      className={styles.badge}
      style={{
        background: isActive ? "#dcfce7" : "#fee2e2",
        color: isActive ? "#166534" : "#991b1b",
      }}
    >
      {isActive ? "Actif" : "Inactif"}
    </span>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;


  const load = useCallback(() => {
    setError(null);
    fetchAllUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);


  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => { setCurrentPage(1); }, [search, roleFilter]);


  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <AppLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Utilisateurs</h1>
            <p className={styles.subtitle}>
              {users.length} utilisateur{users.length !== 1 ? "s" : ""} —{" "}
              {activeCount} actif{activeCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            + Créer Utilisateur
          </button>
        </div>

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.select}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">Tous les rôles</option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {loading && <div className={styles.state}>Chargement...</div>}
        {error && <div className={styles.stateError}>{error}</div>}
        {showModal && (
          <CreateUserModal
            onClose={() => setShowModal(false)}
            onCreated={load}
          />
        )}
        {!loading && !error && (
          <>
            {paginated.length === 0 ? (
              <div className={styles.state}>Aucun utilisateur trouvé.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Statut</th>
                      <th>Créé le</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.avatar}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className={styles.userName}>{user.name}</span>
                          </div>
                        </td>
                        <td className={styles.muted}>{user.email}</td>
                        <td><RoleBadge role={user.role} /></td>
                        <td><StatusBadge isActive={user.isActive} /></td>
                        <td className={styles.muted}>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button className={styles.editBtn} onClick={() => setEditingUser(user)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button className={styles.deleteBtn} onClick={() => setDeletingUser(user)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        {editingUser && (
  <EditUserModal
    user={editingUser}
    onClose={() => setEditingUser(null)}
    onUpdated={load}
  />
)}

{deletingUser && (
  <ConfirmDeleteModal
    title="Supprimer l'utilisateur"
    message={`Êtes-vous sûr de vouloir supprimer "${deletingUser.name}" ? Cette action est irréversible.`}
    onClose={() => setDeletingUser(null)}
    onConfirm={async () => {
      await deleteUser(deletingUser.id);
      load();
    }}
  />
)}
      </div>
    </AppLayout>
  );
}