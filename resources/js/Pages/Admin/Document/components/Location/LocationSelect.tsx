import React, { useEffect, useState } from 'react';
import { LocationNode } from '../../types/types';
import realDocumentService from '../../services/realDocumentService';

interface LocationSelectProps {
  value: number | null;
  onChange: (locationId: number | null) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
}

const flatten = (nodes: LocationNode[], acc: { id: number; path: string }[] = []): { id: number; path: string }[] => {
  nodes.forEach((n) => {
    acc.push({ id: n.id, path: n.path });
    if (n.children?.length) flatten(n.children, acc);
  });
  return acc;
};

/**
 * Dropdown of managed physical locations (cabinets and their sub-locations).
 * Emits the selected location id (or null for "No location").
 */
const LocationSelect: React.FC<LocationSelectProps> = ({ value, onChange, className, id, disabled }) => {
  const [options, setOptions] = useState<{ id: number; path: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    realDocumentService
      .getLocationTree()
      .then((res) => { if (active) setOptions(flatten(res.tree)); })
      .catch((err) => console.error('Failed to load locations', err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <select
      id={id}
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={className}
    >
      <option value="">{loading ? 'Loading locations…' : 'No location'}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.path}</option>
      ))}
    </select>
  );
};

export default LocationSelect;
