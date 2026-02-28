(function (React, designSystem, adminjs) {
  'use strict';

  function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

  var React__default = /*#__PURE__*/_interopDefault(React);

  /**
   * Componente de reordenamiento de ítems del menú con drag-and-drop nativo.
   *
   * - Las filas modificadas se destacan en amarillo hasta guardar.
   * - El botón "Guardar orden" solo se activa cuando hay cambios pendientes.
   * - Al guardar, llama a PATCH /api/navigation/menu/reorder con el nuevo orden.
   */
  const MenuReorder = () => {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [changedIds, setChangedIds] = React.useState(new Set());
    const [saving, setSaving] = React.useState(false);
    const [message, setMessage] = React.useState(null);
    const [dragOverIndex, setDragOverIndex] = React.useState(null);
    const dragIndex = React.useRef(null);

    // ─── Snapshot de orden original para detectar cambios ──────────────────────
    const originalOrder = React.useRef([]);
    React.useEffect(() => {
      fetch("/api/navigation/menu/all").then(r => r.json()).then(data => {
        const sorted = data.data ?? [];
        setItems(sorted);
        originalOrder.current = sorted.map(i => i.id);
        setLoading(false);
      }).catch(() => {
        setMessage({
          type: "error",
          text: "No se pudo cargar la lista de ítems."
        });
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
      const reordered = newItems.map((item, i) => ({
        ...item,
        order: i
      }));

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
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            items: items.map(({
              id,
              order
            }) => ({
              id,
              order
            }))
          })
        });
        if (res.ok) {
          originalOrder.current = items.map(i => i.id);
          setChangedIds(new Set());
          setMessage({
            type: "success",
            text: `✅ Orden guardado. ${items.length} ítems actualizados.`
          });
        } else {
          setMessage({
            type: "error",
            text: "❌ Error al guardar. Intenta de nuevo."
          });
        }
      } catch {
        setMessage({
          type: "error",
          text: "❌ Error de conexión con el servidor."
        });
      }
      setSaving(false);
    };

    // ─── Estilos ─────────────────────────────────────────────────────────────────
    const styles = {
      wrap: {
        padding: "2rem",
        fontFamily: "sans-serif",
        maxWidth: "720px"
      },
      heading: {
        fontSize: "1.4rem",
        fontWeight: "600",
        marginBottom: "0.4rem"
      },
      hint: {
        color: "#777",
        fontSize: "0.875rem",
        marginBottom: "1.5rem"
      },
      table: {
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "1.5rem"
      },
      th: {
        padding: "10px 14px",
        textAlign: "left",
        background: "#f4f4f4",
        fontWeight: "600",
        fontSize: "0.85rem",
        color: "#444",
        borderBottom: "2px solid #e0e0e0"
      },
      tdHandle: {
        padding: "12px 14px",
        color: "#aaa",
        fontSize: "1.2rem",
        cursor: "grab",
        userSelect: "none"
      },
      tdText: {
        padding: "12px 14px",
        fontSize: "0.9rem"
      },
      tdBadge: {
        padding: "12px 14px",
        textAlign: "center"
      },
      rowBase: {
        borderBottom: "1px solid #ebebeb",
        transition: "background 0.25s ease"
      },
      rowChangd: {
        background: "#fff8e1",
        borderLeft: "3px solid #f59e0b"
      },
      rowNorm: {
        background: "#fff",
        borderLeft: "3px solid transparent"
      },
      rowHover: {
        background: "#e8f0fe",
        borderLeft: "3px solid #4268F6"
      },
      badge: active => ({
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "12px",
        fontSize: "0.78rem",
        fontWeight: "600",
        background: active ? "#dcfce7" : "#fee2e2",
        color: active ? "#15803d" : "#b91c1c"
      }),
      msg: type => ({
        padding: "0.75rem 1rem",
        marginBottom: "1.2rem",
        borderRadius: "6px",
        background: type === "success" ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
        color: type === "success" ? "#166534" : "#991b1b",
        fontSize: "0.9rem"
      }),
      btnSave: disabled => ({
        padding: "0.6rem 1.6rem",
        background: disabled ? "#d1d5db" : "#4268F6",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        fontSize: "0.9rem",
        fontWeight: "600",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s"
      }),
      source: {
        fontSize: "0.78rem",
        color: "#9ca3af",
        display: "inline-block",
        marginTop: "2px"
      }
    };
    if (loading) {
      return /*#__PURE__*/React__default.default.createElement("div", {
        style: styles.wrap
      }, /*#__PURE__*/React__default.default.createElement("p", {
        style: styles.hint
      }, "Cargando \xEDtems del men\xFA..."));
    }
    const hasPending = changedIds.size > 0;
    return /*#__PURE__*/React__default.default.createElement("div", {
      style: styles.wrap
    }, /*#__PURE__*/React__default.default.createElement("h2", {
      style: styles.heading
    }, "Reordenar Men\xFA de Navegaci\xF3n"), /*#__PURE__*/React__default.default.createElement("p", {
      style: styles.hint
    }, "Arrastra las filas para cambiar el orden. Las filas modificadas se destacan en amarillo. Haz clic en ", /*#__PURE__*/React__default.default.createElement("strong", null, "Guardar orden"), " para confirmar los cambios en la base de datos."), /*#__PURE__*/React__default.default.createElement("table", {
      style: styles.table
    }, /*#__PURE__*/React__default.default.createElement("thead", null, /*#__PURE__*/React__default.default.createElement("tr", null, /*#__PURE__*/React__default.default.createElement("th", {
      style: {
        ...styles.th,
        width: "36px"
      }
    }), /*#__PURE__*/React__default.default.createElement("th", {
      style: styles.th
    }, "Pos."), /*#__PURE__*/React__default.default.createElement("th", {
      style: styles.th
    }, "Etiqueta"), /*#__PURE__*/React__default.default.createElement("th", {
      style: styles.th
    }, "URL"), /*#__PURE__*/React__default.default.createElement("th", {
      style: styles.th
    }, "Estado"))), /*#__PURE__*/React__default.default.createElement("tbody", null, items.map((item, index) => {
      const isChanged = changedIds.has(item.id);
      const isDragOver = dragOverIndex === index;
      const rowStyle = {
        ...styles.rowBase,
        ...(isDragOver ? styles.rowHover : isChanged ? styles.rowChangd : styles.rowNorm)
      };
      return /*#__PURE__*/React__default.default.createElement("tr", {
        key: item.id,
        draggable: true,
        onDragStart: e => onDragStart(e, index),
        onDragOver: e => onDragOver(e, index),
        onDragLeave: onDragLeave,
        onDrop: e => onDrop(e, index),
        onDragEnd: onDragEnd,
        style: rowStyle
      }, /*#__PURE__*/React__default.default.createElement("td", {
        style: styles.tdHandle,
        title: "Arrastra para reordenar"
      }, "\u283F"), /*#__PURE__*/React__default.default.createElement("td", {
        style: {
          ...styles.tdText,
          color: "#9ca3af",
          fontWeight: "600"
        }
      }, index + 1), /*#__PURE__*/React__default.default.createElement("td", {
        style: styles.tdText
      }, /*#__PURE__*/React__default.default.createElement("strong", null, item.label), item.source_slug && /*#__PURE__*/React__default.default.createElement("span", {
        style: styles.source
      }, " \xB7 sincronizado desde secci\xF3n")), /*#__PURE__*/React__default.default.createElement("td", {
        style: {
          ...styles.tdText,
          color: "#4268F6"
        }
      }, item.url), /*#__PURE__*/React__default.default.createElement("td", {
        style: styles.tdBadge
      }, /*#__PURE__*/React__default.default.createElement("span", {
        style: styles.badge(item.is_active)
      }, item.is_active ? "Activo" : "Inactivo")));
    }))), message && /*#__PURE__*/React__default.default.createElement("div", {
      style: styles.msg(message.type)
    }, message.text), /*#__PURE__*/React__default.default.createElement("button", {
      onClick: handleSave,
      disabled: !hasPending || saving,
      style: styles.btnSave(!hasPending || saving)
    }, saving ? "Guardando..." : hasPending ? `Guardar orden (${changedIds.size} cambio${changedIds.size > 1 ? "s" : ""})` : "Sin cambios pendientes"));
  };

  const Edit = ({ property, record, onChange }) => {
      const { translateProperty } = adminjs.useTranslation();
      const { params } = record;
      const { custom } = property;
      const path = adminjs.flat.get(params, custom.filePathProperty);
      const key = adminjs.flat.get(params, custom.keyProperty);
      const file = adminjs.flat.get(params, custom.fileProperty);
      const [originalKey, setOriginalKey] = React.useState(key);
      const [filesToUpload, setFilesToUpload] = React.useState([]);
      React.useEffect(() => {
          // it means means that someone hit save and new file has been uploaded
          // in this case fliesToUpload should be cleared.
          // This happens when user turns off redirect after new/edit
          if ((typeof key === 'string' && key !== originalKey)
              || (typeof key !== 'string' && !originalKey)
              || (typeof key !== 'string' && Array.isArray(key) && key.length !== originalKey.length)) {
              setOriginalKey(key);
              setFilesToUpload([]);
          }
      }, [key, originalKey]);
      const onUpload = (files) => {
          setFilesToUpload(files);
          onChange(custom.fileProperty, files);
      };
      const handleRemove = () => {
          onChange(custom.fileProperty, null);
      };
      const handleMultiRemove = (singleKey) => {
          const index = (adminjs.flat.get(record.params, custom.keyProperty) || []).indexOf(singleKey);
          const filesToDelete = adminjs.flat.get(record.params, custom.filesToDeleteProperty) || [];
          if (path && path.length > 0) {
              const newPath = path.map((currentPath, i) => (i !== index ? currentPath : null));
              let newParams = adminjs.flat.set(record.params, custom.filesToDeleteProperty, [...filesToDelete, index]);
              newParams = adminjs.flat.set(newParams, custom.filePathProperty, newPath);
              onChange({
                  ...record,
                  params: newParams,
              });
          }
          else {
              // eslint-disable-next-line no-console
              console.log('You cannot remove file when there are no uploaded files yet');
          }
      };
      return (React__default.default.createElement(designSystem.FormGroup, null,
          React__default.default.createElement(designSystem.Label, null, translateProperty(property.label, property.resourceId)),
          React__default.default.createElement(designSystem.DropZone, { onChange: onUpload, multiple: custom.multiple, validate: {
                  mimeTypes: custom.mimeTypes,
                  maxSize: custom.maxSize,
              }, files: filesToUpload }),
          !custom.multiple && key && path && !filesToUpload.length && file !== null && (React__default.default.createElement(designSystem.DropZoneItem, { filename: key, src: path, onRemove: handleRemove })),
          custom.multiple && key && key.length && path ? (React__default.default.createElement(React__default.default.Fragment, null, key.map((singleKey, index) => {
              // when we remove items we set only path index to nulls.
              // key is still there. This is because
              // we have to maintain all the indexes. So here we simply filter out elements which
              // were removed and display only what was left
              const currentPath = path[index];
              return currentPath ? (React__default.default.createElement(designSystem.DropZoneItem, { key: singleKey, filename: singleKey, src: path[index], onRemove: () => handleMultiRemove(singleKey) })) : '';
          }))) : ''));
  };

  const AudioMimeTypes = [
      'audio/aac',
      'audio/midi',
      'audio/x-midi',
      'audio/mpeg',
      'audio/ogg',
      'application/ogg',
      'audio/opus',
      'audio/wav',
      'audio/webm',
      'audio/3gpp2',
  ];
  const ImageMimeTypes = [
      'image/bmp',
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/vnd.microsoft.icon',
      'image/tiff',
      'image/webp',
  ];

  // eslint-disable-next-line import/no-extraneous-dependencies
  const SingleFile = (props) => {
      const { name, path, mimeType, width } = props;
      if (path && path.length) {
          if (mimeType && ImageMimeTypes.includes(mimeType)) {
              return (React__default.default.createElement("img", { src: path, style: { maxHeight: width, maxWidth: width }, alt: name }));
          }
          if (mimeType && AudioMimeTypes.includes(mimeType)) {
              return (React__default.default.createElement("audio", { controls: true, src: path },
                  "Your browser does not support the",
                  React__default.default.createElement("code", null, "audio"),
                  React__default.default.createElement("track", { kind: "captions" })));
          }
      }
      return (React__default.default.createElement(designSystem.Box, null,
          React__default.default.createElement(designSystem.Button, { as: "a", href: path, ml: "default", size: "sm", rounded: true, target: "_blank" },
              React__default.default.createElement(designSystem.Icon, { icon: "DocumentDownload", color: "white", mr: "default" }),
              name)));
  };
  const File = ({ width, record, property }) => {
      const { custom } = property;
      let path = adminjs.flat.get(record?.params, custom.filePathProperty);
      if (!path) {
          return null;
      }
      const name = adminjs.flat.get(record?.params, custom.fileNameProperty ? custom.fileNameProperty : custom.keyProperty);
      const mimeType = custom.mimeTypeProperty
          && adminjs.flat.get(record?.params, custom.mimeTypeProperty);
      if (!property.custom.multiple) {
          if (custom.opts && custom.opts.baseUrl) {
              path = `${custom.opts.baseUrl}/${name}`;
          }
          return (React__default.default.createElement(SingleFile, { path: path, name: name, width: width, mimeType: mimeType }));
      }
      if (custom.opts && custom.opts.baseUrl) {
          const baseUrl = custom.opts.baseUrl || '';
          path = path.map((singlePath, index) => `${baseUrl}/${name[index]}`);
      }
      return (React__default.default.createElement(React__default.default.Fragment, null, path.map((singlePath, index) => (React__default.default.createElement(SingleFile, { key: singlePath, path: singlePath, name: name[index], width: width, mimeType: mimeType[index] })))));
  };

  const List = (props) => (React__default.default.createElement(File, { width: 100, ...props }));

  const Show = (props) => {
      const { property } = props;
      const { translateProperty } = adminjs.useTranslation();
      return (React__default.default.createElement(designSystem.FormGroup, null,
          React__default.default.createElement(designSystem.Label, null, translateProperty(property.label, property.resourceId)),
          React__default.default.createElement(File, { width: "100%", ...props })));
  };

  AdminJS.UserComponents = {};
  AdminJS.UserComponents.MenuReorder = MenuReorder;
  AdminJS.UserComponents.UploadEditComponent = Edit;
  AdminJS.UserComponents.UploadListComponent = List;
  AdminJS.UserComponents.UploadShowComponent = Show;

})(React, AdminJSDesignSystem, AdminJS);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvYWRtaW4vY29tcG9uZW50cy9NZW51UmVvcmRlci5qc3giLCIuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvVXBsb2FkRWRpdENvbXBvbmVudC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvdHlwZXMvbWltZS10eXBlcy50eXBlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS9jb21wb25lbnRzL2ZpbGUuanMiLCIuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvVXBsb2FkTGlzdENvbXBvbmVudC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRTaG93Q29tcG9uZW50LmpzIiwiZW50cnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gXCJyZWFjdFwiO1xuXG4vKipcbiAqIENvbXBvbmVudGUgZGUgcmVvcmRlbmFtaWVudG8gZGUgw610ZW1zIGRlbCBtZW7DuiBjb24gZHJhZy1hbmQtZHJvcCBuYXRpdm8uXG4gKlxuICogLSBMYXMgZmlsYXMgbW9kaWZpY2FkYXMgc2UgZGVzdGFjYW4gZW4gYW1hcmlsbG8gaGFzdGEgZ3VhcmRhci5cbiAqIC0gRWwgYm90w7NuIFwiR3VhcmRhciBvcmRlblwiIHNvbG8gc2UgYWN0aXZhIGN1YW5kbyBoYXkgY2FtYmlvcyBwZW5kaWVudGVzLlxuICogLSBBbCBndWFyZGFyLCBsbGFtYSBhIFBBVENIIC9hcGkvbmF2aWdhdGlvbi9tZW51L3Jlb3JkZXIgY29uIGVsIG51ZXZvIG9yZGVuLlxuICovXG5jb25zdCBNZW51UmVvcmRlciA9ICgpID0+IHtcbiAgY29uc3QgW2l0ZW1zLCBzZXRJdGVtc10gPSB1c2VTdGF0ZShbXSk7XG4gIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbY2hhbmdlZElkcywgc2V0Q2hhbmdlZElkc10gPSB1c2VTdGF0ZShuZXcgU2V0KCkpO1xuICBjb25zdCBbc2F2aW5nLCBzZXRTYXZpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbWVzc2FnZSwgc2V0TWVzc2FnZV0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2RyYWdPdmVySW5kZXgsIHNldERyYWdPdmVySW5kZXhdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IGRyYWdJbmRleCA9IHVzZVJlZihudWxsKTtcblxuICAvLyDilIDilIDilIAgU25hcHNob3QgZGUgb3JkZW4gb3JpZ2luYWwgcGFyYSBkZXRlY3RhciBjYW1iaW9zIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICBjb25zdCBvcmlnaW5hbE9yZGVyID0gdXNlUmVmKFtdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGZldGNoKFwiL2FwaS9uYXZpZ2F0aW9uL21lbnUvYWxsXCIpXG4gICAgICAudGhlbigocikgPT4gci5qc29uKCkpXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICBjb25zdCBzb3J0ZWQgPSBkYXRhLmRhdGEgPz8gW107XG4gICAgICAgIHNldEl0ZW1zKHNvcnRlZCk7XG4gICAgICAgIG9yaWdpbmFsT3JkZXIuY3VycmVudCA9IHNvcnRlZC5tYXAoKGkpID0+IGkuaWQpO1xuICAgICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKCkgPT4ge1xuICAgICAgICBzZXRNZXNzYWdlKHsgdHlwZTogXCJlcnJvclwiLCB0ZXh0OiBcIk5vIHNlIHB1ZG8gY2FyZ2FyIGxhIGxpc3RhIGRlIMOtdGVtcy5cIiB9KTtcbiAgICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICB9KTtcbiAgfSwgW10pO1xuXG4gIC8vIOKUgOKUgOKUgCBFdmVudG9zIGRlIGRyYWcgJiBkcm9wIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICBjb25zdCBvbkRyYWdTdGFydCA9IChlLCBpbmRleCkgPT4ge1xuICAgIGRyYWdJbmRleC5jdXJyZW50ID0gaW5kZXg7XG4gICAgZS5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9IFwibW92ZVwiO1xuICB9O1xuXG4gIGNvbnN0IG9uRHJhZ092ZXIgPSAoZSwgaW5kZXgpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwibW92ZVwiO1xuICAgIHNldERyYWdPdmVySW5kZXgoaW5kZXgpO1xuICB9O1xuXG4gIGNvbnN0IG9uRHJhZ0xlYXZlID0gKCkgPT4ge1xuICAgIHNldERyYWdPdmVySW5kZXgobnVsbCk7XG4gIH07XG5cbiAgY29uc3Qgb25Ecm9wID0gKGUsIGRyb3BJbmRleCkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBzZXREcmFnT3ZlckluZGV4KG51bGwpO1xuICAgIGNvbnN0IGZyb21JbmRleCA9IGRyYWdJbmRleC5jdXJyZW50O1xuICAgIGlmIChmcm9tSW5kZXggPT09IG51bGwgfHwgZnJvbUluZGV4ID09PSBkcm9wSW5kZXgpIHJldHVybjtcblxuICAgIGNvbnN0IG5ld0l0ZW1zID0gWy4uLml0ZW1zXTtcbiAgICBjb25zdCBbbW92ZWRdID0gbmV3SXRlbXMuc3BsaWNlKGZyb21JbmRleCwgMSk7XG4gICAgbmV3SXRlbXMuc3BsaWNlKGRyb3BJbmRleCwgMCwgbW92ZWQpO1xuXG4gICAgLy8gUmVhc2lnbmFyIGVsIGNhbXBvICdvcmRlcicgc2Vnw7puIGxhIG51ZXZhIHBvc2ljacOzblxuICAgIGNvbnN0IHJlb3JkZXJlZCA9IG5ld0l0ZW1zLm1hcCgoaXRlbSwgaSkgPT4gKHsgLi4uaXRlbSwgb3JkZXI6IGkgfSkpO1xuXG4gICAgLy8gRGV0ZWN0YXIgSURzIGN1eWEgcG9zaWNpw7NuIGNhbWJpw7MgcmVzcGVjdG8gYWwgb3JkZW4gb3JpZ2luYWxcbiAgICBjb25zdCBjaGFuZ2VkID0gbmV3IFNldCgpO1xuICAgIHJlb3JkZXJlZC5mb3JFYWNoKChpdGVtLCBpKSA9PiB7XG4gICAgICBpZiAob3JpZ2luYWxPcmRlci5jdXJyZW50W2ldICE9PSBpdGVtLmlkKSBjaGFuZ2VkLmFkZChpdGVtLmlkKTtcbiAgICB9KTtcblxuICAgIHNldEl0ZW1zKHJlb3JkZXJlZCk7XG4gICAgc2V0Q2hhbmdlZElkcyhjaGFuZ2VkKTtcbiAgICBzZXRNZXNzYWdlKG51bGwpO1xuICAgIGRyYWdJbmRleC5jdXJyZW50ID0gbnVsbDtcbiAgfTtcblxuICBjb25zdCBvbkRyYWdFbmQgPSAoKSA9PiB7XG4gICAgZHJhZ0luZGV4LmN1cnJlbnQgPSBudWxsO1xuICAgIHNldERyYWdPdmVySW5kZXgobnVsbCk7XG4gIH07XG5cbiAgLy8g4pSA4pSA4pSAIEd1YXJkYXIgbnVldm8gb3JkZW4gZW4gbGEgREIg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0U2F2aW5nKHRydWUpO1xuICAgIHNldE1lc3NhZ2UobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFwiL2FwaS9uYXZpZ2F0aW9uL21lbnUvcmVvcmRlclwiLCB7XG4gICAgICAgIG1ldGhvZDogXCJQQVRDSFwiLFxuICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaXRlbXM6IGl0ZW1zLm1hcCgoeyBpZCwgb3JkZXIgfSkgPT4gKHsgaWQsIG9yZGVyIH0pKSB9KSxcbiAgICAgIH0pO1xuICAgICAgaWYgKHJlcy5vaykge1xuICAgICAgICBvcmlnaW5hbE9yZGVyLmN1cnJlbnQgPSBpdGVtcy5tYXAoKGkpID0+IGkuaWQpO1xuICAgICAgICBzZXRDaGFuZ2VkSWRzKG5ldyBTZXQoKSk7XG4gICAgICAgIHNldE1lc3NhZ2UoeyB0eXBlOiBcInN1Y2Nlc3NcIiwgdGV4dDogYOKchSBPcmRlbiBndWFyZGFkby4gJHtpdGVtcy5sZW5ndGh9IMOtdGVtcyBhY3R1YWxpemFkb3MuYCB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldE1lc3NhZ2UoeyB0eXBlOiBcImVycm9yXCIsIHRleHQ6IFwi4p2MIEVycm9yIGFsIGd1YXJkYXIuIEludGVudGEgZGUgbnVldm8uXCIgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBzZXRNZXNzYWdlKHsgdHlwZTogXCJlcnJvclwiLCB0ZXh0OiBcIuKdjCBFcnJvciBkZSBjb25leGnDs24gY29uIGVsIHNlcnZpZG9yLlwiIH0pO1xuICAgIH1cbiAgICBzZXRTYXZpbmcoZmFsc2UpO1xuICB9O1xuXG4gIC8vIOKUgOKUgOKUgCBFc3RpbG9zIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICBjb25zdCBzdHlsZXMgPSB7XG4gICAgd3JhcDogICAgIHsgcGFkZGluZzogXCIycmVtXCIsIGZvbnRGYW1pbHk6IFwic2Fucy1zZXJpZlwiLCBtYXhXaWR0aDogXCI3MjBweFwiIH0sXG4gICAgaGVhZGluZzogIHsgZm9udFNpemU6IFwiMS40cmVtXCIsIGZvbnRXZWlnaHQ6IFwiNjAwXCIsIG1hcmdpbkJvdHRvbTogXCIwLjRyZW1cIiB9LFxuICAgIGhpbnQ6ICAgICB7IGNvbG9yOiBcIiM3NzdcIiwgZm9udFNpemU6IFwiMC44NzVyZW1cIiwgbWFyZ2luQm90dG9tOiBcIjEuNXJlbVwiIH0sXG4gICAgdGFibGU6ICAgIHsgd2lkdGg6IFwiMTAwJVwiLCBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLCBtYXJnaW5Cb3R0b206IFwiMS41cmVtXCIgfSxcbiAgICB0aDogICAgICAgeyBwYWRkaW5nOiBcIjEwcHggMTRweFwiLCB0ZXh0QWxpZ246IFwibGVmdFwiLCBiYWNrZ3JvdW5kOiBcIiNmNGY0ZjRcIiwgZm9udFdlaWdodDogXCI2MDBcIiwgZm9udFNpemU6IFwiMC44NXJlbVwiLCBjb2xvcjogXCIjNDQ0XCIsIGJvcmRlckJvdHRvbTogXCIycHggc29saWQgI2UwZTBlMFwiIH0sXG4gICAgdGRIYW5kbGU6IHsgcGFkZGluZzogXCIxMnB4IDE0cHhcIiwgY29sb3I6IFwiI2FhYVwiLCBmb250U2l6ZTogXCIxLjJyZW1cIiwgY3Vyc29yOiBcImdyYWJcIiwgdXNlclNlbGVjdDogXCJub25lXCIgfSxcbiAgICB0ZFRleHQ6ICAgeyBwYWRkaW5nOiBcIjEycHggMTRweFwiLCBmb250U2l6ZTogXCIwLjlyZW1cIiB9LFxuICAgIHRkQmFkZ2U6ICB7IHBhZGRpbmc6IFwiMTJweCAxNHB4XCIsIHRleHRBbGlnbjogXCJjZW50ZXJcIiB9LFxuICAgIHJvd0Jhc2U6ICB7IGJvcmRlckJvdHRvbTogXCIxcHggc29saWQgI2ViZWJlYlwiLCB0cmFuc2l0aW9uOiBcImJhY2tncm91bmQgMC4yNXMgZWFzZVwiIH0sXG4gICAgcm93Q2hhbmdkOnsgYmFja2dyb3VuZDogXCIjZmZmOGUxXCIsIGJvcmRlckxlZnQ6IFwiM3B4IHNvbGlkICNmNTllMGJcIiB9LFxuICAgIHJvd05vcm06ICB7IGJhY2tncm91bmQ6IFwiI2ZmZlwiLCBib3JkZXJMZWZ0OiBcIjNweCBzb2xpZCB0cmFuc3BhcmVudFwiIH0sXG4gICAgcm93SG92ZXI6IHsgYmFja2dyb3VuZDogXCIjZThmMGZlXCIsIGJvcmRlckxlZnQ6IFwiM3B4IHNvbGlkICM0MjY4RjZcIiB9LFxuICAgIGJhZGdlOiAgICAoYWN0aXZlKSA9PiAoe1xuICAgICAgZGlzcGxheTogXCJpbmxpbmUtYmxvY2tcIiwgcGFkZGluZzogXCIycHggMTBweFwiLCBib3JkZXJSYWRpdXM6IFwiMTJweFwiLCBmb250U2l6ZTogXCIwLjc4cmVtXCIsIGZvbnRXZWlnaHQ6IFwiNjAwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBhY3RpdmUgPyBcIiNkY2ZjZTdcIiA6IFwiI2ZlZTJlMlwiLCBjb2xvcjogYWN0aXZlID8gXCIjMTU4MDNkXCIgOiBcIiNiOTFjMWNcIixcbiAgICB9KSxcbiAgICBtc2c6ICh0eXBlKSA9PiAoe1xuICAgICAgcGFkZGluZzogXCIwLjc1cmVtIDFyZW1cIiwgbWFyZ2luQm90dG9tOiBcIjEuMnJlbVwiLCBib3JkZXJSYWRpdXM6IFwiNnB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0eXBlID09PSBcInN1Y2Nlc3NcIiA/IFwiI2YwZmRmNFwiIDogXCIjZmVmMmYyXCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0eXBlID09PSBcInN1Y2Nlc3NcIiA/IFwiI2JiZjdkMFwiIDogXCIjZmVjYWNhXCJ9YCxcbiAgICAgIGNvbG9yOiB0eXBlID09PSBcInN1Y2Nlc3NcIiA/IFwiIzE2NjUzNFwiIDogXCIjOTkxYjFiXCIsIGZvbnRTaXplOiBcIjAuOXJlbVwiLFxuICAgIH0pLFxuICAgIGJ0blNhdmU6IChkaXNhYmxlZCkgPT4gKHtcbiAgICAgIHBhZGRpbmc6IFwiMC42cmVtIDEuNnJlbVwiLCBiYWNrZ3JvdW5kOiBkaXNhYmxlZCA/IFwiI2QxZDVkYlwiIDogXCIjNDI2OEY2XCIsXG4gICAgICBjb2xvcjogXCIjZmZmXCIsIGJvcmRlcjogXCJub25lXCIsIGJvcmRlclJhZGl1czogXCI2cHhcIiwgZm9udFNpemU6IFwiMC45cmVtXCIsIGZvbnRXZWlnaHQ6IFwiNjAwXCIsXG4gICAgICBjdXJzb3I6IGRpc2FibGVkID8gXCJub3QtYWxsb3dlZFwiIDogXCJwb2ludGVyXCIsIHRyYW5zaXRpb246IFwiYmFja2dyb3VuZCAwLjJzXCIsXG4gICAgfSksXG4gICAgc291cmNlOiB7IGZvbnRTaXplOiBcIjAuNzhyZW1cIiwgY29sb3I6IFwiIzljYTNhZlwiLCBkaXNwbGF5OiBcImlubGluZS1ibG9ja1wiLCBtYXJnaW5Ub3A6IFwiMnB4XCIgfSxcbiAgfTtcblxuICBpZiAobG9hZGluZykge1xuICAgIHJldHVybiA8ZGl2IHN0eWxlPXtzdHlsZXMud3JhcH0+PHAgc3R5bGU9e3N0eWxlcy5oaW50fT5DYXJnYW5kbyDDrXRlbXMgZGVsIG1lbsO6Li4uPC9wPjwvZGl2PjtcbiAgfVxuXG4gIGNvbnN0IGhhc1BlbmRpbmcgPSBjaGFuZ2VkSWRzLnNpemUgPiAwO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBzdHlsZT17c3R5bGVzLndyYXB9PlxuICAgICAgPGgyIHN0eWxlPXtzdHlsZXMuaGVhZGluZ30+UmVvcmRlbmFyIE1lbsO6IGRlIE5hdmVnYWNpw7NuPC9oMj5cbiAgICAgIDxwIHN0eWxlPXtzdHlsZXMuaGludH0+XG4gICAgICAgIEFycmFzdHJhIGxhcyBmaWxhcyBwYXJhIGNhbWJpYXIgZWwgb3JkZW4uIExhcyBmaWxhcyBtb2RpZmljYWRhcyBzZSBkZXN0YWNhbiBlbiBhbWFyaWxsby5cbiAgICAgICAgSGF6IGNsaWMgZW4gPHN0cm9uZz5HdWFyZGFyIG9yZGVuPC9zdHJvbmc+IHBhcmEgY29uZmlybWFyIGxvcyBjYW1iaW9zIGVuIGxhIGJhc2UgZGUgZGF0b3MuXG4gICAgICA8L3A+XG5cbiAgICAgIDx0YWJsZSBzdHlsZT17c3R5bGVzLnRhYmxlfT5cbiAgICAgICAgPHRoZWFkPlxuICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgIDx0aCBzdHlsZT17eyAuLi5zdHlsZXMudGgsIHdpZHRoOiBcIjM2cHhcIiB9fT48L3RoPlxuICAgICAgICAgICAgPHRoIHN0eWxlPXtzdHlsZXMudGh9PlBvcy48L3RoPlxuICAgICAgICAgICAgPHRoIHN0eWxlPXtzdHlsZXMudGh9PkV0aXF1ZXRhPC90aD5cbiAgICAgICAgICAgIDx0aCBzdHlsZT17c3R5bGVzLnRofT5VUkw8L3RoPlxuICAgICAgICAgICAgPHRoIHN0eWxlPXtzdHlsZXMudGh9PkVzdGFkbzwvdGg+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgPC90aGVhZD5cbiAgICAgICAgPHRib2R5PlxuICAgICAgICAgIHtpdGVtcy5tYXAoKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpc0NoYW5nZWQgID0gY2hhbmdlZElkcy5oYXMoaXRlbS5pZCk7XG4gICAgICAgICAgICBjb25zdCBpc0RyYWdPdmVyID0gZHJhZ092ZXJJbmRleCA9PT0gaW5kZXg7XG4gICAgICAgICAgICBjb25zdCByb3dTdHlsZSAgID0ge1xuICAgICAgICAgICAgICAuLi5zdHlsZXMucm93QmFzZSxcbiAgICAgICAgICAgICAgLi4uKGlzRHJhZ092ZXIgPyBzdHlsZXMucm93SG92ZXIgOiBpc0NoYW5nZWQgPyBzdHlsZXMucm93Q2hhbmdkIDogc3R5bGVzLnJvd05vcm0pLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPHRyXG4gICAgICAgICAgICAgICAga2V5PXtpdGVtLmlkfVxuICAgICAgICAgICAgICAgIGRyYWdnYWJsZVxuICAgICAgICAgICAgICAgIG9uRHJhZ1N0YXJ0PXsoZSkgPT4gb25EcmFnU3RhcnQoZSwgaW5kZXgpfVxuICAgICAgICAgICAgICAgIG9uRHJhZ092ZXI9eyhlKSA9PiBvbkRyYWdPdmVyKGUsIGluZGV4KX1cbiAgICAgICAgICAgICAgICBvbkRyYWdMZWF2ZT17b25EcmFnTGVhdmV9XG4gICAgICAgICAgICAgICAgb25Ecm9wPXsoZSkgPT4gb25Ecm9wKGUsIGluZGV4KX1cbiAgICAgICAgICAgICAgICBvbkRyYWdFbmQ9e29uRHJhZ0VuZH1cbiAgICAgICAgICAgICAgICBzdHlsZT17cm93U3R5bGV9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8dGQgc3R5bGU9e3N0eWxlcy50ZEhhbmRsZX0gdGl0bGU9XCJBcnJhc3RyYSBwYXJhIHJlb3JkZW5hclwiPuKgvzwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkIHN0eWxlPXt7IC4uLnN0eWxlcy50ZFRleHQsIGNvbG9yOiBcIiM5Y2EzYWZcIiwgZm9udFdlaWdodDogXCI2MDBcIiB9fT57aW5kZXggKyAxfTwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkIHN0eWxlPXtzdHlsZXMudGRUZXh0fT5cbiAgICAgICAgICAgICAgICAgIDxzdHJvbmc+e2l0ZW0ubGFiZWx9PC9zdHJvbmc+XG4gICAgICAgICAgICAgICAgICB7aXRlbS5zb3VyY2Vfc2x1ZyAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXtzdHlsZXMuc291cmNlfT4gwrcgc2luY3Jvbml6YWRvIGRlc2RlIHNlY2Npw7NuPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT17eyAuLi5zdHlsZXMudGRUZXh0LCBjb2xvcjogXCIjNDI2OEY2XCIgfX0+e2l0ZW0udXJsfTwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkIHN0eWxlPXtzdHlsZXMudGRCYWRnZX0+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17c3R5bGVzLmJhZGdlKGl0ZW0uaXNfYWN0aXZlKX0+XG4gICAgICAgICAgICAgICAgICAgIHtpdGVtLmlzX2FjdGl2ZSA/IFwiQWN0aXZvXCIgOiBcIkluYWN0aXZvXCJ9XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvdGJvZHk+XG4gICAgICA8L3RhYmxlPlxuXG4gICAgICB7bWVzc2FnZSAmJiA8ZGl2IHN0eWxlPXtzdHlsZXMubXNnKG1lc3NhZ2UudHlwZSl9PnttZXNzYWdlLnRleHR9PC9kaXY+fVxuXG4gICAgICA8YnV0dG9uXG4gICAgICAgIG9uQ2xpY2s9e2hhbmRsZVNhdmV9XG4gICAgICAgIGRpc2FibGVkPXshaGFzUGVuZGluZyB8fCBzYXZpbmd9XG4gICAgICAgIHN0eWxlPXtzdHlsZXMuYnRuU2F2ZSghaGFzUGVuZGluZyB8fCBzYXZpbmcpfVxuICAgICAgPlxuICAgICAgICB7c2F2aW5nXG4gICAgICAgICAgPyBcIkd1YXJkYW5kby4uLlwiXG4gICAgICAgICAgOiBoYXNQZW5kaW5nXG4gICAgICAgICAgICA/IGBHdWFyZGFyIG9yZGVuICgke2NoYW5nZWRJZHMuc2l6ZX0gY2FtYmlvJHtjaGFuZ2VkSWRzLnNpemUgPiAxID8gXCJzXCIgOiBcIlwifSlgXG4gICAgICAgICAgICA6IFwiU2luIGNhbWJpb3MgcGVuZGllbnRlc1wifVxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBNZW51UmVvcmRlcjtcbiIsImltcG9ydCB7IERyb3Bab25lLCBEcm9wWm9uZUl0ZW0sIEZvcm1Hcm91cCwgTGFiZWwgfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcbmltcG9ydCB7IGZsYXQsIHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnYWRtaW5qcyc7XG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmNvbnN0IEVkaXQgPSAoeyBwcm9wZXJ0eSwgcmVjb3JkLCBvbkNoYW5nZSB9KSA9PiB7XG4gICAgY29uc3QgeyB0cmFuc2xhdGVQcm9wZXJ0eSB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgICBjb25zdCB7IHBhcmFtcyB9ID0gcmVjb3JkO1xuICAgIGNvbnN0IHsgY3VzdG9tIH0gPSBwcm9wZXJ0eTtcbiAgICBjb25zdCBwYXRoID0gZmxhdC5nZXQocGFyYW1zLCBjdXN0b20uZmlsZVBhdGhQcm9wZXJ0eSk7XG4gICAgY29uc3Qga2V5ID0gZmxhdC5nZXQocGFyYW1zLCBjdXN0b20ua2V5UHJvcGVydHkpO1xuICAgIGNvbnN0IGZpbGUgPSBmbGF0LmdldChwYXJhbXMsIGN1c3RvbS5maWxlUHJvcGVydHkpO1xuICAgIGNvbnN0IFtvcmlnaW5hbEtleSwgc2V0T3JpZ2luYWxLZXldID0gdXNlU3RhdGUoa2V5KTtcbiAgICBjb25zdCBbZmlsZXNUb1VwbG9hZCwgc2V0RmlsZXNUb1VwbG9hZF0gPSB1c2VTdGF0ZShbXSk7XG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgLy8gaXQgbWVhbnMgbWVhbnMgdGhhdCBzb21lb25lIGhpdCBzYXZlIGFuZCBuZXcgZmlsZSBoYXMgYmVlbiB1cGxvYWRlZFxuICAgICAgICAvLyBpbiB0aGlzIGNhc2UgZmxpZXNUb1VwbG9hZCBzaG91bGQgYmUgY2xlYXJlZC5cbiAgICAgICAgLy8gVGhpcyBoYXBwZW5zIHdoZW4gdXNlciB0dXJucyBvZmYgcmVkaXJlY3QgYWZ0ZXIgbmV3L2VkaXRcbiAgICAgICAgaWYgKCh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyAmJiBrZXkgIT09IG9yaWdpbmFsS2V5KVxuICAgICAgICAgICAgfHwgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnICYmICFvcmlnaW5hbEtleSlcbiAgICAgICAgICAgIHx8ICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyAmJiBBcnJheS5pc0FycmF5KGtleSkgJiYga2V5Lmxlbmd0aCAhPT0gb3JpZ2luYWxLZXkubGVuZ3RoKSkge1xuICAgICAgICAgICAgc2V0T3JpZ2luYWxLZXkoa2V5KTtcbiAgICAgICAgICAgIHNldEZpbGVzVG9VcGxvYWQoW10pO1xuICAgICAgICB9XG4gICAgfSwgW2tleSwgb3JpZ2luYWxLZXldKTtcbiAgICBjb25zdCBvblVwbG9hZCA9IChmaWxlcykgPT4ge1xuICAgICAgICBzZXRGaWxlc1RvVXBsb2FkKGZpbGVzKTtcbiAgICAgICAgb25DaGFuZ2UoY3VzdG9tLmZpbGVQcm9wZXJ0eSwgZmlsZXMpO1xuICAgIH07XG4gICAgY29uc3QgaGFuZGxlUmVtb3ZlID0gKCkgPT4ge1xuICAgICAgICBvbkNoYW5nZShjdXN0b20uZmlsZVByb3BlcnR5LCBudWxsKTtcbiAgICB9O1xuICAgIGNvbnN0IGhhbmRsZU11bHRpUmVtb3ZlID0gKHNpbmdsZUtleSkgPT4ge1xuICAgICAgICBjb25zdCBpbmRleCA9IChmbGF0LmdldChyZWNvcmQucGFyYW1zLCBjdXN0b20ua2V5UHJvcGVydHkpIHx8IFtdKS5pbmRleE9mKHNpbmdsZUtleSk7XG4gICAgICAgIGNvbnN0IGZpbGVzVG9EZWxldGUgPSBmbGF0LmdldChyZWNvcmQucGFyYW1zLCBjdXN0b20uZmlsZXNUb0RlbGV0ZVByb3BlcnR5KSB8fCBbXTtcbiAgICAgICAgaWYgKHBhdGggJiYgcGF0aC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdQYXRoID0gcGF0aC5tYXAoKGN1cnJlbnRQYXRoLCBpKSA9PiAoaSAhPT0gaW5kZXggPyBjdXJyZW50UGF0aCA6IG51bGwpKTtcbiAgICAgICAgICAgIGxldCBuZXdQYXJhbXMgPSBmbGF0LnNldChyZWNvcmQucGFyYW1zLCBjdXN0b20uZmlsZXNUb0RlbGV0ZVByb3BlcnR5LCBbLi4uZmlsZXNUb0RlbGV0ZSwgaW5kZXhdKTtcbiAgICAgICAgICAgIG5ld1BhcmFtcyA9IGZsYXQuc2V0KG5ld1BhcmFtcywgY3VzdG9tLmZpbGVQYXRoUHJvcGVydHksIG5ld1BhdGgpO1xuICAgICAgICAgICAgb25DaGFuZ2Uoe1xuICAgICAgICAgICAgICAgIC4uLnJlY29yZCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IG5ld1BhcmFtcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdZb3UgY2Fubm90IHJlbW92ZSBmaWxlIHdoZW4gdGhlcmUgYXJlIG5vIHVwbG9hZGVkIGZpbGVzIHlldCcpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoRm9ybUdyb3VwLCBudWxsLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KExhYmVsLCBudWxsLCB0cmFuc2xhdGVQcm9wZXJ0eShwcm9wZXJ0eS5sYWJlbCwgcHJvcGVydHkucmVzb3VyY2VJZCkpLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KERyb3Bab25lLCB7IG9uQ2hhbmdlOiBvblVwbG9hZCwgbXVsdGlwbGU6IGN1c3RvbS5tdWx0aXBsZSwgdmFsaWRhdGU6IHtcbiAgICAgICAgICAgICAgICBtaW1lVHlwZXM6IGN1c3RvbS5taW1lVHlwZXMsXG4gICAgICAgICAgICAgICAgbWF4U2l6ZTogY3VzdG9tLm1heFNpemUsXG4gICAgICAgICAgICB9LCBmaWxlczogZmlsZXNUb1VwbG9hZCB9KSxcbiAgICAgICAgIWN1c3RvbS5tdWx0aXBsZSAmJiBrZXkgJiYgcGF0aCAmJiAhZmlsZXNUb1VwbG9hZC5sZW5ndGggJiYgZmlsZSAhPT0gbnVsbCAmJiAoUmVhY3QuY3JlYXRlRWxlbWVudChEcm9wWm9uZUl0ZW0sIHsgZmlsZW5hbWU6IGtleSwgc3JjOiBwYXRoLCBvblJlbW92ZTogaGFuZGxlUmVtb3ZlIH0pKSxcbiAgICAgICAgY3VzdG9tLm11bHRpcGxlICYmIGtleSAmJiBrZXkubGVuZ3RoICYmIHBhdGggPyAoUmVhY3QuY3JlYXRlRWxlbWVudChSZWFjdC5GcmFnbWVudCwgbnVsbCwga2V5Lm1hcCgoc2luZ2xlS2V5LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgLy8gd2hlbiB3ZSByZW1vdmUgaXRlbXMgd2Ugc2V0IG9ubHkgcGF0aCBpbmRleCB0byBudWxscy5cbiAgICAgICAgICAgIC8vIGtleSBpcyBzdGlsbCB0aGVyZS4gVGhpcyBpcyBiZWNhdXNlXG4gICAgICAgICAgICAvLyB3ZSBoYXZlIHRvIG1haW50YWluIGFsbCB0aGUgaW5kZXhlcy4gU28gaGVyZSB3ZSBzaW1wbHkgZmlsdGVyIG91dCBlbGVtZW50cyB3aGljaFxuICAgICAgICAgICAgLy8gd2VyZSByZW1vdmVkIGFuZCBkaXNwbGF5IG9ubHkgd2hhdCB3YXMgbGVmdFxuICAgICAgICAgICAgY29uc3QgY3VycmVudFBhdGggPSBwYXRoW2luZGV4XTtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50UGF0aCA/IChSZWFjdC5jcmVhdGVFbGVtZW50KERyb3Bab25lSXRlbSwgeyBrZXk6IHNpbmdsZUtleSwgZmlsZW5hbWU6IHNpbmdsZUtleSwgc3JjOiBwYXRoW2luZGV4XSwgb25SZW1vdmU6ICgpID0+IGhhbmRsZU11bHRpUmVtb3ZlKHNpbmdsZUtleSkgfSkpIDogJyc7XG4gICAgICAgIH0pKSkgOiAnJykpO1xufTtcbmV4cG9ydCBkZWZhdWx0IEVkaXQ7XG4iLCJleHBvcnQgY29uc3QgQXVkaW9NaW1lVHlwZXMgPSBbXG4gICAgJ2F1ZGlvL2FhYycsXG4gICAgJ2F1ZGlvL21pZGknLFxuICAgICdhdWRpby94LW1pZGknLFxuICAgICdhdWRpby9tcGVnJyxcbiAgICAnYXVkaW8vb2dnJyxcbiAgICAnYXBwbGljYXRpb24vb2dnJyxcbiAgICAnYXVkaW8vb3B1cycsXG4gICAgJ2F1ZGlvL3dhdicsXG4gICAgJ2F1ZGlvL3dlYm0nLFxuICAgICdhdWRpby8zZ3BwMicsXG5dO1xuZXhwb3J0IGNvbnN0IFZpZGVvTWltZVR5cGVzID0gW1xuICAgICd2aWRlby94LW1zdmlkZW8nLFxuICAgICd2aWRlby9tcGVnJyxcbiAgICAndmlkZW8vb2dnJyxcbiAgICAndmlkZW8vbXAydCcsXG4gICAgJ3ZpZGVvL3dlYm0nLFxuICAgICd2aWRlby8zZ3BwJyxcbiAgICAndmlkZW8vM2dwcDInLFxuXTtcbmV4cG9ydCBjb25zdCBJbWFnZU1pbWVUeXBlcyA9IFtcbiAgICAnaW1hZ2UvYm1wJyxcbiAgICAnaW1hZ2UvZ2lmJyxcbiAgICAnaW1hZ2UvanBlZycsXG4gICAgJ2ltYWdlL3BuZycsXG4gICAgJ2ltYWdlL3N2Zyt4bWwnLFxuICAgICdpbWFnZS92bmQubWljcm9zb2Z0Lmljb24nLFxuICAgICdpbWFnZS90aWZmJyxcbiAgICAnaW1hZ2Uvd2VicCcsXG5dO1xuZXhwb3J0IGNvbnN0IENvbXByZXNzZWRNaW1lVHlwZXMgPSBbXG4gICAgJ2FwcGxpY2F0aW9uL3gtYnppcCcsXG4gICAgJ2FwcGxpY2F0aW9uL3gtYnppcDInLFxuICAgICdhcHBsaWNhdGlvbi9nemlwJyxcbiAgICAnYXBwbGljYXRpb24vamF2YS1hcmNoaXZlJyxcbiAgICAnYXBwbGljYXRpb24veC10YXInLFxuICAgICdhcHBsaWNhdGlvbi96aXAnLFxuICAgICdhcHBsaWNhdGlvbi94LTd6LWNvbXByZXNzZWQnLFxuXTtcbmV4cG9ydCBjb25zdCBEb2N1bWVudE1pbWVUeXBlcyA9IFtcbiAgICAnYXBwbGljYXRpb24veC1hYml3b3JkJyxcbiAgICAnYXBwbGljYXRpb24veC1mcmVlYXJjJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLmFtYXpvbi5lYm9vaycsXG4gICAgJ2FwcGxpY2F0aW9uL21zd29yZCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50JyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm1zLWZvbnRvYmplY3QnLFxuICAgICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnByZXNlbnRhdGlvbicsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuc3ByZWFkc2hlZXQnLFxuICAgICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnRleHQnLFxuICAgICdhcHBsaWNhdGlvbi92bmQubXMtcG93ZXJwb2ludCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC5wcmVzZW50YXRpb24nLFxuICAgICdhcHBsaWNhdGlvbi92bmQucmFyJyxcbiAgICAnYXBwbGljYXRpb24vcnRmJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuc2hlZXQnLFxuXTtcbmV4cG9ydCBjb25zdCBUZXh0TWltZVR5cGVzID0gW1xuICAgICd0ZXh0L2NzcycsXG4gICAgJ3RleHQvY3N2JyxcbiAgICAndGV4dC9odG1sJyxcbiAgICAndGV4dC9jYWxlbmRhcicsXG4gICAgJ3RleHQvamF2YXNjcmlwdCcsXG4gICAgJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICdhcHBsaWNhdGlvbi9sZCtqc29uJyxcbiAgICAndGV4dC9qYXZhc2NyaXB0JyxcbiAgICAndGV4dC9wbGFpbicsXG4gICAgJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcsXG4gICAgJ2FwcGxpY2F0aW9uL3htbCcsXG4gICAgJ3RleHQveG1sJyxcbl07XG5leHBvcnQgY29uc3QgQmluYXJ5RG9jc01pbWVUeXBlcyA9IFtcbiAgICAnYXBwbGljYXRpb24vZXB1Yit6aXAnLFxuICAgICdhcHBsaWNhdGlvbi9wZGYnLFxuXTtcbmV4cG9ydCBjb25zdCBGb250TWltZVR5cGVzID0gW1xuICAgICdmb250L290ZicsXG4gICAgJ2ZvbnQvdHRmJyxcbiAgICAnZm9udC93b2ZmJyxcbiAgICAnZm9udC93b2ZmMicsXG5dO1xuZXhwb3J0IGNvbnN0IE90aGVyTWltZVR5cGVzID0gW1xuICAgICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nLFxuICAgICdhcHBsaWNhdGlvbi94LWNzaCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5hcHBsZS5pbnN0YWxsZXIreG1sJyxcbiAgICAnYXBwbGljYXRpb24veC1odHRwZC1waHAnLFxuICAgICdhcHBsaWNhdGlvbi94LXNoJyxcbiAgICAnYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2gnLFxuICAgICd2bmQudmlzaW8nLFxuICAgICdhcHBsaWNhdGlvbi92bmQubW96aWxsYS54dWwreG1sJyxcbl07XG5leHBvcnQgY29uc3QgTWltZVR5cGVzID0gW1xuICAgIC4uLkF1ZGlvTWltZVR5cGVzLFxuICAgIC4uLlZpZGVvTWltZVR5cGVzLFxuICAgIC4uLkltYWdlTWltZVR5cGVzLFxuICAgIC4uLkNvbXByZXNzZWRNaW1lVHlwZXMsXG4gICAgLi4uRG9jdW1lbnRNaW1lVHlwZXMsXG4gICAgLi4uVGV4dE1pbWVUeXBlcyxcbiAgICAuLi5CaW5hcnlEb2NzTWltZVR5cGVzLFxuICAgIC4uLk90aGVyTWltZVR5cGVzLFxuICAgIC4uLkZvbnRNaW1lVHlwZXMsXG4gICAgLi4uT3RoZXJNaW1lVHlwZXMsXG5dO1xuIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llc1xuaW1wb3J0IHsgQm94LCBCdXR0b24sIEljb24gfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcbmltcG9ydCB7IGZsYXQgfSBmcm9tICdhZG1pbmpzJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBBdWRpb01pbWVUeXBlcywgSW1hZ2VNaW1lVHlwZXMgfSBmcm9tICcuLi90eXBlcy9taW1lLXR5cGVzLnR5cGUuanMnO1xuY29uc3QgU2luZ2xlRmlsZSA9IChwcm9wcykgPT4ge1xuICAgIGNvbnN0IHsgbmFtZSwgcGF0aCwgbWltZVR5cGUsIHdpZHRoIH0gPSBwcm9wcztcbiAgICBpZiAocGF0aCAmJiBwYXRoLmxlbmd0aCkge1xuICAgICAgICBpZiAobWltZVR5cGUgJiYgSW1hZ2VNaW1lVHlwZXMuaW5jbHVkZXMobWltZVR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIiwgeyBzcmM6IHBhdGgsIHN0eWxlOiB7IG1heEhlaWdodDogd2lkdGgsIG1heFdpZHRoOiB3aWR0aCB9LCBhbHQ6IG5hbWUgfSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtaW1lVHlwZSAmJiBBdWRpb01pbWVUeXBlcy5pbmNsdWRlcyhtaW1lVHlwZSkpIHtcbiAgICAgICAgICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChcImF1ZGlvXCIsIHsgY29udHJvbHM6IHRydWUsIHNyYzogcGF0aCB9LFxuICAgICAgICAgICAgICAgIFwiWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdGhlXCIsXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImNvZGVcIiwgbnVsbCwgXCJhdWRpb1wiKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwidHJhY2tcIiwgeyBraW5kOiBcImNhcHRpb25zXCIgfSkpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoQm94LCBudWxsLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJ1dHRvbiwgeyBhczogXCJhXCIsIGhyZWY6IHBhdGgsIG1sOiBcImRlZmF1bHRcIiwgc2l6ZTogXCJzbVwiLCByb3VuZGVkOiB0cnVlLCB0YXJnZXQ6IFwiX2JsYW5rXCIgfSxcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoSWNvbiwgeyBpY29uOiBcIkRvY3VtZW50RG93bmxvYWRcIiwgY29sb3I6IFwid2hpdGVcIiwgbXI6IFwiZGVmYXVsdFwiIH0pLFxuICAgICAgICAgICAgbmFtZSkpKTtcbn07XG5jb25zdCBGaWxlID0gKHsgd2lkdGgsIHJlY29yZCwgcHJvcGVydHkgfSkgPT4ge1xuICAgIGNvbnN0IHsgY3VzdG9tIH0gPSBwcm9wZXJ0eTtcbiAgICBsZXQgcGF0aCA9IGZsYXQuZ2V0KHJlY29yZD8ucGFyYW1zLCBjdXN0b20uZmlsZVBhdGhQcm9wZXJ0eSk7XG4gICAgaWYgKCFwYXRoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBuYW1lID0gZmxhdC5nZXQocmVjb3JkPy5wYXJhbXMsIGN1c3RvbS5maWxlTmFtZVByb3BlcnR5ID8gY3VzdG9tLmZpbGVOYW1lUHJvcGVydHkgOiBjdXN0b20ua2V5UHJvcGVydHkpO1xuICAgIGNvbnN0IG1pbWVUeXBlID0gY3VzdG9tLm1pbWVUeXBlUHJvcGVydHlcbiAgICAgICAgJiYgZmxhdC5nZXQocmVjb3JkPy5wYXJhbXMsIGN1c3RvbS5taW1lVHlwZVByb3BlcnR5KTtcbiAgICBpZiAoIXByb3BlcnR5LmN1c3RvbS5tdWx0aXBsZSkge1xuICAgICAgICBpZiAoY3VzdG9tLm9wdHMgJiYgY3VzdG9tLm9wdHMuYmFzZVVybCkge1xuICAgICAgICAgICAgcGF0aCA9IGAke2N1c3RvbS5vcHRzLmJhc2VVcmx9LyR7bmFtZX1gO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChTaW5nbGVGaWxlLCB7IHBhdGg6IHBhdGgsIG5hbWU6IG5hbWUsIHdpZHRoOiB3aWR0aCwgbWltZVR5cGU6IG1pbWVUeXBlIH0pKTtcbiAgICB9XG4gICAgaWYgKGN1c3RvbS5vcHRzICYmIGN1c3RvbS5vcHRzLmJhc2VVcmwpIHtcbiAgICAgICAgY29uc3QgYmFzZVVybCA9IGN1c3RvbS5vcHRzLmJhc2VVcmwgfHwgJyc7XG4gICAgICAgIHBhdGggPSBwYXRoLm1hcCgoc2luZ2xlUGF0aCwgaW5kZXgpID0+IGAke2Jhc2VVcmx9LyR7bmFtZVtpbmRleF19YCk7XG4gICAgfVxuICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChSZWFjdC5GcmFnbWVudCwgbnVsbCwgcGF0aC5tYXAoKHNpbmdsZVBhdGgsIGluZGV4KSA9PiAoUmVhY3QuY3JlYXRlRWxlbWVudChTaW5nbGVGaWxlLCB7IGtleTogc2luZ2xlUGF0aCwgcGF0aDogc2luZ2xlUGF0aCwgbmFtZTogbmFtZVtpbmRleF0sIHdpZHRoOiB3aWR0aCwgbWltZVR5cGU6IG1pbWVUeXBlW2luZGV4XSB9KSkpKSk7XG59O1xuZXhwb3J0IGRlZmF1bHQgRmlsZTtcbiIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgRmlsZSBmcm9tICcuL2ZpbGUuanMnO1xuY29uc3QgTGlzdCA9IChwcm9wcykgPT4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmlsZSwgeyB3aWR0aDogMTAwLCAuLi5wcm9wcyB9KSk7XG5leHBvcnQgZGVmYXVsdCBMaXN0O1xuIiwiaW1wb3J0IHsgRm9ybUdyb3VwLCBMYWJlbCB9IGZyb20gJ0BhZG1pbmpzL2Rlc2lnbi1zeXN0ZW0nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdhZG1pbmpzJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgRmlsZSBmcm9tICcuL2ZpbGUuanMnO1xuY29uc3QgU2hvdyA9IChwcm9wcykgPT4ge1xuICAgIGNvbnN0IHsgcHJvcGVydHkgfSA9IHByb3BzO1xuICAgIGNvbnN0IHsgdHJhbnNsYXRlUHJvcGVydHkgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KEZvcm1Hcm91cCwgbnVsbCxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChMYWJlbCwgbnVsbCwgdHJhbnNsYXRlUHJvcGVydHkocHJvcGVydHkubGFiZWwsIHByb3BlcnR5LnJlc291cmNlSWQpKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGaWxlLCB7IHdpZHRoOiBcIjEwMCVcIiwgLi4ucHJvcHMgfSkpKTtcbn07XG5leHBvcnQgZGVmYXVsdCBTaG93O1xuIiwiQWRtaW5KUy5Vc2VyQ29tcG9uZW50cyA9IHt9XG5pbXBvcnQgTWVudVJlb3JkZXIgZnJvbSAnLi4vc3JjL2FkbWluL2NvbXBvbmVudHMvTWVudVJlb3JkZXInXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLk1lbnVSZW9yZGVyID0gTWVudVJlb3JkZXJcbmltcG9ydCBVcGxvYWRFZGl0Q29tcG9uZW50IGZyb20gJy4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRFZGl0Q29tcG9uZW50J1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5VcGxvYWRFZGl0Q29tcG9uZW50ID0gVXBsb2FkRWRpdENvbXBvbmVudFxuaW1wb3J0IFVwbG9hZExpc3RDb21wb25lbnQgZnJvbSAnLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS9jb21wb25lbnRzL1VwbG9hZExpc3RDb21wb25lbnQnXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLlVwbG9hZExpc3RDb21wb25lbnQgPSBVcGxvYWRMaXN0Q29tcG9uZW50XG5pbXBvcnQgVXBsb2FkU2hvd0NvbXBvbmVudCBmcm9tICcuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvVXBsb2FkU2hvd0NvbXBvbmVudCdcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuVXBsb2FkU2hvd0NvbXBvbmVudCA9IFVwbG9hZFNob3dDb21wb25lbnQiXSwibmFtZXMiOlsiTWVudVJlb3JkZXIiLCJpdGVtcyIsInNldEl0ZW1zIiwidXNlU3RhdGUiLCJsb2FkaW5nIiwic2V0TG9hZGluZyIsImNoYW5nZWRJZHMiLCJzZXRDaGFuZ2VkSWRzIiwiU2V0Iiwic2F2aW5nIiwic2V0U2F2aW5nIiwibWVzc2FnZSIsInNldE1lc3NhZ2UiLCJkcmFnT3ZlckluZGV4Iiwic2V0RHJhZ092ZXJJbmRleCIsImRyYWdJbmRleCIsInVzZVJlZiIsIm9yaWdpbmFsT3JkZXIiLCJ1c2VFZmZlY3QiLCJmZXRjaCIsInRoZW4iLCJyIiwianNvbiIsImRhdGEiLCJzb3J0ZWQiLCJjdXJyZW50IiwibWFwIiwiaSIsImlkIiwiY2F0Y2giLCJ0eXBlIiwidGV4dCIsIm9uRHJhZ1N0YXJ0IiwiZSIsImluZGV4IiwiZGF0YVRyYW5zZmVyIiwiZWZmZWN0QWxsb3dlZCIsIm9uRHJhZ092ZXIiLCJwcmV2ZW50RGVmYXVsdCIsImRyb3BFZmZlY3QiLCJvbkRyYWdMZWF2ZSIsIm9uRHJvcCIsImRyb3BJbmRleCIsImZyb21JbmRleCIsIm5ld0l0ZW1zIiwibW92ZWQiLCJzcGxpY2UiLCJyZW9yZGVyZWQiLCJpdGVtIiwib3JkZXIiLCJjaGFuZ2VkIiwiZm9yRWFjaCIsImFkZCIsIm9uRHJhZ0VuZCIsImhhbmRsZVNhdmUiLCJyZXMiLCJtZXRob2QiLCJoZWFkZXJzIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJvayIsImxlbmd0aCIsInN0eWxlcyIsIndyYXAiLCJwYWRkaW5nIiwiZm9udEZhbWlseSIsIm1heFdpZHRoIiwiaGVhZGluZyIsImZvbnRTaXplIiwiZm9udFdlaWdodCIsIm1hcmdpbkJvdHRvbSIsImhpbnQiLCJjb2xvciIsInRhYmxlIiwid2lkdGgiLCJib3JkZXJDb2xsYXBzZSIsInRoIiwidGV4dEFsaWduIiwiYmFja2dyb3VuZCIsImJvcmRlckJvdHRvbSIsInRkSGFuZGxlIiwiY3Vyc29yIiwidXNlclNlbGVjdCIsInRkVGV4dCIsInRkQmFkZ2UiLCJyb3dCYXNlIiwidHJhbnNpdGlvbiIsInJvd0NoYW5nZCIsImJvcmRlckxlZnQiLCJyb3dOb3JtIiwicm93SG92ZXIiLCJiYWRnZSIsImFjdGl2ZSIsImRpc3BsYXkiLCJib3JkZXJSYWRpdXMiLCJtc2ciLCJib3JkZXIiLCJidG5TYXZlIiwiZGlzYWJsZWQiLCJzb3VyY2UiLCJtYXJnaW5Ub3AiLCJSZWFjdCIsImNyZWF0ZUVsZW1lbnQiLCJzdHlsZSIsImhhc1BlbmRpbmciLCJzaXplIiwiaXNDaGFuZ2VkIiwiaGFzIiwiaXNEcmFnT3ZlciIsInJvd1N0eWxlIiwia2V5IiwiZHJhZ2dhYmxlIiwidGl0bGUiLCJsYWJlbCIsInNvdXJjZV9zbHVnIiwidXJsIiwiaXNfYWN0aXZlIiwib25DbGljayIsInVzZVRyYW5zbGF0aW9uIiwiZmxhdCIsIkZvcm1Hcm91cCIsIkxhYmVsIiwiRHJvcFpvbmUiLCJEcm9wWm9uZUl0ZW0iLCJCb3giLCJCdXR0b24iLCJJY29uIiwiQWRtaW5KUyIsIlVzZXJDb21wb25lbnRzIiwiVXBsb2FkRWRpdENvbXBvbmVudCIsIlVwbG9hZExpc3RDb21wb25lbnQiLCJVcGxvYWRTaG93Q29tcG9uZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0VBRUE7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQSxNQUFNQSxXQUFXLEdBQUdBLE1BQU07SUFDeEIsTUFBTSxDQUFDQyxLQUFLLEVBQUVDLFFBQVEsQ0FBQyxHQUFHQyxjQUFRLENBQUMsRUFBRSxDQUFDO0lBQ3RDLE1BQU0sQ0FBQ0MsT0FBTyxFQUFFQyxVQUFVLENBQUMsR0FBR0YsY0FBUSxDQUFDLElBQUksQ0FBQztFQUM1QyxFQUFBLE1BQU0sQ0FBQ0csVUFBVSxFQUFFQyxhQUFhLENBQUMsR0FBR0osY0FBUSxDQUFDLElBQUlLLEdBQUcsRUFBRSxDQUFDO0lBQ3ZELE1BQU0sQ0FBQ0MsTUFBTSxFQUFFQyxTQUFTLENBQUMsR0FBR1AsY0FBUSxDQUFDLEtBQUssQ0FBQztJQUMzQyxNQUFNLENBQUNRLE9BQU8sRUFBRUMsVUFBVSxDQUFDLEdBQUdULGNBQVEsQ0FBQyxJQUFJLENBQUM7SUFDNUMsTUFBTSxDQUFDVSxhQUFhLEVBQUVDLGdCQUFnQixDQUFDLEdBQUdYLGNBQVEsQ0FBQyxJQUFJLENBQUM7RUFDeEQsRUFBQSxNQUFNWSxTQUFTLEdBQUdDLFlBQU0sQ0FBQyxJQUFJLENBQUM7O0VBRTlCO0VBQ0EsRUFBQSxNQUFNQyxhQUFhLEdBQUdELFlBQU0sQ0FBQyxFQUFFLENBQUM7RUFFaENFLEVBQUFBLGVBQVMsQ0FBQyxNQUFNO0VBQ2RDLElBQUFBLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUM5QkMsSUFBSSxDQUFFQyxDQUFDLElBQUtBLENBQUMsQ0FBQ0MsSUFBSSxFQUFFLENBQUMsQ0FDckJGLElBQUksQ0FBRUcsSUFBSSxJQUFLO0VBQ2QsTUFBQSxNQUFNQyxNQUFNLEdBQUdELElBQUksQ0FBQ0EsSUFBSSxJQUFJLEVBQUU7UUFDOUJyQixRQUFRLENBQUNzQixNQUFNLENBQUM7RUFDaEJQLE1BQUFBLGFBQWEsQ0FBQ1EsT0FBTyxHQUFHRCxNQUFNLENBQUNFLEdBQUcsQ0FBRUMsQ0FBQyxJQUFLQSxDQUFDLENBQUNDLEVBQUUsQ0FBQztRQUMvQ3ZCLFVBQVUsQ0FBQyxLQUFLLENBQUM7RUFDbkIsSUFBQSxDQUFDLENBQUMsQ0FDRHdCLEtBQUssQ0FBQyxNQUFNO0VBQ1hqQixNQUFBQSxVQUFVLENBQUM7RUFBRWtCLFFBQUFBLElBQUksRUFBRSxPQUFPO0VBQUVDLFFBQUFBLElBQUksRUFBRTtFQUF1QyxPQUFDLENBQUM7UUFDM0UxQixVQUFVLENBQUMsS0FBSyxDQUFDO0VBQ25CLElBQUEsQ0FBQyxDQUFDO0lBQ04sQ0FBQyxFQUFFLEVBQUUsQ0FBQzs7RUFFTjtFQUNBLEVBQUEsTUFBTTJCLFdBQVcsR0FBR0EsQ0FBQ0MsQ0FBQyxFQUFFQyxLQUFLLEtBQUs7TUFDaENuQixTQUFTLENBQUNVLE9BQU8sR0FBR1MsS0FBSztFQUN6QkQsSUFBQUEsQ0FBQyxDQUFDRSxZQUFZLENBQUNDLGFBQWEsR0FBRyxNQUFNO0lBQ3ZDLENBQUM7RUFFRCxFQUFBLE1BQU1DLFVBQVUsR0FBR0EsQ0FBQ0osQ0FBQyxFQUFFQyxLQUFLLEtBQUs7TUFDL0JELENBQUMsQ0FBQ0ssY0FBYyxFQUFFO0VBQ2xCTCxJQUFBQSxDQUFDLENBQUNFLFlBQVksQ0FBQ0ksVUFBVSxHQUFHLE1BQU07TUFDbEN6QixnQkFBZ0IsQ0FBQ29CLEtBQUssQ0FBQztJQUN6QixDQUFDO0lBRUQsTUFBTU0sV0FBVyxHQUFHQSxNQUFNO01BQ3hCMUIsZ0JBQWdCLENBQUMsSUFBSSxDQUFDO0lBQ3hCLENBQUM7RUFFRCxFQUFBLE1BQU0yQixNQUFNLEdBQUdBLENBQUNSLENBQUMsRUFBRVMsU0FBUyxLQUFLO01BQy9CVCxDQUFDLENBQUNLLGNBQWMsRUFBRTtNQUNsQnhCLGdCQUFnQixDQUFDLElBQUksQ0FBQztFQUN0QixJQUFBLE1BQU02QixTQUFTLEdBQUc1QixTQUFTLENBQUNVLE9BQU87RUFDbkMsSUFBQSxJQUFJa0IsU0FBUyxLQUFLLElBQUksSUFBSUEsU0FBUyxLQUFLRCxTQUFTLEVBQUU7RUFFbkQsSUFBQSxNQUFNRSxRQUFRLEdBQUcsQ0FBQyxHQUFHM0MsS0FBSyxDQUFDO01BQzNCLE1BQU0sQ0FBQzRDLEtBQUssQ0FBQyxHQUFHRCxRQUFRLENBQUNFLE1BQU0sQ0FBQ0gsU0FBUyxFQUFFLENBQUMsQ0FBQztNQUM3Q0MsUUFBUSxDQUFDRSxNQUFNLENBQUNKLFNBQVMsRUFBRSxDQUFDLEVBQUVHLEtBQUssQ0FBQzs7RUFFcEM7TUFDQSxNQUFNRSxTQUFTLEdBQUdILFFBQVEsQ0FBQ2xCLEdBQUcsQ0FBQyxDQUFDc0IsSUFBSSxFQUFFckIsQ0FBQyxNQUFNO0VBQUUsTUFBQSxHQUFHcUIsSUFBSTtFQUFFQyxNQUFBQSxLQUFLLEVBQUV0QjtFQUFFLEtBQUMsQ0FBQyxDQUFDOztFQUVwRTtFQUNBLElBQUEsTUFBTXVCLE9BQU8sR0FBRyxJQUFJMUMsR0FBRyxFQUFFO0VBQ3pCdUMsSUFBQUEsU0FBUyxDQUFDSSxPQUFPLENBQUMsQ0FBQ0gsSUFBSSxFQUFFckIsQ0FBQyxLQUFLO0VBQzdCLE1BQUEsSUFBSVYsYUFBYSxDQUFDUSxPQUFPLENBQUNFLENBQUMsQ0FBQyxLQUFLcUIsSUFBSSxDQUFDcEIsRUFBRSxFQUFFc0IsT0FBTyxDQUFDRSxHQUFHLENBQUNKLElBQUksQ0FBQ3BCLEVBQUUsQ0FBQztFQUNoRSxJQUFBLENBQUMsQ0FBQztNQUVGMUIsUUFBUSxDQUFDNkMsU0FBUyxDQUFDO01BQ25CeEMsYUFBYSxDQUFDMkMsT0FBTyxDQUFDO01BQ3RCdEMsVUFBVSxDQUFDLElBQUksQ0FBQztNQUNoQkcsU0FBUyxDQUFDVSxPQUFPLEdBQUcsSUFBSTtJQUMxQixDQUFDO0lBRUQsTUFBTTRCLFNBQVMsR0FBR0EsTUFBTTtNQUN0QnRDLFNBQVMsQ0FBQ1UsT0FBTyxHQUFHLElBQUk7TUFDeEJYLGdCQUFnQixDQUFDLElBQUksQ0FBQztJQUN4QixDQUFDOztFQUVEO0VBQ0EsRUFBQSxNQUFNd0MsVUFBVSxHQUFHLFlBQVk7TUFDN0I1QyxTQUFTLENBQUMsSUFBSSxDQUFDO01BQ2ZFLFVBQVUsQ0FBQyxJQUFJLENBQUM7TUFDaEIsSUFBSTtFQUNGLE1BQUEsTUFBTTJDLEdBQUcsR0FBRyxNQUFNcEMsS0FBSyxDQUFDLDhCQUE4QixFQUFFO0VBQ3REcUMsUUFBQUEsTUFBTSxFQUFFLE9BQU87RUFDZkMsUUFBQUEsT0FBTyxFQUFFO0VBQUUsVUFBQSxjQUFjLEVBQUU7V0FBb0I7RUFDL0NDLFFBQUFBLElBQUksRUFBRUMsSUFBSSxDQUFDQyxTQUFTLENBQUM7RUFBRTNELFVBQUFBLEtBQUssRUFBRUEsS0FBSyxDQUFDeUIsR0FBRyxDQUFDLENBQUM7Y0FBRUUsRUFBRTtFQUFFcUIsWUFBQUE7RUFBTSxXQUFDLE1BQU07Y0FBRXJCLEVBQUU7RUFBRXFCLFlBQUFBO0VBQU0sV0FBQyxDQUFDO1dBQUc7RUFDL0UsT0FBQyxDQUFDO1FBQ0YsSUFBSU0sR0FBRyxDQUFDTSxFQUFFLEVBQUU7RUFDVjVDLFFBQUFBLGFBQWEsQ0FBQ1EsT0FBTyxHQUFHeEIsS0FBSyxDQUFDeUIsR0FBRyxDQUFFQyxDQUFDLElBQUtBLENBQUMsQ0FBQ0MsRUFBRSxDQUFDO0VBQzlDckIsUUFBQUEsYUFBYSxDQUFDLElBQUlDLEdBQUcsRUFBRSxDQUFDO0VBQ3hCSSxRQUFBQSxVQUFVLENBQUM7RUFBRWtCLFVBQUFBLElBQUksRUFBRSxTQUFTO0VBQUVDLFVBQUFBLElBQUksRUFBRSxDQUFBLGtCQUFBLEVBQXFCOUIsS0FBSyxDQUFDNkQsTUFBTSxDQUFBLG9CQUFBO0VBQXVCLFNBQUMsQ0FBQztFQUNoRyxNQUFBLENBQUMsTUFBTTtFQUNMbEQsUUFBQUEsVUFBVSxDQUFDO0VBQUVrQixVQUFBQSxJQUFJLEVBQUUsT0FBTztFQUFFQyxVQUFBQSxJQUFJLEVBQUU7RUFBd0MsU0FBQyxDQUFDO0VBQzlFLE1BQUE7RUFDRixJQUFBLENBQUMsQ0FBQyxNQUFNO0VBQ05uQixNQUFBQSxVQUFVLENBQUM7RUFBRWtCLFFBQUFBLElBQUksRUFBRSxPQUFPO0VBQUVDLFFBQUFBLElBQUksRUFBRTtFQUF1QyxPQUFDLENBQUM7RUFDN0UsSUFBQTtNQUNBckIsU0FBUyxDQUFDLEtBQUssQ0FBQztJQUNsQixDQUFDOztFQUVEO0VBQ0EsRUFBQSxNQUFNcUQsTUFBTSxHQUFHO0VBQ2JDLElBQUFBLElBQUksRUFBTTtFQUFFQyxNQUFBQSxPQUFPLEVBQUUsTUFBTTtFQUFFQyxNQUFBQSxVQUFVLEVBQUUsWUFBWTtFQUFFQyxNQUFBQSxRQUFRLEVBQUU7T0FBUztFQUMxRUMsSUFBQUEsT0FBTyxFQUFHO0VBQUVDLE1BQUFBLFFBQVEsRUFBRSxRQUFRO0VBQUVDLE1BQUFBLFVBQVUsRUFBRSxLQUFLO0VBQUVDLE1BQUFBLFlBQVksRUFBRTtPQUFVO0VBQzNFQyxJQUFBQSxJQUFJLEVBQU07RUFBRUMsTUFBQUEsS0FBSyxFQUFFLE1BQU07RUFBRUosTUFBQUEsUUFBUSxFQUFFLFVBQVU7RUFBRUUsTUFBQUEsWUFBWSxFQUFFO09BQVU7RUFDekVHLElBQUFBLEtBQUssRUFBSztFQUFFQyxNQUFBQSxLQUFLLEVBQUUsTUFBTTtFQUFFQyxNQUFBQSxjQUFjLEVBQUUsVUFBVTtFQUFFTCxNQUFBQSxZQUFZLEVBQUU7T0FBVTtFQUMvRU0sSUFBQUEsRUFBRSxFQUFRO0VBQUVaLE1BQUFBLE9BQU8sRUFBRSxXQUFXO0VBQUVhLE1BQUFBLFNBQVMsRUFBRSxNQUFNO0VBQUVDLE1BQUFBLFVBQVUsRUFBRSxTQUFTO0VBQUVULE1BQUFBLFVBQVUsRUFBRSxLQUFLO0VBQUVELE1BQUFBLFFBQVEsRUFBRSxTQUFTO0VBQUVJLE1BQUFBLEtBQUssRUFBRSxNQUFNO0VBQUVPLE1BQUFBLFlBQVksRUFBRTtPQUFxQjtFQUN0S0MsSUFBQUEsUUFBUSxFQUFFO0VBQUVoQixNQUFBQSxPQUFPLEVBQUUsV0FBVztFQUFFUSxNQUFBQSxLQUFLLEVBQUUsTUFBTTtFQUFFSixNQUFBQSxRQUFRLEVBQUUsUUFBUTtFQUFFYSxNQUFBQSxNQUFNLEVBQUUsTUFBTTtFQUFFQyxNQUFBQSxVQUFVLEVBQUU7T0FBUTtFQUN6R0MsSUFBQUEsTUFBTSxFQUFJO0VBQUVuQixNQUFBQSxPQUFPLEVBQUUsV0FBVztFQUFFSSxNQUFBQSxRQUFRLEVBQUU7T0FBVTtFQUN0RGdCLElBQUFBLE9BQU8sRUFBRztFQUFFcEIsTUFBQUEsT0FBTyxFQUFFLFdBQVc7RUFBRWEsTUFBQUEsU0FBUyxFQUFFO09BQVU7RUFDdkRRLElBQUFBLE9BQU8sRUFBRztFQUFFTixNQUFBQSxZQUFZLEVBQUUsbUJBQW1CO0VBQUVPLE1BQUFBLFVBQVUsRUFBRTtPQUF5QjtFQUNwRkMsSUFBQUEsU0FBUyxFQUFDO0VBQUVULE1BQUFBLFVBQVUsRUFBRSxTQUFTO0VBQUVVLE1BQUFBLFVBQVUsRUFBRTtPQUFxQjtFQUNwRUMsSUFBQUEsT0FBTyxFQUFHO0VBQUVYLE1BQUFBLFVBQVUsRUFBRSxNQUFNO0VBQUVVLE1BQUFBLFVBQVUsRUFBRTtPQUF5QjtFQUNyRUUsSUFBQUEsUUFBUSxFQUFFO0VBQUVaLE1BQUFBLFVBQVUsRUFBRSxTQUFTO0VBQUVVLE1BQUFBLFVBQVUsRUFBRTtPQUFxQjtNQUNwRUcsS0FBSyxFQUFNQyxNQUFNLEtBQU07RUFDckJDLE1BQUFBLE9BQU8sRUFBRSxjQUFjO0VBQUU3QixNQUFBQSxPQUFPLEVBQUUsVUFBVTtFQUFFOEIsTUFBQUEsWUFBWSxFQUFFLE1BQU07RUFBRTFCLE1BQUFBLFFBQVEsRUFBRSxTQUFTO0VBQUVDLE1BQUFBLFVBQVUsRUFBRSxLQUFLO0VBQzFHUyxNQUFBQSxVQUFVLEVBQUVjLE1BQU0sR0FBRyxTQUFTLEdBQUcsU0FBUztFQUFFcEIsTUFBQUEsS0FBSyxFQUFFb0IsTUFBTSxHQUFHLFNBQVMsR0FBRztFQUMxRSxLQUFDLENBQUM7TUFDRkcsR0FBRyxFQUFHbEUsSUFBSSxLQUFNO0VBQ2RtQyxNQUFBQSxPQUFPLEVBQUUsY0FBYztFQUFFTSxNQUFBQSxZQUFZLEVBQUUsUUFBUTtFQUFFd0IsTUFBQUEsWUFBWSxFQUFFLEtBQUs7RUFDcEVoQixNQUFBQSxVQUFVLEVBQUVqRCxJQUFJLEtBQUssU0FBUyxHQUFHLFNBQVMsR0FBRyxTQUFTO1FBQ3REbUUsTUFBTSxFQUFFLGFBQWFuRSxJQUFJLEtBQUssU0FBUyxHQUFHLFNBQVMsR0FBRyxTQUFTLENBQUEsQ0FBRTtFQUNqRTJDLE1BQUFBLEtBQUssRUFBRTNDLElBQUksS0FBSyxTQUFTLEdBQUcsU0FBUyxHQUFHLFNBQVM7RUFBRXVDLE1BQUFBLFFBQVEsRUFBRTtFQUMvRCxLQUFDLENBQUM7TUFDRjZCLE9BQU8sRUFBR0MsUUFBUSxLQUFNO0VBQ3RCbEMsTUFBQUEsT0FBTyxFQUFFLGVBQWU7RUFBRWMsTUFBQUEsVUFBVSxFQUFFb0IsUUFBUSxHQUFHLFNBQVMsR0FBRyxTQUFTO0VBQ3RFMUIsTUFBQUEsS0FBSyxFQUFFLE1BQU07RUFBRXdCLE1BQUFBLE1BQU0sRUFBRSxNQUFNO0VBQUVGLE1BQUFBLFlBQVksRUFBRSxLQUFLO0VBQUUxQixNQUFBQSxRQUFRLEVBQUUsUUFBUTtFQUFFQyxNQUFBQSxVQUFVLEVBQUUsS0FBSztFQUN6RlksTUFBQUEsTUFBTSxFQUFFaUIsUUFBUSxHQUFHLGFBQWEsR0FBRyxTQUFTO0VBQUVaLE1BQUFBLFVBQVUsRUFBRTtFQUM1RCxLQUFDLENBQUM7RUFDRmEsSUFBQUEsTUFBTSxFQUFFO0VBQUUvQixNQUFBQSxRQUFRLEVBQUUsU0FBUztFQUFFSSxNQUFBQSxLQUFLLEVBQUUsU0FBUztFQUFFcUIsTUFBQUEsT0FBTyxFQUFFLGNBQWM7RUFBRU8sTUFBQUEsU0FBUyxFQUFFO0VBQU07S0FDNUY7RUFFRCxFQUFBLElBQUlqRyxPQUFPLEVBQUU7TUFDWCxvQkFBT2tHLHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxLQUFBLEVBQUE7UUFBS0MsS0FBSyxFQUFFekMsTUFBTSxDQUFDQztPQUFLLGVBQUNzQyxzQkFBQSxDQUFBQyxhQUFBLENBQUEsR0FBQSxFQUFBO1FBQUdDLEtBQUssRUFBRXpDLE1BQU0sQ0FBQ1M7T0FBSyxFQUFDLGtDQUE2QixDQUFNLENBQUM7RUFDN0YsRUFBQTtFQUVBLEVBQUEsTUFBTWlDLFVBQVUsR0FBR25HLFVBQVUsQ0FBQ29HLElBQUksR0FBRyxDQUFDO0lBRXRDLG9CQUNFSixzQkFBQSxDQUFBQyxhQUFBLENBQUEsS0FBQSxFQUFBO01BQUtDLEtBQUssRUFBRXpDLE1BQU0sQ0FBQ0M7S0FBSyxlQUN0QnNDLHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxJQUFBLEVBQUE7TUFBSUMsS0FBSyxFQUFFekMsTUFBTSxDQUFDSztFQUFRLEdBQUEsRUFBQyxvQ0FBZ0MsQ0FBQyxlQUM1RGtDLHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxHQUFBLEVBQUE7TUFBR0MsS0FBSyxFQUFFekMsTUFBTSxDQUFDUztFQUFLLEdBQUEsRUFBQyx1R0FFVCxlQUFBOEIsc0JBQUEsQ0FBQUMsYUFBQSxDQUFBLFFBQUEsRUFBQSxJQUFBLEVBQVEsZUFBcUIsQ0FBQyxFQUFBLGtEQUN6QyxDQUFDLGVBRUpELHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxPQUFBLEVBQUE7TUFBT0MsS0FBSyxFQUFFekMsTUFBTSxDQUFDVztLQUFNLGVBQ3pCNEIsc0JBQUEsQ0FBQUMsYUFBQSxDQUFBLE9BQUEsRUFBQSxJQUFBLGVBQ0VELHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxJQUFBLEVBQUEsSUFBQSxlQUNFRCxzQkFBQSxDQUFBQyxhQUFBLENBQUEsSUFBQSxFQUFBO0VBQUlDLElBQUFBLEtBQUssRUFBRTtRQUFFLEdBQUd6QyxNQUFNLENBQUNjLEVBQUU7RUFBRUYsTUFBQUEsS0FBSyxFQUFFO0VBQU87RUFBRSxHQUFLLENBQUMsZUFDakQyQixzQkFBQSxDQUFBQyxhQUFBLENBQUEsSUFBQSxFQUFBO01BQUlDLEtBQUssRUFBRXpDLE1BQU0sQ0FBQ2M7RUFBRyxHQUFBLEVBQUMsTUFBUSxDQUFDLGVBQy9CeUIsc0JBQUEsQ0FBQUMsYUFBQSxDQUFBLElBQUEsRUFBQTtNQUFJQyxLQUFLLEVBQUV6QyxNQUFNLENBQUNjO0VBQUcsR0FBQSxFQUFDLFVBQVksQ0FBQyxlQUNuQ3lCLHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxJQUFBLEVBQUE7TUFBSUMsS0FBSyxFQUFFekMsTUFBTSxDQUFDYztFQUFHLEdBQUEsRUFBQyxLQUFPLENBQUMsZUFDOUJ5QixzQkFBQSxDQUFBQyxhQUFBLENBQUEsSUFBQSxFQUFBO01BQUlDLEtBQUssRUFBRXpDLE1BQU0sQ0FBQ2M7RUFBRyxHQUFBLEVBQUMsUUFBVSxDQUM5QixDQUNDLENBQUMsZUFDUnlCLHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxPQUFBLEVBQUEsSUFBQSxFQUNHdEcsS0FBSyxDQUFDeUIsR0FBRyxDQUFDLENBQUNzQixJQUFJLEVBQUVkLEtBQUssS0FBSztNQUMxQixNQUFNeUUsU0FBUyxHQUFJckcsVUFBVSxDQUFDc0csR0FBRyxDQUFDNUQsSUFBSSxDQUFDcEIsRUFBRSxDQUFDO0VBQzFDLElBQUEsTUFBTWlGLFVBQVUsR0FBR2hHLGFBQWEsS0FBS3FCLEtBQUs7RUFDMUMsSUFBQSxNQUFNNEUsUUFBUSxHQUFLO1FBQ2pCLEdBQUcvQyxNQUFNLENBQUN1QixPQUFPO0VBQ2pCLE1BQUEsSUFBSXVCLFVBQVUsR0FBRzlDLE1BQU0sQ0FBQzRCLFFBQVEsR0FBR2dCLFNBQVMsR0FBRzVDLE1BQU0sQ0FBQ3lCLFNBQVMsR0FBR3pCLE1BQU0sQ0FBQzJCLE9BQU87T0FDakY7TUFFRCxvQkFDRVksc0JBQUEsQ0FBQUMsYUFBQSxDQUFBLElBQUEsRUFBQTtRQUNFUSxHQUFHLEVBQUUvRCxJQUFJLENBQUNwQixFQUFHO1FBQ2JvRixTQUFTLEVBQUEsSUFBQTtRQUNUaEYsV0FBVyxFQUFHQyxDQUFDLElBQUtELFdBQVcsQ0FBQ0MsQ0FBQyxFQUFFQyxLQUFLLENBQUU7UUFDMUNHLFVBQVUsRUFBR0osQ0FBQyxJQUFLSSxVQUFVLENBQUNKLENBQUMsRUFBRUMsS0FBSyxDQUFFO0VBQ3hDTSxNQUFBQSxXQUFXLEVBQUVBLFdBQVk7UUFDekJDLE1BQU0sRUFBR1IsQ0FBQyxJQUFLUSxNQUFNLENBQUNSLENBQUMsRUFBRUMsS0FBSyxDQUFFO0VBQ2hDbUIsTUFBQUEsU0FBUyxFQUFFQSxTQUFVO0VBQ3JCbUQsTUFBQUEsS0FBSyxFQUFFTTtPQUFTLGVBRWhCUixzQkFBQSxDQUFBQyxhQUFBLENBQUEsSUFBQSxFQUFBO1FBQUlDLEtBQUssRUFBRXpDLE1BQU0sQ0FBQ2tCLFFBQVM7RUFBQ2dDLE1BQUFBLEtBQUssRUFBQztFQUF5QixLQUFBLEVBQUMsUUFBSyxDQUFDLGVBQ2xFWCxzQkFBQSxDQUFBQyxhQUFBLENBQUEsSUFBQSxFQUFBO0VBQUlDLE1BQUFBLEtBQUssRUFBRTtVQUFFLEdBQUd6QyxNQUFNLENBQUNxQixNQUFNO0VBQUVYLFFBQUFBLEtBQUssRUFBRSxTQUFTO0VBQUVILFFBQUFBLFVBQVUsRUFBRTtFQUFNO0VBQUUsS0FBQSxFQUFFcEMsS0FBSyxHQUFHLENBQU0sQ0FBQyxlQUN0Rm9FLHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxJQUFBLEVBQUE7UUFBSUMsS0FBSyxFQUFFekMsTUFBTSxDQUFDcUI7RUFBTyxLQUFBLGVBQ3ZCa0Isc0JBQUEsQ0FBQUMsYUFBQSxDQUFBLFFBQUEsRUFBQSxJQUFBLEVBQVN2RCxJQUFJLENBQUNrRSxLQUFjLENBQUMsRUFDNUJsRSxJQUFJLENBQUNtRSxXQUFXLGlCQUNmYixzQkFBQSxDQUFBQyxhQUFBLENBQUEsTUFBQSxFQUFBO1FBQU1DLEtBQUssRUFBRXpDLE1BQU0sQ0FBQ3FDO0VBQU8sS0FBQSxFQUFDLHFDQUFtQyxDQUUvRCxDQUFDLGVBQ0xFLHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxJQUFBLEVBQUE7RUFBSUMsTUFBQUEsS0FBSyxFQUFFO1VBQUUsR0FBR3pDLE1BQU0sQ0FBQ3FCLE1BQU07RUFBRVgsUUFBQUEsS0FBSyxFQUFFO0VBQVU7RUFBRSxLQUFBLEVBQUV6QixJQUFJLENBQUNvRSxHQUFRLENBQUMsZUFDbEVkLHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxJQUFBLEVBQUE7UUFBSUMsS0FBSyxFQUFFekMsTUFBTSxDQUFDc0I7T0FBUSxlQUN4QmlCLHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxNQUFBLEVBQUE7RUFBTUMsTUFBQUEsS0FBSyxFQUFFekMsTUFBTSxDQUFDNkIsS0FBSyxDQUFDNUMsSUFBSSxDQUFDcUUsU0FBUztPQUFFLEVBQ3ZDckUsSUFBSSxDQUFDcUUsU0FBUyxHQUFHLFFBQVEsR0FBRyxVQUN6QixDQUNKLENBQ0YsQ0FBQztJQUVULENBQUMsQ0FDSSxDQUNGLENBQUMsRUFFUDFHLE9BQU8saUJBQUkyRixzQkFBQSxDQUFBQyxhQUFBLENBQUEsS0FBQSxFQUFBO0VBQUtDLElBQUFBLEtBQUssRUFBRXpDLE1BQU0sQ0FBQ2lDLEdBQUcsQ0FBQ3JGLE9BQU8sQ0FBQ21CLElBQUk7RUFBRSxHQUFBLEVBQUVuQixPQUFPLENBQUNvQixJQUFVLENBQUMsZUFFdEV1RSxzQkFBQSxDQUFBQyxhQUFBLENBQUEsUUFBQSxFQUFBO0VBQ0VlLElBQUFBLE9BQU8sRUFBRWhFLFVBQVc7RUFDcEI2QyxJQUFBQSxRQUFRLEVBQUUsQ0FBQ00sVUFBVSxJQUFJaEcsTUFBTztNQUNoQytGLEtBQUssRUFBRXpDLE1BQU0sQ0FBQ21DLE9BQU8sQ0FBQyxDQUFDTyxVQUFVLElBQUloRyxNQUFNO0tBQUUsRUFFNUNBLE1BQU0sR0FDSCxjQUFjLEdBQ2RnRyxVQUFVLEdBQ1IsQ0FBQSxlQUFBLEVBQWtCbkcsVUFBVSxDQUFDb0csSUFBSSxDQUFBLE9BQUEsRUFBVXBHLFVBQVUsQ0FBQ29HLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQSxDQUFBLENBQUcsR0FDNUUsd0JBQ0EsQ0FDTCxDQUFDO0VBRVYsQ0FBQzs7RUNyTkQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUs7RUFDakQsSUFBSSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsR0FBR2Esc0JBQWMsRUFBRTtFQUNsRCxJQUFJLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNO0VBQzdCLElBQUksTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLFFBQVE7RUFDL0IsSUFBSSxNQUFNLElBQUksR0FBR0MsWUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0VBQzFELElBQUksTUFBTSxHQUFHLEdBQUdBLFlBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUM7RUFDcEQsSUFBSSxNQUFNLElBQUksR0FBR0EsWUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQztFQUN0RCxJQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLEdBQUdySCxjQUFRLENBQUMsR0FBRyxDQUFDO0VBQ3ZELElBQUksTUFBTSxDQUFDLGFBQWEsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHQSxjQUFRLENBQUMsRUFBRSxDQUFDO0VBQzFELElBQUllLGVBQVMsQ0FBQyxNQUFNO0VBQ3BCO0VBQ0E7RUFDQTtFQUNBLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLEtBQUssV0FBVztFQUMzRCxnQkFBZ0IsT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLENBQUMsV0FBVztFQUN2RCxnQkFBZ0IsT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxXQUFXLENBQUMsTUFBTSxDQUFDLEVBQUU7RUFDckcsWUFBWSxjQUFjLENBQUMsR0FBRyxDQUFDO0VBQy9CLFlBQVksZ0JBQWdCLENBQUMsRUFBRSxDQUFDO0VBQ2hDLFFBQVE7RUFDUixJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztFQUMxQixJQUFJLE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBSyxLQUFLO0VBQ2hDLFFBQVEsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO0VBQy9CLFFBQVEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDO0VBQzVDLElBQUksQ0FBQztFQUNMLElBQUksTUFBTSxZQUFZLEdBQUcsTUFBTTtFQUMvQixRQUFRLFFBQVEsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQztFQUMzQyxJQUFJLENBQUM7RUFDTCxJQUFJLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxTQUFTLEtBQUs7RUFDN0MsUUFBUSxNQUFNLEtBQUssR0FBRyxDQUFDc0csWUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQztFQUM1RixRQUFRLE1BQU0sYUFBYSxHQUFHQSxZQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRTtFQUN6RixRQUFRLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0VBQ3JDLFlBQVksTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEtBQUssR0FBRyxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUM7RUFDNUYsWUFBWSxJQUFJLFNBQVMsR0FBR0EsWUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLEdBQUcsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0VBQzVHLFlBQVksU0FBUyxHQUFHQSxZQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDO0VBQzdFLFlBQVksUUFBUSxDQUFDO0VBQ3JCLGdCQUFnQixHQUFHLE1BQU07RUFDekIsZ0JBQWdCLE1BQU0sRUFBRSxTQUFTO0VBQ2pDLGFBQWEsQ0FBQztFQUNkLFFBQVE7RUFDUixhQUFhO0VBQ2I7RUFDQSxZQUFZLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkRBQTZELENBQUM7RUFDdEYsUUFBUTtFQUNSLElBQUksQ0FBQztFQUNMLElBQUksUUFBUWxCLHNCQUFLLENBQUMsYUFBYSxDQUFDbUIsc0JBQVMsRUFBRSxJQUFJO0VBQy9DLFFBQVFuQixzQkFBSyxDQUFDLGFBQWEsQ0FBQ29CLGtCQUFLLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0VBQ2hHLFFBQVFwQixzQkFBSyxDQUFDLGFBQWEsQ0FBQ3FCLHFCQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRTtFQUNqRyxnQkFBZ0IsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO0VBQzNDLGdCQUFnQixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87RUFDdkMsYUFBYSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsQ0FBQztFQUN0QyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLckIsc0JBQUssQ0FBQyxhQUFhLENBQUNzQix5QkFBWSxFQUFFLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO0VBQzlLLFFBQVEsTUFBTSxDQUFDLFFBQVEsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSSxJQUFJLElBQUl0QixzQkFBSyxDQUFDLGFBQWEsQ0FBQ0Esc0JBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxLQUFLO0VBQ2hJO0VBQ0E7RUFDQTtFQUNBO0VBQ0EsWUFBWSxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0VBQzNDLFlBQVksT0FBTyxXQUFXLElBQUlBLHNCQUFLLENBQUMsYUFBYSxDQUFDc0IseUJBQVksRUFBRSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO0VBQ2xMLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7RUFDbEIsQ0FBQzs7RUM5RE0sTUFBTSxjQUFjLEdBQUc7RUFDOUIsSUFBSSxXQUFXO0VBQ2YsSUFBSSxZQUFZO0VBQ2hCLElBQUksY0FBYztFQUNsQixJQUFJLFlBQVk7RUFDaEIsSUFBSSxXQUFXO0VBQ2YsSUFBSSxpQkFBaUI7RUFDckIsSUFBSSxZQUFZO0VBQ2hCLElBQUksV0FBVztFQUNmLElBQUksWUFBWTtFQUNoQixJQUFJLGFBQWE7RUFDakIsQ0FBQztFQVVNLE1BQU0sY0FBYyxHQUFHO0VBQzlCLElBQUksV0FBVztFQUNmLElBQUksV0FBVztFQUNmLElBQUksWUFBWTtFQUNoQixJQUFJLFdBQVc7RUFDZixJQUFJLGVBQWU7RUFDbkIsSUFBSSwwQkFBMEI7RUFDOUIsSUFBSSxZQUFZO0VBQ2hCLElBQUksWUFBWTtFQUNoQixDQUFDOztFQzlCRDtFQUtBLE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBSyxLQUFLO0VBQzlCLElBQUksTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxHQUFHLEtBQUs7RUFDakQsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0VBQzdCLFFBQVEsSUFBSSxRQUFRLElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtFQUMzRCxZQUFZLFFBQVF0QixzQkFBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztFQUN0SCxRQUFRO0VBQ1IsUUFBUSxJQUFJLFFBQVEsSUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0VBQzNELFlBQVksUUFBUUEsc0JBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFO0VBQzlFLGdCQUFnQixtQ0FBbUM7RUFDbkQsZ0JBQWdCQSxzQkFBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQztFQUMxRCxnQkFBZ0JBLHNCQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO0VBQ25FLFFBQVE7RUFDUixJQUFJO0VBQ0osSUFBSSxRQUFRQSxzQkFBSyxDQUFDLGFBQWEsQ0FBQ3VCLGdCQUFHLEVBQUUsSUFBSTtFQUN6QyxRQUFRdkIsc0JBQUssQ0FBQyxhQUFhLENBQUN3QixtQkFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUU7RUFDdkgsWUFBWXhCLHNCQUFLLENBQUMsYUFBYSxDQUFDeUIsaUJBQUksRUFBRSxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQztFQUNsRyxZQUFZLElBQUksQ0FBQyxDQUFDO0VBQ2xCLENBQUM7RUFDRCxNQUFNLElBQUksR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSztFQUM5QyxJQUFJLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxRQUFRO0VBQy9CLElBQUksSUFBSSxJQUFJLEdBQUdQLFlBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7RUFDaEUsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO0VBQ2YsUUFBUSxPQUFPLElBQUk7RUFDbkIsSUFBSTtFQUNKLElBQUksTUFBTSxJQUFJLEdBQUdBLFlBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7RUFDakgsSUFBSSxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUM7RUFDNUIsV0FBV0EsWUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztFQUM1RCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtFQUNuQyxRQUFRLElBQUksTUFBTSxDQUFDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtFQUNoRCxZQUFZLElBQUksR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0VBQ25ELFFBQVE7RUFDUixRQUFRLFFBQVFsQixzQkFBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLENBQUM7RUFDN0csSUFBSTtFQUNKLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO0VBQzVDLFFBQVEsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksRUFBRTtFQUNqRCxRQUFRLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLEtBQUssS0FBSyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzNFLElBQUk7RUFDSixJQUFJLFFBQVFBLHNCQUFLLENBQUMsYUFBYSxDQUFDQSxzQkFBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxLQUFLLE1BQU1BLHNCQUFLLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzVOLENBQUM7O0VDekNELE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxNQUFNQSxzQkFBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQzs7RUNFN0UsTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUs7RUFDeEIsSUFBSSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsS0FBSztFQUM5QixJQUFJLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxHQUFHaUIsc0JBQWMsRUFBRTtFQUNsRCxJQUFJLFFBQVFqQixzQkFBSyxDQUFDLGFBQWEsQ0FBQ21CLHNCQUFTLEVBQUUsSUFBSTtFQUMvQyxRQUFRbkIsc0JBQUssQ0FBQyxhQUFhLENBQUNvQixrQkFBSyxFQUFFLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztFQUNoRyxRQUFRcEIsc0JBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUM7RUFDL0QsQ0FBQzs7RUNWRDBCLE9BQU8sQ0FBQ0MsY0FBYyxHQUFHLEVBQUU7RUFFM0JELE9BQU8sQ0FBQ0MsY0FBYyxDQUFDakksV0FBVyxHQUFHQSxXQUFXO0VBRWhEZ0ksT0FBTyxDQUFDQyxjQUFjLENBQUNDLG1CQUFtQixHQUFHQSxJQUFtQjtFQUVoRUYsT0FBTyxDQUFDQyxjQUFjLENBQUNFLG1CQUFtQixHQUFHQSxJQUFtQjtFQUVoRUgsT0FBTyxDQUFDQyxjQUFjLENBQUNHLG1CQUFtQixHQUFHQSxJQUFtQjs7Ozs7OyIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlsxLDIsMyw0LDVdfQ==
