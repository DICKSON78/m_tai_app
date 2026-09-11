import React, { useEffect, useId, useRef, useState } from 'react';
import api from '../../services/api';

const normalize = (s = '') => String(s).trim().toLowerCase().replace(/[\s-]+/g, '');

export default function StreetField({
    value = '',
    onChange,
    wardId,
    label,
    required = false,
    placeholder = 'Street address',
    className = '',
    name,
    icon,
}) {
    const listId = useId();
    const [streets, setStreets] = useState([]);
    const [loading, setLoading] = useState(false);
    const learnedRef = useRef(new Set());
    const fetchSeq = useRef(0);

    // Load streets (ward-specific + district-level) whenever the ward changes.
    useEffect(() => {
        let active = true;
        if (!wardId) {
            setStreets([]);
            return () => { active = false; };
        }
        const seq = ++fetchSeq.current;
        setLoading(true);
        setStreets([]);
        api.get('/locations/streets', { params: { ward_id: wardId } })
            .then((res) => {
                if (active && seq === fetchSeq.current) {
                    setStreets(Array.isArray(res.data) ? res.data : []);
                }
            })
            .catch((e) => {
                console.error('Failed to load streets:', e);
                if (active && seq === fetchSeq.current) setStreets([]);
            })
            .finally(() => {
                if (active && seq === fetchSeq.current) setLoading(false);
            });
        return () => { active = false; };
    }, [wardId]);

    const handleBlur = () => {
        const text = String(value || '').trim();
        if (!text) return;

        const known = streets.find((s) => normalize(s.name) === normalize(text));
        if (known) {
            onChange(known.name);
            return;
        }

        // Custom street: persist it so it shows up for other users next time.
        if (!wardId || learnedRef.current.has(`${wardId}:${normalize(text)}`)) return;
        learnedRef.current.add(`${wardId}:${normalize(text)}`);
        api.post('/locations/streets', { ward_id: wardId, name: text })
            .then((res) => { if (res.data) onChange(res.data.name || text); })
            .catch((e) => console.error('Failed to save street:', e));
    };

    return (
        <div>
            {label && (
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    type="text"
                    name={name}
                    value={value}
                    list={listId}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    required={required}
                    className={className}
                    autoComplete="off"
                />
                <datalist id={listId}>
                    {streets.map((s) => (
                        <option key={s.id} value={s.name} />
                    ))}
                </datalist>
            </div>
            {loading && wardId && (
                <p className="mt-1 text-xs text-gray-400">Loading street suggestions...</p>
            )}
        </div>
    );
}