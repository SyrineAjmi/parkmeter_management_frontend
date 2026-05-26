import { useState, useEffect, useCallback } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { fetchAllSites } from "../../api/dashboard.api";
import styles from "./SitesPage.module.css";
import CreateSiteModal from "./CreateSiteModal";
import EditSiteModal from "./EditSiteModal";
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal";

//const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${process.env.VITE_API_URL}/api`;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function deleteSite(id) {
  const res = await fetch(`${BASE_URL}/Sites/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur suppression site");
}

export default function SitesPage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [deletingSite, setDeletingSite] = useState(null);


  useEffect(() => {
    fetchAllSites()
      .then(setSites)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);


  const load = useCallback(() => {
    setError(null);
    fetchAllSites()
      .then(setSites)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);


  useEffect(() => {
    load();
  }, [load]);
  const filtered = sites.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Sites</h1>
            <p className={styles.subtitle}>
              {sites.length} site{sites.length !== 1 ? "s" : ""} enregistré{sites.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            + Ajouter Site
          </button>
        </div>

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            type="text"
            placeholder="Rechercher par nom ou adresse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <div className={styles.state}>Chargement...</div>}
        {error && <div className={styles.stateError}>{error}</div>}
        {showModal && (
          <CreateSiteModal
            onClose={() => setShowModal(false)}
            onCreated={load}
          />
        )}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className={styles.state}>Aucun site trouvé.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Adresse</th>
                      <th>Description</th>
                      <th>Créé le</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((site) => (
                      <tr key={site.id}>
                        <td className={styles.nameCell}>{site.name}</td>
                        <td className={styles.muted}>{site.address || "—"}</td>
                        <td className={styles.muted}>
                          {site.description || "—"}
                        </td>
                        <td className={styles.muted}>{formatDate(site.createdAt)}</td>
                        <td>                                    {/* ← add this td */}
                          <div className={styles.rowActions}>
                            <button className={styles.editBtn} onClick={() => setEditingSite(site)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button className={styles.deleteBtn} onClick={() => setDeletingSite(site)}>
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

        {editingSite && (
          <EditSiteModal
            site={editingSite}
            onClose={() => setEditingSite(null)}
            onUpdated={load}
          />
        )}

        {deletingSite && (
          <ConfirmDeleteModal
            title="Supprimer le site"
            message={`Êtes-vous sûr de vouloir supprimer "${deletingSite.name}" ? Cette action est irréversible.`}
            onClose={() => setDeletingSite(null)}
            onConfirm={async () => {
              await deleteSite(deletingSite.id);
              load();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}