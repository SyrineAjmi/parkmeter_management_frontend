import { useState, useRef } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { generateAiReport } from "../../api/ai.api";
import styles from "./AiReportPage.module.css";

const MONTHS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

function parseReportSections(content) {
    if (!content) return [];
    const lines = content.split('\n').filter(l => l.trim());
    const sections = [];
    let current = null;

    for (const line of lines) {
        const clean = line.replace(/\*\*/g, '').replace(/###/g, '').replace(/##/g, '').replace(/---/g, '').replace(/\*/g, '').trim();
        if (!clean) continue;

        const isSectionTitle = /^\d\./.test(clean);
        if (isSectionTitle) {
            if (current) sections.push(current);
            current = { title: clean, lines: [] };
        } else {
            if (!current) current = { title: null, lines: [] };
            current.lines.push(clean);
        }
    }
    if (current) sections.push(current);
    return sections;
}

function exportToPDF(report, monthLabel, year) {
    const win = window.open('', '_blank');
    const sections = parseReportSections(report.content);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Rapport Financier – ${monthLabel} ${year}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'IBM Plex Sans', sans-serif; color: #0f172a; background: #fff; font-size: 13px; line-height: 1.7; }

  .cover { background: #0e64c8; color: #fff; padding: 48px 56px 40px; }
  .cover-label { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; opacity: 0.7; margin-bottom: 16px; }
  .cover-title { font-size: 28px; font-weight: 700; line-height: 1.2; margin-bottom: 8px; }
  .cover-period { font-size: 16px; font-weight: 300; opacity: 0.85; margin-bottom: 32px; }
  .cover-stats { display: flex; gap: 40px; }
  .stat { border-left: 2px solid rgba(255,255,255,0.3); padding-left: 16px; }
  .stat-value { font-size: 22px; font-weight: 700; font-family: 'IBM Plex Mono', monospace; }
  .stat-label { font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

  .meta { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 56px; display: flex; align-items: center; justify-content: space-between; }
  .meta-text { font-size: 11px; color: #64748b; }
  .meta-badge { background: #0e64c8; color: #fff; font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; }

  .body { padding: 40px 56px; }
  .section { margin-bottom: 32px; page-break-inside: avoid; }
  .section-title { font-size: 13px; font-weight: 700; color: #0e64c8; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #0e64c8; padding-bottom: 6px; margin-bottom: 14px; }
  .section p { color: #334155; margin-bottom: 8px; font-size: 13px; }

  .footer { border-top: 1px solid #e2e8f0; padding: 16px 56px; display: flex; justify-content: space-between; align-items: center; }
  .footer-text { font-size: 10px; color: #94a3b8; }

  @media print {
    .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .meta { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="cover">
  <div class="cover-label">Parkmeter Management System</div>
  <div class="cover-title">Rapport Financier<br/>Analytique</div>
  <div class="cover-period">${monthLabel} ${year}</div>
  <div class="cover-stats">
    <div class="stat">
      <div class="stat-value">${report.totalRevenue?.toFixed(3)} DT</div>
      <div class="stat-label">Revenu total</div>
    </div>
    <div class="stat">
      <div class="stat-value">${report.totalTransactions}</div>
      <div class="stat-label">Transactions</div>
    </div>
  </div>
</div>

<div class="meta">
  <span class="meta-text">Généré le ${new Date(report.generatedAt).toLocaleString('fr-FR')}</span>
  <span class="meta-badge">Généré par IA · Gemini</span>
</div>

<div class="body">
  ${sections.map(s => `
    <div class="section">
      ${s.title ? `<div class="section-title">${s.title}</div>` : ''}
      ${s.lines.map(l => `<p>${l}</p>`).join('')}
    </div>
  `).join('')}
</div>

<div class="footer">
  <span class="footer-text">Parkmeter Management System – Rapport confidentiel</span>
  <span class="footer-text">Période : ${report.period}</span>
</div>

<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
}

export default function AiReportPage() {
    const currentDate = new Date();
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setReport(null);
        try {
            const result = await generateAiReport(month, year);
            setReport(result);
        } catch (e) {
            setError("Erreur lors de la génération du rapport. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };
    const sections = parseReportSections(report?.content);

    return (
        <AppLayout>
            <div className={styles.page}>

                {/* Header */}
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Rapport Financier IA</h1>
                        <p className={styles.pageSubtitle}>Analyse automatique via Google Gemini</p>
                    </div>
                    {report && (
                        <button
                            className={styles.exportBtn}
                            onClick={() => exportToPDF(report, MONTHS[month - 1], year)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Exporter en PDF
                        </button>
                    )}
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        <label className={styles.controlLabel}>Mois</label>
                        <select className={styles.select} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                            {MONTHS.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.controlGroup}>
                        <label className={styles.controlLabel}>Année</label>
                        <select className={styles.select} value={year} onChange={e => setYear(parseInt(e.target.value))}>
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
                        {loading ? (
                            <>
                                <span className={styles.btnSpinner} />
                                Génération en cours...
                            </>
                        ) : (
                            <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                                Générer le rapport
                            </>
                        )}
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingPulse} />
                        <div className={styles.loadingText}>
                            <p>Analyse des données financières en cours</p>
                            <p className={styles.loadingSub}>L'IA traite vos transactions et génère les insights...</p>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className={styles.errorBox}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Report */}
                {report && (
                    <div className={styles.report}>

                        {/* KPI strip */}
                        <div className={styles.kpiStrip}>
                            <div className={styles.kpi}>
                                <span className={styles.kpiValue}>{report.totalRevenue?.toFixed(3)} DT</span>
                                <span className={styles.kpiLabel}>Revenu total</span>
                            </div>
                            <div className={styles.kpiDivider} />
                            <div className={styles.kpi}>
                                <span className={styles.kpiValue}>{report.totalTransactions}</span>
                                <span className={styles.kpiLabel}>Transactions</span>
                            </div>
                            <div className={styles.kpiDivider} />
                            <div className={styles.kpi}>
                                <span className={styles.kpiValue}>{report.period}</span>
                                <span className={styles.kpiLabel}>Période analysée</span>
                            </div>
                            <div className={styles.kpiBadge}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                                Gemini AI
                            </div>
                        </div>

                        {/* Report body */}
                        <div className={styles.reportBody}>
                            <div className={styles.reportMeta}>
                                <span className={styles.reportMetaText}>
                                    Généré le {new Date(report.generatedAt).toLocaleString('fr-FR')}
                                </span>
                            </div>
                            {report.totalTransactions === 0 ? (
                                <div className={styles.noData}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <p>Aucune donnée disponible pour {MONTHS[month - 1]} {year}.</p>
                                    <p className={styles.noDataSub}>Veuillez sélectionner une période contenant des transactions.</p>
                                </div>
                            ) : (
                                <div className={styles.sections}>
                                    {sections.map((section, i) => (
                                        <div key={i} className={styles.section}>
                                            {section.title && (
                                                <h3 className={styles.sectionTitle}>{section.title}</h3>
                                            )}
                                            {section.lines.map((line, j) => (
                                                <p key={j} className={styles.sectionLine}>{line}</p>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}