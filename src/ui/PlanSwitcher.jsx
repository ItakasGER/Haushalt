import React, { useState } from 'react';
import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { COLORS } from '../core/theme.js';
import { usePlan } from '../core/PlanContext.jsx';
import { Button, ConfirmBar, IconButton, Select, TextField } from './components.jsx';

export default function PlanSwitcher() {
  const { plans, activePlan, activePlanId, switchPlan, createPlan, renamePlan, deletePlan } = usePlan();
  const [mode, setMode] = useState(null); // null | 'create' | 'rename' | 'delete'
  const [nameInput, setNameInput] = useState('');

  const cancel = () => { setMode(null); setNameInput(''); };
  const confirm = () => {
    if (mode === 'create') createPlan(nameInput);
    if (mode === 'rename') renamePlan(activePlanId, nameInput);
    cancel();
  };

  return (
    <>
      <div className="px-4 py-2 flex flex-wrap items-center gap-2" style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
        <span className="flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color: COLORS.textMuted }}>
          <FolderOpen size={14} /> HAUSHALTSPLAN
        </span>
        <Select value={activePlanId} onChange={e => switchPlan(e.target.value)} className="font-medium max-w-[45vw]">
          {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Button onClick={() => { setNameInput(''); setMode('create'); }}><Plus size={16} /> Neuer Plan</Button>
        <IconButton label="Plan umbenennen" onClick={() => { setNameInput(activePlan?.name || ''); setMode('rename'); }}><Pencil size={18} /></IconButton>
        {plans.length > 1 && <IconButton label="Plan löschen" onClick={() => setMode('delete')}><Trash2 size={18} /></IconButton>}

        {(mode === 'create' || mode === 'rename') && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TextField autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)} enterKeyHint="done"
              onKeyDown={e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); }}
              placeholder="Name des Plans" className="flex-1 sm:w-56" />
            <Button variant="primary" onClick={confirm}>{mode === 'create' ? 'Erstellen' : 'Speichern'}</Button>
            <Button onClick={cancel}>Abbrechen</Button>
          </div>
        )}
      </div>
      {mode === 'delete' && (
        <ConfirmBar text={`„${activePlan?.name}" wirklich löschen? Nicht rückgängig zu machen.`}
          onConfirm={() => { deletePlan(activePlanId); cancel(); }} onCancel={cancel} />
      )}
    </>
  );
}
