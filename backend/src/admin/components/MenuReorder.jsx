import React, { useState, useEffect, useRef } from "react";

/**
 * Componente de reordenamiento de ítems del menú con drag-and-drop nativo.
 *
 * - Las filas modificadas se destacan en amarillo hasta guardar.
 * - El botón "Guardar orden" solo se activa cuando hay cambios pendientes.
 * - Al guardar, llama a PATCH /api/navigation/menu/reorder con el nuevo orden.
 */
const MenuReorder = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changedIds, setChangedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragIndex = useRef(null);

  // ─── Snapshot de orden original para detectar cambios ──────────────────────
  const originalOrder = useRef([]);

  useEffect(() => {
    fetch("/api/navigation/menu/all")
      .then((r) => r.json())
      .then((data) => {
        const sorted = data.data ?? [];
        setItems(sorted);
        originalOrder.current = sorted.map((i) => i.id);
        setLoading(false);
      })
      .catch(() => {
        setMessage({ type: "error", text: "No se pudo cargar la lista de ítems." });
        setLoading(false);
      });
  }, []);

  // ─── Eventos de drag & drop ─────────────────────────────────────────────────
  const onDragStart = (e, index) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const onDragLeave = () => {
    setDragOverIndex(null);
  };

  const onDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    const fromIndex = dragIndex.current;
    if (fromIndex === null || fromIndex === dropIndex) return;

    const newItems = [...items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(dropIndex, 0, moved);

    // Reasignar el campo 'order' según la nueva posición
    const reordered = newItems.map((item, i) => ({ ...item, order: i }));

    // Detectar IDs cuya posición cambió respecto al orden original
    const changed = new Set();
    reordered.forEach((item, i) => {
      if (originalOrder.current[i] !== item.id) changed.add(item.id);
    });

    setItems(reordered);
    setChangedIds(changed);
    setMessage(null);
    dragIndex.current = null;
  };

  const onDragEnd = () => {
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  // ─── Guardar nuevo orden en la DB ───────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/navigation/menu/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map(({ id, order }) => ({ id, order })) }),
      });
      if (res.ok) {
        originalOrder.current = items.map((i) => i.id);
        setChangedIds(new Set());
        setMessage({ type: "success", text: `✅ Orden guardado. ${items.length} ítems actualizados.` });
      } else {
        setMessage({ type: "error", text: "❌ Error al guardar. Intenta de nuevo." });
      }
    } catch {
      setMessage({ type: "error", text: "❌ Error de conexión con el servidor." });
    }
    setSaving(false);
  };

  // ─── Estilos ─────────────────────────────────────────────────────────────────
  const styles = {
    wrap:     { padding: "2rem", fontFamily: "sans-serif", maxWidth: "720px" },
    heading:  { fontSize: "1.4rem", fontWeight: "600", marginBottom: "0.4rem" },
    hint:     { color: "#777", fontSize: "0.875rem", marginBottom: "1.5rem" },
    table:    { width: "100%", borderCollapse: "collapse", marginBottom: "1.5rem" },
    th:       { padding: "10px 14px", textAlign: "left", background: "#f4f4f4", fontWeight: "600", fontSize: "0.85rem", color: "#444", borderBottom: "2px solid #e0e0e0" },
    tdHandle: { padding: "12px 14px", color: "#aaa", fontSize: "1.2rem", cursor: "grab", userSelect: "none" },
    tdText:   { padding: "12px 14px", fontSize: "0.9rem" },
    tdBadge:  { padding: "12px 14px", textAlign: "center" },
    rowBase:  { borderBottom: "1px solid #ebebeb", transition: "background 0.25s ease" },
    rowChangd:{ background: "#fff8e1", borderLeft: "3px solid #f59e0b" },
    rowNorm:  { background: "#fff", borderLeft: "3px solid transparent" },
    rowHover: { background: "#e8f0fe", borderLeft: "3px solid #4268F6" },
    badge:    (active) => ({
      display: "inline-block", padding: "2px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: "600",
      background: active ? "#dcfce7" : "#fee2e2", color: active ? "#15803d" : "#b91c1c",
    }),
    msg: (type) => ({
      padding: "0.75rem 1rem", marginBottom: "1.2rem", borderRadius: "6px",
      background: type === "success" ? "#f0fdf4" : "#fef2f2",
      border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
      color: type === "success" ? "#166534" : "#991b1b", fontSize: "0.9rem",
    }),
    btnSave: (disabled) => ({
      padding: "0.6rem 1.6rem", background: disabled ? "#d1d5db" : "#4268F6",
      color: "#fff", border: "none", borderRadius: "6px", fontSize: "0.9rem", fontWeight: "600",
      cursor: disabled ? "not-allowed" : "pointer", transition: "background 0.2s",
    }),
    source: { fontSize: "0.78rem", color: "#9ca3af", display: "inline-block", marginTop: "2px" },
  };

  if (loading) {
    return <div style={styles.wrap}><p style={styles.hint}>Cargando ítems del menú...</p></div>;
  }

  const hasPending = changedIds.size > 0;

  return (
    <div style={styles.wrap}>
      <h2 style={styles.heading}>Reordenar Menú de Navegación</h2>
      <p style={styles.hint}>
        Arrastra las filas para cambiar el orden. Las filas modificadas se destacan en amarillo.
        Haz clic en <strong>Guardar orden</strong> para confirmar los cambios en la base de datos.
      </p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: "36px" }}></th>
            <th style={styles.th}>Pos.</th>
            <th style={styles.th}>Etiqueta</th>
            <th style={styles.th}>URL</th>
            <th style={styles.th}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const isChanged  = changedIds.has(item.id);
            const isDragOver = dragOverIndex === index;
            const rowStyle   = {
              ...styles.rowBase,
              ...(isDragOver ? styles.rowHover : isChanged ? styles.rowChangd : styles.rowNorm),
            };

            return (
              <tr
                key={item.id}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, index)}
                onDragEnd={onDragEnd}
                style={rowStyle}
              >
                <td style={styles.tdHandle} title="Arrastra para reordenar">⠿</td>
                <td style={{ ...styles.tdText, color: "#9ca3af", fontWeight: "600" }}>{index + 1}</td>
                <td style={styles.tdText}>
                  <strong>{item.label}</strong>
                  {item.source_slug && (
                    <span style={styles.source}> · sincronizado desde sección</span>
                  )}
                </td>
                <td style={{ ...styles.tdText, color: "#4268F6" }}>{item.url}</td>
                <td style={styles.tdBadge}>
                  <span style={styles.badge(item.is_active)}>
                    {item.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {message && <div style={styles.msg(message.type)}>{message.text}</div>}

      <button
        onClick={handleSave}
        disabled={!hasPending || saving}
        style={styles.btnSave(!hasPending || saving)}
      >
        {saving
          ? "Guardando..."
          : hasPending
            ? `Guardar orden (${changedIds.size} cambio${changedIds.size > 1 ? "s" : ""})`
            : "Sin cambios pendientes"}
      </button>
    </div>
  );
};

export default MenuReorder;
