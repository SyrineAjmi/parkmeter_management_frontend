import { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import styles from "./SettingsPage.module.css";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

function authHeaders() {
    const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token || ""}`,
    };
}


const ROLE_LABELS = {
    GESTIONNAIRE_SYSTEME: "Gestionnaire système",
    SUPERVISEUR: "Superviseur",
    RESPONSABLE_FINANCIER: "Responsable financier",
    AGENT_INSTALLATION: "Agent d'installation",
    OPERATEUR: "Opérateur",
};

function Card({ icon, title, subtitle, children, fullWidth }) {
    return (
        <div className={`${styles.card} ${fullWidth ? styles.gridFull : ""}`}>
            <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>{icon}</div>
                <div className={styles.cardTitleGroup}>
                    <h2 className={styles.cardTitle}>{title}</h2>
                    {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
                </div>
            </div>
            <div className={styles.cardBody}>{children}</div>
        </div>
    );
}

function ChangePasswordForm() {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);

    const isValid = current && next.length >= 6 && next === confirm;

    async function handleSubmit(e) {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true); setError(null); setSuccess(false);
        try {
            const storedUser = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
            const res = await fetch(`${BASE_URL}/Users/${storedUser.userId}/change-password`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({ currentPassword: current, newPassword: next, confirmPassword: confirm }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || "Erreur changement mot de passe");
            }
            setSuccess(true);
            setCurrent(""); setNext(""); setConfirm("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const EyeOpen = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
    );
    const EyeOff = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );

    return (
        <form onSubmit={handleSubmit} className={styles.passwordForm}>
            {[
                { label: "Mot de passe actuel", val: current, set: setCurrent, show: showCurrent, setShow: setShowCurrent, ph: "••••••••" },
                { label: "Nouveau mot de passe", val: next, set: setNext, show: showNext, setShow: setShowNext, ph: "Minimum 6 caractères" },
            ].map(({ label, val, set, show, setShow, ph }) => (
                <div className={styles.field} key={label}>
                    <label className={styles.label}>{label}</label>
                    <div className={styles.inputWrapper}>
                        <input className={styles.input} type={show ? "text" : "password"} value={val}
                            onChange={e => set(e.target.value)} placeholder={ph} />
                        <button type="button" className={styles.eyeBtn} onClick={() => setShow(v => !v)}>
                            {show ? <EyeOff /> : <EyeOpen />}
                        </button>
                    </div>
                    {label.includes("Nouveau") && val.length > 0 && val.length < 6 && (
                        <span className={styles.hint}>{6 - val.length} caractère{6 - val.length > 1 ? "s" : ""} manquant{6 - val.length > 1 ? "s" : ""}</span>
                    )}
                </div>
            ))}

            <div className={styles.field}>
                <label className={styles.label}>Confirmer le nouveau mot de passe</label>
                <input className={`${styles.input} ${confirm && confirm !== next ? styles.inputError : ""}`}
                    type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
                {confirm && confirm !== next && <span className={styles.hintError}>Les mots de passe ne correspondent pas</span>}
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}
            {success && <div className={styles.successBanner}>Mot de passe modifié avec succès</div>}

            <button type="submit" className={styles.submitBtn} disabled={loading || !isValid}>
                {loading ? "Modification..." : "Changer le mot de passe"}
            </button>
        </form>
    );
}

function BackendStatus() {
    const [status, setStatus] = useState("checking");
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/health`)
            .then(res => res.ok ? setStatus("online") : setStatus("error"))
            .catch(() => setStatus("offline"));
    }, []);

    const config = {
        checking: { color: "#f59e0b", label: "Vérification..." },
        online: { color: "#16a34a", label: "En ligne" },
        offline: { color: "#ef4444", label: "Hors ligne" },
        error: { color: "#ef4444", label: "Erreur" },
    };
    const { color, label } = config[status];

    return (
        <div className={styles.statusRow}>
            <span className={styles.statusDot} style={{ background: color }} />
            <span style={{ color, fontWeight: 600, fontSize: "0.82rem" }}>{label}</span>
        </div>
    );
}

export default function SettingsPage() {
    const { user } = useAuth();
    const joinDate = new Date().getFullYear();

    return (
        <AppLayout>
            <div className={styles.page}>

                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Paramètres</h1>
                        <p className={styles.pageSubtitle}>Gérez votre compte et vos préférences</p>
                    </div>
                </div>

                {/* Profile Banner */}
                <div className={styles.profileBanner}>
                    <div className={styles.profileAvatar}>
                        {(user?.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.profileInfo}>
                        <span className={styles.profileName}>{user?.name}</span>
                        <span className={styles.profileEmail}>{user?.email || "—"}</span>
                        <span className={styles.profileRole}>{ROLE_LABELS[user?.role] || user?.role}</span>
                    </div>
                    <div className={styles.profileStats}>
                        <div className={styles.profileStat}>
                            <span className={styles.profileStatValue}>{joinDate}</span>
                            <span className={styles.profileStatLabel}>Année</span>
                        </div>
                        <div className={styles.profileStat}>
                            <span className={styles.profileStatValue}>v1.0</span>
                            <span className={styles.profileStatLabel}>Version</span>
                        </div>
                        <div className={styles.profileStat}>
                            <span className={styles.profileStatValue}>Actif</span>
                            <span className={styles.profileStatLabel}>Statut</span>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className={styles.grid}>

                    {/* Security */}
                    <Card
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        }
                        title="Sécurité"
                        subtitle="Modifiez votre mot de passe">
                        <ChangePasswordForm />
                    </Card>

                    {/* System info */}
                    <Card
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        }
                        title="À propos du système"
                        subtitle="Informations techniques">
                        <div className={styles.infoGrid}>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Système</span>
                                <span className={styles.infoValue}>Parkmeter Management</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Version</span>
                                <span className={styles.infoValue}>1.0.0</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>API Backend</span>
                                <BackendStatus />
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Utilisateur connecté</span>
                                <span className={styles.infoValue}>{user?.name}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Stack technique</span>
                                <div className={styles.techBadges}>
                                    {[".NET 8", "React", "SignalR", "MQTT"].map(t => (
                                        <span key={t} className={styles.techBadge}>{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>
        </AppLayout>
    );
}