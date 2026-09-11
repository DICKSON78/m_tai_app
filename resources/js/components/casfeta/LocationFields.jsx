import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const normalize = (s = '') => String(s).trim().toLowerCase().replace(/[\s-]+/g, '');

const selectClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm bg-white';

export default function LocationFields({
    value = {},
    onChange,
    labels = { region: 'Region', district: 'District', ward: 'Ward' },
    required = { region: true, district: true, ward: false },
    className = selectClass,
    gridClassName = 'grid grid-cols-1 md:grid-cols-3 gap-5',
    showWard = true,
}) {
    const [regions, setRegions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [busyDistricts, setBusyDistricts] = useState(false);
    const [busyWards, setBusyWards] = useState(false);

    const valueRegion = value.region || '';
    const valueDistrict = value.district || '';
    const valueWard = value.ward || '';

    useEffect(() => {
        let mounted = true;
        api.get('/locations/regions')
            .then((res) => { if (mounted) setRegions(Array.isArray(res.data) ? res.data : []); })
            .catch((e) => { console.error('Failed to load regions:', e); if (mounted) setRegions([]); });
        return () => { mounted = false; };
    }, []);

    const regionName = regions.find((r) => normalize(r.name) === normalize(valueRegion))?.name || '';

    // Prefill districts (and then wards) when a region/district already exists
    // in the value (initial load, edit mode) and the respective list is empty.
    useEffect(() => {
        const r = regions.find((x) => normalize(x.name) === normalize(valueRegion));
        if (!r || districts.length) return;
        setBusyDistricts(true);
        api.get('/locations/districts', { params: { region_id: r.id } })
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : [];
                setDistricts(list);
                const d = list.find((x) => normalize(x.name) === normalize(valueDistrict));
                if (d) {
                    setBusyWards(true);
                    api.get('/locations/wards', { params: { district_id: d.id } })
                        .then((res2) => setWards(Array.isArray(res2.data) ? res2.data : []))
                        .catch(() => setWards([]))
                        .finally(() => setBusyWards(false));
                }
            })
            .catch(() => setDistricts([]))
            .finally(() => setBusyDistricts(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [regions, valueRegion, districts.length]);

    const handleRegion = (e) => {
        const name = e.target.value;
        onChange({ region: name, district: '', ward: '' });
        const r = regions.find((x) => x.name === name);
        setDistricts([]);
        setWards([]);
        if (!r) return;
        setBusyDistricts(true);
        api.get('/locations/districts', { params: { region_id: r.id } })
            .then((res) => setDistricts(Array.isArray(res.data) ? res.data : []))
            .catch(() => setDistricts([]))
            .finally(() => setBusyDistricts(false));
    };

    const handleDistrict = (e) => {
        const name = e.target.value;
        onChange({ district: name, ward: '' });
        const d = districts.find((x) => x.name === name);
        setWards([]);
        if (!d) return;
        setBusyWards(true);
        api.get('/locations/wards', { params: { district_id: d.id } })
            .then((res) => setWards(Array.isArray(res.data) ? res.data : []))
            .catch(() => setWards([]))
            .finally(() => setBusyWards(false));
    };

    const handleWard = (e) => {
        onChange({ ward: e.target.value });
    };

    return (
        <div className={gridClassName}>
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {labels.region} {required.region && <span className="text-red-500">*</span>}
                </label>
                <select
                    value={regionName || valueRegion}
                    onChange={handleRegion}
                    required={required.region}
                    className={className}
                >
                    <option value="">-- Select Region --</option>
                    {regions.map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {labels.district} {required.district && <span className="text-red-500">*</span>}
                </label>
                <select
                    value={valueDistrict}
                    onChange={handleDistrict}
                    disabled={!regionName || busyDistricts}
                    required={required.district}
                    className={className}
                >
                    <option value="">
                        {busyDistricts ? 'Loading districts...' : '-- Select District --'}
                    </option>
                    {districts.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                </select>
            </div>
            {showWard && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {labels.ward} {required.ward && <span className="text-red-500">*</span>}
                    </label>
                    <select
                        value={valueWard}
                        onChange={handleWard}
                        disabled={!valueDistrict || busyWards}
                        required={required.ward}
                        className={className}
                    >
                        <option value="">
                            {busyWards ? 'Loading wards...' : '-- Select Ward --'}
                        </option>
                        {wards.map((w) => (
                            <option key={w.id} value={w.name}>{w.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}