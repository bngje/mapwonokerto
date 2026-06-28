import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
const logoNgawi = '/logo-ngawi.png';


function MapResizeHandler({ trigger }: { trigger: unknown }) {
    const map = useMap();

    useEffect(() => {
        const timer = window.setTimeout(() => map.invalidateSize(), 320);
        return () => window.clearTimeout(timer);
    }, [trigger, map]);

    return null;
}

function MapZoomControl() {
    const map = useMap();

    useEffect(() => {
        const control = L.control.zoom({ position: 'topright' });
        control.addTo(map);
        const container = control.getContainer();
        if (container) container.classList.add('ds-map-controls');
        return () => {
            control.remove();
        };
    }, [map]);

    return null;
}

type UmkmFeature = GeoJSON.Feature<GeoJSON.Point, { name: string; nomor?: string }>;

const DUSUN_COLORS: Record<string, { fill: string; stroke: string }> = {
    'Dusun Wonokerto': { fill: '#f9cb28', stroke: '#a1a1a1' },
    'Sendangrejo Kidul': { fill: '#7928ca', stroke: '#a1a1a1' },
    'Sumber Agung': { fill: '#29bc9b', stroke: '#a1a1a1' },
    'Wonorejo': { fill: '#ff0080', stroke: '#a1a1a1' },
    'Pudak': { fill: '#ff4d4d', stroke: '#a1a1a1' },
    'Sendangembes': { fill: '#50e3c2', stroke: '#a1a1a1' },
    'Sendangrejo Lor': { fill: '#007cf0', stroke: '#a1a1a1' },
};

function createUmkmIcon(isActive: boolean, initials: string) {
    return L.divIcon({
        className: '',
        html: `<div class="ds-marker${isActive ? ' ds-marker--active' : ''}">${initials.slice(0, 2)}</div>`,
        iconSize: isActive ? [34, 34] : [28, 28],
        iconAnchor: isActive ? [17, 17] : [14, 14],
        popupAnchor: [0, isActive ? -20 : -16],
    });
}

function FlyToUmkm({ feature }: { feature: UmkmFeature | null }) {
    const map = useMap();

    useEffect(() => {
        if (!feature) return;
        const [lng, lat] = feature.geometry.coordinates;
        map.flyTo([lat, lng], 15, { duration: 0.8 });
    }, [feature, map]);

    return null;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();
}

function buildPopupHtml(name: string, nomor?: string) {
    const waButton = nomor
        ? `<a class="ds-btn-primary-sm" href="https://wa.me/${nomor}?text=${encodeURIComponent(`Halo, saya tertarik dengan usaha ${name} di peta digital Wonokerto.`)}" target="_blank" rel="noreferrer">Hubungi via WhatsApp</a>`
        : `<span class="ds-caption" style="color:var(--color-mute);font-style:italic">Nomor kontak belum tersedia</span>`;

    return `
        <div class="ds-popup">
            <p class="ds-popup__eyebrow">UMKM</p>
            <p class="ds-popup__title">${name}</p>
            ${waButton}
        </div>
    `;
}

const satelitEsri = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles &copy; Esri' },
);

