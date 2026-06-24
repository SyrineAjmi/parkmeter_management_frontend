import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { METER_STATUS_COLORS, METER_STATUS_LABELS } from "../../constants/meterStatus";
import styles from "./DashboardMap.module.css";

//leaflet dflt marker icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: icon, shadowUrl: iconShadow });

// custom colored marker
function createSiteIcon(color) {
    return L.divIcon({
        className: "",
        html: `
      <div style="
        width: 22px; height: 22px;
        background: ${color};
        border: 2px solid #ffffffed;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      "></div>
    `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
    });
}

function getSiteColor(parkmeters) {
    if (!parkmeters?.length) return "#94a3b8";
    if (parkmeters.some((p) => p.status === "OUT_OF_SERVICE")) return "#ef4444";
    if (parkmeters.some((p) => p.status === "TEMPORARILY_UNAVAILABLE")) return "#f59e0b";
    if (parkmeters.every((p) => p.status === "IN_SERVICE")) return "#22c55e";
    return "#0e64c8";
}

function ParkmeterMiniCard({ parkmeter }) {
    const statusColor = METER_STATUS_COLORS[parkmeter.status] || "#94a3b8";
    const cash = parkmeter.cashAmount ?? 0;
    const cashColor = cash >= 40 ? "#ef4444" : cash >= 20 ? "#f59e0b" : "#16a34a";

    return (
        <div className={styles.miniCard} style={{ borderLeftColor: statusColor }}>
            <div className={styles.miniCardTop}>
                <span className={styles.miniSerial}>{parkmeter.serialNumber}</span>
                <span
                    className={styles.miniStatus}
                    style={{ background: statusColor + "20", color: statusColor }}
                >
                    {METER_STATUS_LABELS[parkmeter.status] || parkmeter.status}
                </span>
            </div>
            <div className={styles.miniCash}>
                <span className={styles.miniCashLabel}>Caisse</span>
                <span className={styles.miniCashValue} style={{ color: cashColor }}>
                    {cash.toFixed(3)} DT
                </span>
            </div>
        </div>
    );
}

export default function DashboardMap({ sites, parkmeters }) {
    const [map, setMap] = useState(null);

    // pm by siteId
    const parkmetersBySite = parkmeters.reduce((acc, pm) => {
        if (!acc[pm.siteId]) acc[pm.siteId] = [];
        acc[pm.siteId].push(pm);
        return acc;
    }, {});

    const sitesWithCoords = sites.filter((s) => s.latitude && s.longitude);

    // centre tunisie
    const center = sitesWithCoords.length > 0
        ? [sitesWithCoords[0].latitude, sitesWithCoords[0].longitude]
        : [36.8400, 10.2000];

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <span className={styles.title}>Vue géographique</span>
                <div className={styles.legend}>
                    <span className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: "#22c55e" }} />
                        Tous en service
                    </span>
                    <span className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: "#f59e0b" }} />
                        Indisponible
                    </span>
                    <span className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: "#ef4444" }} />
                        Hors service
                    </span>
                </div>
            </div>

            {sitesWithCoords.length === 0 ? (
                <div className={styles.empty}>
                    Aucun site avec coordonnées GPS configurées
                </div>
            ) : (
                <MapContainer
                    center={center}
                    zoom={12}
                    className={styles.map}
                    ref={setMap}
                    zoomControl={true}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                    />

                    {sitesWithCoords.map((site) => {
                        const siteParkmeters = parkmetersBySite[site.id] || [];
                        const color = getSiteColor(siteParkmeters);

                        return (
                            <Marker
                                key={site.id}
                                position={[site.latitude, site.longitude]}
                                icon={createSiteIcon(color)}
                            >
                                <Popup minWidth={240} maxWidth={320}>
                                    <div className={styles.popup}>
                                        <div className={styles.popupHeader}>
                                            <span className={styles.popupSiteName}>{site.name}</span>
                                            <span className={styles.popupAddress}>{site.address}</span>
                                        </div>

                                        <div className={styles.popupStats}>
                                            <div className={styles.popupStat}>
                                                <span className={styles.popupStatValue}>
                                                    {siteParkmeters.length}
                                                </span>
                                                <span className={styles.popupStatLabel}>Parcmètres</span>
                                            </div>
                                            <div className={styles.popupStat}>
                                                <span className={styles.popupStatValue} style={{ color: "#22c55e" }}>
                                                    {siteParkmeters.filter((p) => p.status === "IN_SERVICE").length}
                                                </span>
                                                <span className={styles.popupStatLabel}>En service</span>
                                            </div>
                                            <div className={styles.popupStat}>
                                                <span className={styles.popupStatValue} style={{ color: "#ef4444" }}>
                                                    {siteParkmeters.filter((p) =>
                                                        p.status === "OUT_OF_SERVICE" ||
                                                        p.status === "TEMPORARILY_UNAVAILABLE"
                                                    ).length}                        </span>
                                                <span className={styles.popupStatLabel}>Indisponibles</span>
                                            </div>
                                        </div>

                                        {siteParkmeters.length > 0 && (
                                            <div className={styles.popupParkmeters}>
                                                {siteParkmeters.map((pm) => (
                                                    <ParkmeterMiniCard key={pm.id} parkmeter={pm} />
                                                ))}
                                            </div>
                                        )}

                                        {siteParkmeters.length === 0 && (
                                            <p className={styles.popupEmpty}>
                                                Aucun parcmètre sur ce site
                                            </p>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            )}
        </div>
    );
}