export default function DashboardPeta() {
    const [wilayahData, setWilayahData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [umkmData, setUmkmData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [selectedUmkm, setSelectedUmkm] = useState<UmkmFeature | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const posisiTengah: [number, number] = [-7.421669375163471, 111.33241853913857];

    useEffect(() => {
        fetch('/desawonokerto.geojson')
            .then((res) => res.json())
            .then((data) => setWilayahData(data));

        fetch('/umkm.geojson')
            .then((res) => res.json())
            .then((data) => setUmkmData(data));
    }, []);

    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    const gayaWilayahDusun = (feature?: GeoJSON.Feature) => {
        const nama = feature?.properties?.nama_dusun as string | undefined;
        const palette = (nama ? DUSUN_COLORS[nama] : undefined) ?? { fill: '#007cf0', stroke: '#a1a1a1' };
        return {
            fillColor: palette.fill,
            color: palette.stroke,
            weight: 1.5,
            fillOpacity: 0.32,
        };
    };

    const umkmList = (umkmData?.features ?? []) as UmkmFeature[];
    const selectedId = selectedUmkm?.id ?? selectedUmkm?.properties?.name;

    const selectUmkm = (feature: UmkmFeature) => {
        setSelectedUmkm(feature);
        if (window.matchMedia('(max-width: 959px)').matches) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="relative flex h-[100dvh] w-screen overflow-hidden bg-canvas-soft font-sans text-ink">
            {/* Mobile backdrop */}
            <button
                type="button"
                aria-label="Tutup menu"
                className={`fixed inset-0 z-30 bg-ink/40 transition-opacity min-[960px]:hidden ${sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-[min(100vw-2.5rem,20rem)] max-w-[85vw] flex-col border-r border-hairline bg-canvas transition-transform duration-300 ease-out min-[960px]:relative min-[960px]:z-20 min-[960px]:w-80 min-[960px]:max-w-none min-[960px]:shrink-0 min-[960px]:translate-x-0 ${sidebarOpen ? 'translate-x-0 ds-shadow-5' : '-translate-x-full'
                    }`}
            >
                <header className="border-b border-hairline px-md py-sm min-[960px]:px-lg min-[960px]:py-md">
                    <div className="flex items-center gap-sm min-[960px]:gap-md">
                        <img src={logoNgawi} alt="Logo Ngawi" className="h-9 w-9 shrink-0 object-contain min-[960px]:h-10 min-[960px]:w-10" />
                        <div className="min-w-0 flex-1 text-left">
                            <h1 className="ds-display-sm truncate text-[18px] leading-6 tracking-[-0.6px] min-[960px]:text-[20px] min-[960px]:leading-7">
                                Peta Desa Wonokerto
                            </h1>
                            <p className="ds-body-sm truncate text-body">UMKM &amp; BUMDes</p>
                        </div>
                        <button
                            type="button"
                            aria-label="Tutup daftar UMKM"
                            className="ds-icon-btn shrink-0 min-[960px]:!hidden"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Stats & charts */}
                {/* <section className="border-b border-hairline px-md py-md">
                    <p className="ds-caption-mono mb-sm text-mute">Ringkasan data</p>

                    <div className="mb-md grid grid-cols-2 gap-xs">
                        <div className="rounded-md bg-canvas-soft p-sm">
                            <p className="ds-caption text-mute">Total UMKM</p>
                            <p className="ds-display-sm mt-xxs text-[24px] leading-8 tracking-[-0.96px]">{stats.total}</p>
                        </div>
                        <div className="rounded-md bg-canvas-soft p-sm">
                            <p className="ds-caption text-mute">Kontak aktif</p>
                            <p className="ds-display-sm mt-xxs text-[24px] leading-8 tracking-[-0.96px] text-link">{stats.withContact}</p>
                        </div>
                    </div>

                    {pieData.length > 0 && (
                        <div className="mt-md">
                            <p className="ds-caption-mono mb-sm text-mute">UMKM per dusun</p>
                            <div className="h-44 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={36}
                                            outerRadius={64}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="var(--color-canvas)"
                                            strokeWidth={2}
                                        >
                                            {pieData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--color-canvas)',
                                                border: '1px solid var(--color-hairline)',
                                                borderRadius: 'var(--radius-md)',
                                                boxShadow: 'var(--shadow-elev-4)',
                                                fontFamily: 'var(--font-sans)',
                                                fontSize: 12,
                                                padding: '8px 12px',
                                            }}
                                            itemStyle={{ color: 'var(--color-ink)' }}
                                            labelStyle={{ color: 'var(--color-body)', marginBottom: 4 }}
                                            formatter={(value, _name, item) => [
                                                `${value} usaha`,
                                                item?.payload?.name ?? '',
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <ul className="mt-sm space-y-xxs">
                                {pieData.map((dusun) => (
                                    <li key={dusun.name} className="flex items-center justify-between gap-xs">
                                        <span className="flex min-w-0 items-center gap-xs">
                                            <span
                                                className="h-2 w-2 shrink-0 rounded-full"
                                                style={{ background: dusun.color }}
                                            />
                                            <span className="ds-caption truncate text-body">{dusun.name}</span>
                                        </span>
                                        <span className="ds-caption-mono shrink-0 text-ink">{dusun.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section> */}

                <div className="flex min-h-0 flex-1 flex-col px-sm py-sm min-[960px]:px-md min-[960px]:py-md">

                    <nav className="min-h-0 flex-1 space-y-xxs overflow-y-auto pr-xxs">
                        {umkmList.length === 0 ? (
                            <p className="ds-body-sm px-sm py-md text-mute">Memuat data UMKM...</p>
                        ) : (
                            umkmList.map((feature, index) => {
                                const { name, nomor } = feature.properties;
                                const itemId = feature.id ?? name;
                                const isActive = selectedId === itemId;

                                return (
                                    <button
                                        key={itemId ?? index}
                                        type="button"
                                        onClick={() => selectUmkm(feature)}
                                        className={`ds-nav-row${isActive ? ' ds-nav-row--active' : ''}`}
                                    >
                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-[11px] font-medium uppercase ${isActive ? 'bg-primary text-on-primary' : 'bg-canvas-soft-2 text-body'
                                                }`}
                                            style={{ fontFamily: 'var(--font-mono)' }}
                                        >
                                            {getInitials(name)}
                                        </div>
                                        <div className="min-w-0 flex-1 pl-xxs">
                                            <p className={`ds-body-sm-strong truncate ${isActive ? 'text-ink' : 'text-ink'}`}>{name}</p>
                                            <p className="ds-caption mt-xxs truncate text-mute">
                                                {nomor ? 'WhatsApp tersedia' : 'Kontak belum tersedia'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </nav>
                </div>

                <footer className="border-t border-hairline px-md py-sm min-[960px]:px-lg">
                    <p className="ds-caption text-center text-mute min-[960px]:text-left">
                        KKN Kelompok 26 Desa Wonokerto &copy; 2026
                    </p>
                </footer>
            </aside>

            {/* Map area */}
            <div className="relative min-h-0 min-w-0 flex-1">
                {!sidebarOpen && (
                    <button
                        type="button"
                        aria-label="Buka daftar UMKM"
                        aria-expanded={sidebarOpen}
                        className="ds-icon-btn absolute left-sm top-sm z-[1000] ds-shadow-3 min-[960px]:!hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}

                <div className="absolute inset-0 z-0">
                    <MapContainer center={posisiTengah} zoom={14} className="h-full w-full" zoomControl={false}>
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution={satelitEsri.options.attribution}
                        />

                        <MapZoomControl />

                        <MapResizeHandler trigger={sidebarOpen} />

                        <FlyToUmkm feature={selectedUmkm} />

                        {wilayahData && (
                            <GeoJSON
                                data={wilayahData}
                                style={gayaWilayahDusun}
                                onEachFeature={(feature, layer) => {
                                    const nama = feature.properties?.nama_dusun;
                                    if (nama) {
                                        layer.bindPopup(
                                            `<div class="ds-popup"><p class="ds-popup__eyebrow">Dusun</p><p class="ds-popup__title">${nama}</p></div>`,
                                        );
                                    }
                                }}
                            />
                        )}

                        {umkmData && (
                            <GeoJSON
                                key={`umkm-${selectedId ?? 'none'}`}
                                data={umkmData}
                                pointToLayer={(feature, latlng) => {
                                    const itemId = feature.id ?? feature.properties?.name;
                                    const isActive = selectedId === itemId;
                                    const initials = getInitials(feature.properties?.name ?? '');
                                    return L.marker(latlng, { icon: createUmkmIcon(isActive, initials) });
                                }}
                                onEachFeature={(feature, layer) => {
                                    const { name, nomor } = feature.properties ?? {};
                                    if (name) {
                                        layer.bindPopup(buildPopupHtml(name, nomor));
                                    }
                                    layer.on({
                                        click: () => selectUmkm(feature as UmkmFeature),
                                    });
                                }}
                            />
                        )}
                    </MapContainer>
                </div>

                {/* Detail card */}
                <div className="pointer-events-none absolute inset-0 z-10">
                    <div
                        className={`pointer-events-auto absolute bottom-sm left-sm right-sm rounded-lg bg-canvas p-md transition-all duration-300 ds-shadow-5 min-[960px]:bottom-lg min-[960px]:left-lg min-[960px]:right-lg min-[960px]:p-xl ${selectedUmkm ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
                            }`}
                    >
                        {selectedUmkm && (
                            <div className="flex flex-col items-stretch gap-sm min-[960px]:flex-row min-[960px]:flex-wrap min-[960px]:items-center min-[960px]:justify-between min-[960px]:gap-md">
                                <div className="flex min-w-0 items-center gap-sm min-[960px]:gap-md">
                                    <div
                                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-primary text-base font-medium uppercase text-on-primary min-[960px]:h-[72px] min-[960px]:w-[72px] min-[960px]:text-lg"
                                        style={{ fontFamily: 'var(--font-mono)' }}
                                    >
                                        {getInitials(selectedUmkm.properties.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="ds-badge bg-grey-50 text-black">UMKM Wonokerto</span>
                                        <h3 className="ds-display-sm mt-xxs truncate text-[18px] min-[960px]:mt-xs min-[960px]:text-[20px]">
                                            {selectedUmkm.properties.name}
                                        </h3>
                                        <p className="ds-body-sm mt-xxs truncate text-body">Desa Wonokerto, Kedunggalar, Ngawi</p>
                                    </div>
                                </div>

                                <div className="shrink-0 min-[960px]:w-auto">
                                    {selectedUmkm.properties.nomor ? (
                                        <a
                                            href={`https://wa.me/${selectedUmkm.properties.nomor}?text=${encodeURIComponent(`Halo, saya tertarik dengan usaha ${selectedUmkm.properties.name} di peta digital Wonokerto.`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="ds-btn-primary w-full min-[960px]:w-auto"
                                        >
                                            Hubungi via WhatsApp
                                        </a>
                                    ) : (
                                        <span className="ds-body-sm text-mute italic">Nomor kontak tidak tersedia</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
