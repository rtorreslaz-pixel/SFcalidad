/* @ds-bundle: {"format":4,"namespace":"ControlDeCalidadAvColaDesignSystem_515b76","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"KpiCard","sourcePath":"components/core/KpiCard.jsx"},{"name":"StatusDot","sourcePath":"components/core/StatusDot.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"EmptyState","sourcePath":"components/data/EmptyState.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"AppHeader","sourcePath":"components/navigation/AppHeader.jsx"},{"name":"NavTabs","sourcePath":"components/navigation/NavTabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"0f7d4aa0052d","components/core/Button.jsx":"9c1d2c52b2bc","components/core/Card.jsx":"e9a6d95d8923","components/core/KpiCard.jsx":"ec60ad588f34","components/core/StatusDot.jsx":"641a6da2bdda","components/data/DataTable.jsx":"8254de574a66","components/data/EmptyState.jsx":"90109734ad05","components/feedback/Alert.jsx":"ac623889131e","components/forms/Checkbox.jsx":"13dd9804ea42","components/forms/Field.jsx":"151aad5d4fe3","components/forms/Input.jsx":"c78acee5df70","components/forms/SegmentedControl.jsx":"16dd395ad360","components/forms/Select.jsx":"6bc65125948e","components/forms/Switch.jsx":"75d8e8154dbf","components/navigation/AppHeader.jsx":"4d2e10b070e7","components/navigation/NavTabs.jsx":"87ea8e5bb8ad","design_handoff_calidad_lima/calidad-controls.jsx":"c163da58ecc5","design_handoff_calidad_lima/calidad-lima.jsx":"db62278b9ea2","ui_kits/calidad-lima/CalidadControls.jsx":"c163da58ecc5","ui_kits/calidad-lima/CalidadLima.jsx":"db62278b9ea2","ui_kits/calidad-lima/tweaks-panel.jsx":"6591467622ed","ui_kits/mobile/MobileKit.jsx":"c6afeb95474b","ui_kits/web/DashboardScreen.jsx":"4e919c7d16ed","ui_kits/web/InspeccionesScreen.jsx":"3e05146eda68","ui_kits/web/LoginScreen.jsx":"fbfcbda6eb95"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ControlDeCalidadAvColaDesignSystem_515b76 = window.ControlDeCalidadAvColaDesignSystem_515b76 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — small status pill. The app uses these for the % Selección
 * value (ok = emerald, danger = red soft pairs) and for state labels.
 */
function Badge({
  children,
  tone = "neutral",
  style,
  ...rest
}) {
  const tones = {
    neutral: {
      background: "var(--slate-100)",
      color: "var(--slate-600)"
    },
    ok: {
      background: "var(--ok-soft-bg)",
      color: "var(--ok-soft-text)"
    },
    danger: {
      background: "var(--danger-soft-bg)",
      color: "var(--danger-soft-text)"
    },
    warn: {
      background: "var(--warn-soft-bg)",
      color: "var(--warn-soft-text)"
    },
    brand: {
      background: "var(--brand-soft-bg)",
      color: "var(--brand-soft-text)"
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-semibold)",
      lineHeight: 1.4,
      padding: "0.125rem 0.5rem",
      borderRadius: "var(--radius-md)",
      whiteSpace: "nowrap",
      ...(tones[tone] ?? tones.neutral),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — executive-grade action control.
 * SF Blue primary with directional gradient, 5 px radius, tracked semibold.
 * Variants: primary · secondary · dark · ghost · danger.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  fullWidth = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const sizes = {
    sm: {
      padding: "0.3rem 0.75rem",
      fontSize: "0.75rem",
      letterSpacing: "0.025em"
    },
    md: {
      padding: "0.5rem 1.125rem",
      fontSize: "0.8125rem",
      letterSpacing: "0.02em"
    },
    lg: {
      padding: "0.65rem 1.375rem",
      fontSize: "0.875rem",
      letterSpacing: "0.015em"
    }
  };
  const variants = {
    primary: {
      base: {
        background: "linear-gradient(160deg,#1769C7 0%,#0B4EA2 100%)",
        color: "#fff",
        border: "1px solid #0B4EA2",
        boxShadow: "0 1px 3px rgba(11,78,162,.35),inset 0 1px 0 rgba(255,255,255,.12)"
      },
      hover: {
        background: "linear-gradient(160deg,#0B4EA2 0%,#002F86 100%)",
        border: "1px solid #002F86",
        boxShadow: "0 2px 6px rgba(11,78,162,.4),inset 0 1px 0 rgba(255,255,255,.08)"
      },
      active: {
        background: "#002060",
        border: "1px solid #001a52",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,.25)"
      }
    },
    secondary: {
      base: {
        background: "#fff",
        color: "#0B4EA2",
        border: "1.5px solid #0B4EA2",
        boxShadow: "none"
      },
      hover: {
        background: "#EFF6FF",
        border: "1.5px solid #0B4EA2"
      },
      active: {
        background: "#DBEAFE",
        border: "1.5px solid #002F86",
        color: "#002F86"
      }
    },
    dark: {
      base: {
        background: "#002F86",
        color: "#fff",
        border: "1px solid #001a52",
        boxShadow: "0 1px 3px rgba(0,0,0,.28)"
      },
      hover: {
        background: "#001a52",
        border: "1px solid #001040"
      },
      active: {
        background: "#001040",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,.3)"
      }
    },
    ghost: {
      base: {
        background: "transparent",
        color: "#0B4EA2",
        border: "1.5px solid transparent",
        boxShadow: "none"
      },
      hover: {
        background: "#EFF6FF",
        border: "1.5px solid #BFDBFE"
      },
      active: {
        background: "#DBEAFE",
        border: "1.5px solid #93C5FD"
      }
    },
    danger: {
      base: {
        background: "#DC2626",
        color: "#fff",
        border: "1px solid #B91C1C",
        boxShadow: "0 1px 2px rgba(185,28,28,.3)"
      },
      hover: {
        background: "#B91C1C",
        border: "1px solid #991B1B"
      },
      active: {
        background: "#991B1B",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,.25)"
      }
    }
  };
  const v = variants[variant] ?? variants.primary;
  const st = active && !disabled ? "active" : hover && !disabled ? "hover" : "base";
  const computed = {
    ...v.base,
    ...(st === "hover" ? v.hover : {}),
    ...(st === "active" ? v.active : {})
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.4rem",
      width: fullWidth ? "100%" : "auto",
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      lineHeight: 1.2,
      borderRadius: "5px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      whiteSpace: "nowrap",
      userSelect: "none",
      ...sizes[size],
      ...computed,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — the app's universal surface: white, rounded-xl, soft shadow
 * and a 1px slate-200 ring. Optional title renders a semibold header.
 */
function Card({
  children,
  title,
  action,
  padding = "md",
  style,
  ...rest
}) {
  const pads = {
    none: "0",
    sm: "var(--space-3)",
    md: "var(--card-pad)",
    lg: "var(--card-pad-lg)"
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--color-surface)",
      borderRadius: "var(--card-radius)",
      boxShadow: "var(--card-shadow), var(--card-ring)",
      padding: pads[padding] ?? pads.md,
      fontFamily: "var(--font-sans)",
      color: "var(--text-body)",
      ...style
    }
  }, rest), (title || action) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "var(--space-3)"
    }
  }, title && /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: "var(--text-base)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--text-strong)"
    }
  }, title), action), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/KpiCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * KpiCard — dashboard metric tile. Uppercase tracked label, big bold
 * value, optional sub-line. `highlight` colors the value (ok/danger).
 */
function KpiCard({
  label,
  value,
  sub,
  highlight,
  style,
  ...rest
}) {
  const valueColor = highlight === "danger" ? "var(--danger)" : highlight === "ok" ? "var(--ok)" : "var(--text-strong)";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--color-surface)",
      borderRadius: "var(--card-radius)",
      boxShadow: "var(--card-shadow), var(--card-ring)",
      padding: "var(--card-pad)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-medium)",
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-wide)",
      color: "var(--text-muted)"
    }
  }, label), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0.25rem 0 0",
      fontSize: "var(--text-2xl)",
      fontWeight: "var(--weight-bold)",
      color: valueColor,
      fontVariantNumeric: "tabular-nums"
    }
  }, value), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0.125rem 0 0",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)"
    }
  }, sub));
}
Object.assign(__ds_scope, { KpiCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/KpiCard.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusDot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * StatusDot — tiny round status indicator. The preventa dashboard uses
 * an emerald dot for "en vivo" (live) and a slate dot for stale.
 */
function StatusDot({
  tone = "live",
  size = 8,
  label,
  style,
  ...rest
}) {
  const tones = {
    live: "var(--emerald-500)",
    idle: "var(--slate-300)",
    danger: "var(--danger)",
    warn: "var(--warn)"
  };
  const dot = /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "var(--radius-full)",
      background: tones[tone] ?? tones.live,
      flex: "none",
      ...style
    }
  }, rest));
  if (!label) return dot;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      color: "var(--text-muted)"
    }
  }, dot, label);
}
Object.assign(__ds_scope, { StatusDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusDot.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
/**
 * DataTable — the app's list table. slate-50 header, slate-100 row
 * dividers, hover highlight. Columns can render custom cells.
 * Wrap in a Card with padding="none" for the framed look.
 */
function DataTable({
  columns,
  rows,
  rowKey,
  empty = "No hay registros.",
  onRowClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: "auto",
      borderRadius: "var(--card-radius)",
      background: "var(--color-surface)",
      boxShadow: "var(--card-shadow), var(--card-ring)"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: "var(--surface-muted, var(--slate-50))",
      textAlign: "left"
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      padding: "0.5rem 0.75rem",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-muted)",
      textAlign: c.align ?? "left",
      whiteSpace: "nowrap"
    }
  }, c.header)))), /*#__PURE__*/React.createElement("tbody", null, rows.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: columns.length,
    style: {
      padding: "2rem 0.75rem",
      textAlign: "center",
      color: "var(--text-faint)"
    }
  }, empty)) : rows.map((row, i) => /*#__PURE__*/React.createElement(Row, {
    key: rowKey ? rowKey(row) : i,
    row: row,
    columns: columns,
    onClick: onRowClick
  })))));
}
function Row({
  row,
  columns,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("tr", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onClick: onClick ? () => onClick(row) : undefined,
    style: {
      borderTop: "1px solid var(--divider)",
      background: hover ? "var(--slate-50)" : "transparent",
      cursor: onClick ? "pointer" : "default"
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      padding: "0.5rem 0.75rem",
      color: "var(--text-body)",
      textAlign: c.align ?? "left",
      fontVariantNumeric: c.numeric ? "tabular-nums" : "normal"
    }
  }, c.render ? c.render(row) : row[c.key])));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/EmptyState.jsx
try { (() => {
/**
 * EmptyState — the faint centered message the app shows when a chart or
 * list has no data yet. Spanish copy, slate-400, centered.
 */
function EmptyState({
  children = "Aún no hay datos suficientes para mostrar.",
  height = 280,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      minHeight: height,
      padding: "var(--space-6)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-faint)",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
/**
 * Alert — inline message banner. The login error uses the `danger`
 * tone (red-50 bg, red-600 text). Soft, rounded-md, no icon by default.
 */
function Alert({
  children,
  tone = "info",
  style
}) {
  const tones = {
    info: {
      background: "var(--slate-100)",
      color: "var(--slate-700)"
    },
    danger: {
      background: "var(--red-50)",
      color: "var(--red-600)"
    },
    ok: {
      background: "var(--emerald-50)",
      color: "var(--emerald-700)"
    },
    warn: {
      background: "var(--amber-50)",
      color: "var(--amber-700)"
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      padding: "0.5rem 0.75rem",
      borderRadius: "var(--control-radius)",
      ...(tones[tone] ?? tones.info),
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/**
 * Checkbox — square check, emerald when checked. Used for boolean
 * flags and the "Mostrar también en hexadecimal" style options.
 */
function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  style
}) {
  const toggle = () => {
    if (!disabled) onChange?.(!checked);
  };
  const box = /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 18,
      height: 18,
      flex: "none",
      borderRadius: "var(--radius-sm)",
      border: `1px solid ${checked ? "var(--brand)" : "var(--border-strong)"}`,
      backgroundColor: checked ? "var(--brand)" : "var(--color-surface)"
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  })));
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    onClick: e => {
      e.preventDefault();
      toggle();
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-body)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, box, label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
/**
 * Field — label + control wrapper. Slate-700 medium label, optional
 * hint/error. Wrap any Input/Select to get the app's form rhythm.
 */
function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "block",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      display: "block",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--slate-700)",
      marginBottom: "var(--field-gap)"
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--danger)"
    }
  }, " *")), children, error ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0.25rem 0 0",
      fontSize: "var(--text-xs)",
      color: "var(--danger)"
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0.25rem 0 0",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)"
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — text field. White, slate-300 border, rounded-md, 14px.
 * Focus shows an emerald ring (border + 1px ring). Disabled greys out.
 */
function Input({
  invalid = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = invalid ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--border-strong)";
  return /*#__PURE__*/React.createElement("input", _extends({
    disabled: disabled,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      display: "block",
      width: "100%",
      boxSizing: "border-box",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-body)",
      background: disabled ? "var(--slate-100)" : "var(--color-surface)",
      padding: "0.5rem 0.75rem",
      borderRadius: "var(--control-radius)",
      border: `1px solid ${borderColor}`,
      boxShadow: focus ? `0 0 0 1px ${invalid ? "var(--danger)" : "var(--focus-ring)"}` : "var(--shadow-xs)",
      outline: "none",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
/**
 * SegmentedControl — equal-width option row. Mirrors the mobile capture
 * app's grade RadioGroups (Sin lesión · Leve · Grave) and sexo selector.
 * Selected segment fills emerald.
 */
function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
  fullWidth = true,
  style
}) {
  const pads = {
    sm: "0.3rem 0.5rem",
    md: "0.45rem 0.75rem",
    lg: "0.6rem 1rem"
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: "inline-flex",
      width: fullWidth ? "100%" : "auto",
      padding: 3,
      gap: 3,
      background: "var(--slate-100)",
      borderRadius: "var(--control-radius)",
      ...style
    }
  }, options.map(opt => {
    const val = typeof opt === "string" ? opt : opt.value;
    const lbl = typeof opt === "string" ? opt : opt.label;
    const selected = val === value;
    return /*#__PURE__*/React.createElement("button", {
      key: val,
      type: "button",
      role: "radio",
      "aria-checked": selected,
      onClick: () => onChange?.(val),
      style: {
        flex: fullWidth ? 1 : "none",
        padding: pads[size],
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-medium)",
        color: selected ? "var(--text-on-brand)" : "var(--slate-600)",
        backgroundColor: selected ? "var(--brand)" : "transparent",
        border: "none",
        borderRadius: "calc(var(--control-radius) - 1px)",
        boxShadow: selected ? "var(--shadow-xs)" : "none",
        cursor: "pointer",
        whiteSpace: "nowrap"
      }
    }, lbl);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select — native dropdown styled like Input. Used heavily in filter
 * bars (cliente, verificador, pigmentación…).
 */
function Select({
  children,
  invalid = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = invalid ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--border-strong)";
  return /*#__PURE__*/React.createElement("select", _extends({
    disabled: disabled,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      display: "block",
      width: "100%",
      boxSizing: "border-box",
      appearance: "none",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-body)",
      background: `${disabled ? "var(--slate-100)" : "var(--color-surface)"} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>") no-repeat right 0.6rem center`,
      padding: "0.5rem 2rem 0.5rem 0.75rem",
      borderRadius: "var(--control-radius)",
      border: `1px solid ${borderColor}`,
      boxShadow: focus ? `0 0 0 1px var(--focus-ring)` : "var(--shadow-xs)",
      outline: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/**
 * Switch — on/off toggle. The mobile capture screen uses these for
 * "Evaluar calidad", "Hematoma", "Defecto de selección". Emerald when on.
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  style
}) {
  const toggle = () => {
    if (!disabled) onChange?.(!checked);
  };
  const control = /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": checked,
    id: id,
    onClick: toggle,
    disabled: disabled,
    style: {
      position: "relative",
      width: 40,
      height: 22,
      flex: "none",
      borderRadius: "var(--radius-full)",
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      backgroundColor: checked ? "var(--brand)" : "var(--slate-300)",
      opacity: disabled ? 0.5 : 1,
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: checked ? 20 : 2,
      width: 18,
      height: 18,
      borderRadius: "var(--radius-full)",
      background: "#fff",
      boxShadow: "var(--shadow-sm)",
      transition: "left 140ms ease"
    }
  }));
  if (!label) return control;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.625rem",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-body)",
      cursor: disabled ? "not-allowed" : "pointer",
      ...style
    }
  }, control, label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AppHeader.jsx
try { (() => {
/**
 * AppHeader — sticky top bar: SF blue brand row + white nav row below.
 * brand: wordmark (default "San Fernando")
 * subtitle: shown small after the wordmark (default "Control de Calidad")
 */
function AppHeader({
  brand = "San Fernando",
  subtitle = "Control de Calidad",
  user,
  role,
  onLogout,
  nav,
  style
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 10,
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#0B4EA2"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.625rem var(--gutter)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      color: "#fff",
      fontSize: "1.05rem",
      letterSpacing: "-.02em"
    }
  }, brand), subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,.7)",
      fontSize: "0.65rem",
      fontWeight: 700,
      letterSpacing: ".07em",
      textTransform: "uppercase"
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      fontSize: "var(--text-sm)"
    }
  }, user && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,.8)"
    }
  }, user, role ? ` · ${role}` : ""), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onLogout,
    style: {
      borderRadius: "var(--control-radius)",
      border: "1px solid rgba(255,255,255,.35)",
      background: "transparent",
      color: "#fff",
      padding: "0.375rem 0.75rem",
      fontSize: "var(--text-sm)",
      cursor: "pointer"
    }
  }, "Salir")))), nav && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-surface)",
      borderBottom: "1px solid var(--border-default)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "0 var(--gutter)"
    }
  }, nav)));
}
Object.assign(__ds_scope, { AppHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AppHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavTabs.jsx
try { (() => {
/**
 * NavTabs — the app's primary nav: a row of rounded-md pills. Active
 * pill fills emerald-600; the rest are slate with a slate-100 hover.
 */
function NavTabs({
  items,
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "0.25rem",
      overflowX: "auto",
      paddingBottom: "0.5rem",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      ...style
    }
  }, items.map(it => {
    const val = it.value ?? it.href ?? it.label;
    const active = val === value;
    return /*#__PURE__*/React.createElement(NavTab, {
      key: val,
      active: active,
      onClick: () => onChange?.(val)
    }, it.label);
  }));
}
function NavTab({
  active,
  onClick,
  children
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      whiteSpace: "nowrap",
      border: "none",
      borderRadius: "var(--control-radius)",
      padding: "0.375rem 0.75rem",
      fontWeight: "var(--weight-medium)",
      cursor: "pointer",
      backgroundColor: active ? "var(--brand)" : hover ? "var(--slate-100)" : "transparent",
      color: active ? "var(--text-on-brand)" : "var(--slate-600)"
    }
  }, children);
}
Object.assign(__ds_scope, { NavTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavTabs.jsx", error: String((e && e.message) || e) }); }

// design_handoff_calidad_lima/calidad-controls.jsx
try { (() => {
// CalidadControls — controles de diseño para el wizard de Calidad Lima
// Tema claro/oscuro, identidad San Fernando (azul + rojo CTA).

const FONT = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace';
const SF_RED = "#E2231A";
const SF_RED_DK = "#FF4A3D";
const SF_BLUE = "#0B4EA2";
function makeTheme(mode, brand) {
  const dark = mode === "dark";
  const base = dark ? {
    bg: "#08101a",
    surface: "#101c2c",
    surfaceAlt: "#182436",
    raised: "#1e2d40",
    strong: "#f0f6ff",
    body: "#dce8f5",
    muted: "#8ca8c5",
    faint: "#4d6b88",
    border: "#1e3048",
    borderStrong: "#2a4060",
    emerald: "#34d399",
    emeraldText: "#062b20",
    okBg: "rgba(3,105,161,.18)",
    okText: "#7DD3FC",
    danger: "#f87171",
    dangerBg: "rgba(248,113,113,.16)",
    dangerText: "#fca5a5",
    warn: "#fb923c",
    warnBg: "rgba(251,146,60,.16)",
    warnText: "#fdba74",
    red: SF_RED_DK,
    blue: "#1769c7",
    shadow: "0 8px 24px rgba(0,0,0,.55)"
  } : {
    bg: "#f5f6f8",
    surface: "#ffffff",
    surfaceAlt: "#f1f5f9",
    raised: "#ffffff",
    strong: "#0f172a",
    body: "#1a1a1a",
    muted: "#64748b",
    faint: "#94a3b8",
    border: "#e2e8f0",
    borderStrong: "#cbd5e1",
    emerald: "#059669",
    emeraldText: "#ffffff",
    okBg: "#d1fae5",
    okText: "#047857",
    danger: "#dc2626",
    dangerBg: "#fee2e2",
    dangerText: "#b91c1c",
    warn: "#d97706",
    warnBg: "#fef3c7",
    warnText: "#b45309",
    red: SF_RED,
    blue: SF_BLUE,
    shadow: "0 8px 24px rgba(15,23,42,.16)"
  };
  const redCta = brand === "sfRedCta";
  const action = redCta ? base.red : base.emerald;
  const actionText = redCta ? "#ffffff" : base.emeraldText;
  const headerBg = brand === "neutral" ? base.surface : base.blue;
  const headerText = brand === "neutral" ? base.strong : "#ffffff";
  const danger = redCta ? base.warn : base.danger;
  const dangerBg = redCta ? base.warnBg : base.dangerBg;
  const dangerText = redCta ? base.warnText : base.dangerText;
  return {
    ...base,
    dark,
    action,
    actionText,
    headerBg,
    headerText,
    danger,
    dangerBg,
    dangerText,
    brand
  };
}

// ---- BigInput — campo grande táctil ----------------------------------------
function BigInput({
  th,
  label,
  type,
  value,
  onChange,
  placeholder,
  optional
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 6
    }
  }, label, optional && /*#__PURE__*/React.createElement("span", {
    style: {
      color: th.faint,
      fontSize: 12,
      marginLeft: 6
    }
  }, "(opcional)")), /*#__PURE__*/React.createElement("input", {
    type: type || "text",
    inputMode: type === "number" ? "decimal" : undefined,
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      fontSize: 16,
      color: th.strong,
      fontFamily: FONT,
      outline: "none"
    }
  }));
}

// ---- Counter — −/número/+ para conteos -------------------------------------
function Counter({
  th,
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 16,
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: th.body,
      flex: 1,
      lineHeight: 1.3
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChange(Math.max(0, value - 1)),
    style: {
      width: 44,
      height: 44,
      borderRadius: 12,
      fontFamily: FONT,
      background: th.surface,
      border: `1px solid ${th.borderStrong}`,
      color: th.body,
      fontSize: 22,
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "\u2212"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 0,
    value: value || "",
    onChange: e => onChange(Math.max(0, Number(e.target.value) || 0)),
    style: {
      width: 60,
      textAlign: "center",
      background: th.surface,
      border: `1px solid ${th.border}`,
      borderRadius: 10,
      padding: "8px 4px",
      fontSize: 18,
      fontWeight: 700,
      color: th.strong,
      fontFamily: MONO
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChange(value + 1),
    style: {
      width: 44,
      height: 44,
      borderRadius: 12,
      fontFamily: FONT,
      background: th.okBg,
      border: `1px solid ${th.emerald}`,
      color: th.okText,
      fontSize: 22,
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "+")));
}

// ---- PrimaryBtn -----------------------------------------------------------
function PrimaryBtn({
  th,
  children,
  onClick,
  disabled
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    style: {
      width: "100%",
      border: "none",
      borderRadius: 16,
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? th.border : th.action,
      color: disabled ? th.faint : th.actionText,
      fontFamily: FONT,
      fontSize: 18,
      fontWeight: 800,
      minHeight: 60,
      opacity: disabled ? 0.6 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, children);
}
window.CalidadLimaControls = {
  makeTheme,
  BigInput,
  Counter,
  PrimaryBtn,
  FONT,
  MONO,
  SF_RED,
  SF_BLUE
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_calidad_lima/calidad-controls.jsx", error: String((e && e.message) || e) }); }

// design_handoff_calidad_lima/calidad-lima.jsx
try { (() => {
// Calidad Clientes Lima — prototipo fiel al wizard de jornadas
// Flujo: Jornada detail → Wizard 7 pasos → Evaluación completa
const C = window.CalidadLimaControls;
const {
  makeTheme,
  BigInput,
  Counter,
  PrimaryBtn,
  FONT,
  MONO
} = C;

// ---- Datos de muestra ------------------------------------------------------
const PLANTELES = [{
  codigo: "P006",
  label: "P006 · Norte (Lima)"
}, {
  codigo: "P007",
  label: "P007 · Sur (Lima)"
}, {
  codigo: "P012",
  label: "P012 · Centro (Lima)"
}, {
  codigo: "P015",
  label: "P015 · Callao"
}];
const PRINCIPALES = [{
  id: "fl",
  nombre: "Flacas"
}, {
  id: "he",
  nombre: "Heridas"
}, {
  id: "tu",
  nombre: "Tumores"
}, {
  id: "fp",
  nombre: "Fractura pechuga"
}, {
  id: "co",
  nombre: "Congestión"
}];
const CATALOGO_ADICIONAL = [{
  id: "br",
  nombre: "Brucelosis"
}, {
  id: "ce",
  nombre: "Celulitis"
}, {
  id: "cn",
  nombre: "Contaminación"
}, {
  id: "pe",
  nombre: "Pelo"
}, {
  id: "cl",
  nombre: "Cloaca"
}];
const MERMA_ALAS = [{
  id: "ag1",
  nombre: "Alas Grado 1°"
}, {
  id: "ag2",
  nombre: "Alas Grado 2°"
}, {
  id: "ag3",
  nombre: "Alas Grado 3°"
}, {
  id: "ar",
  nombre: "Alas Rota"
}];
const MERMA_PIERNA = [{
  id: "pg1",
  nombre: "Pierna Grado 1°"
}, {
  id: "pg2",
  nombre: "Pierna Grado 2°"
}, {
  id: "pg3",
  nombre: "Pierna Grado 3°"
}, {
  id: "pr",
  nombre: "Pierna Rota"
}];
const GRADOS_HEM = [{
  key: "GRADO1",
  label: "1er grado"
}, {
  key: "GRADO2",
  label: "2do grado"
}, {
  key: "GRADO3",
  label: "3er grado"
}];
const UBIC_HEM = [{
  key: "ALA",
  label: "Ala"
}, {
  key: "ESPINAZO",
  label: "Espin."
}, {
  key: "PECHUGA",
  label: "Pech."
}, {
  key: "PIERNA",
  label: "Pierna"
}];
const PASO_LABELS = ["Datos del camión", "Temperaturas", "Almohadillas y Rasguños", "Hematomas", "Pigmentación", "Selección", "Merma y cierre"];
const SAMPLE_EVALS = [{
  sexo: "MACHO",
  plantel: "P006",
  galpon: "11",
  corral: "A",
  estado: "COMPLETA",
  paso: 7
}, {
  sexo: "HEMBRA",
  plantel: "P007",
  galpon: "08",
  corral: "B",
  estado: "COMPLETA",
  paso: 7
}, {
  sexo: "MACHO",
  plantel: "P012",
  galpon: "03",
  corral: "A",
  estado: "BORRADOR",
  paso: 3
}];

// ---- Helpers ----------------------------------------------------------------
function buildComplex(plantelQuery, campania, galpon, sexo, corral) {
  const code = plantelQuery ? plantelQuery.split(" ")[0] : "";
  const sx = sexo === "MACHO" ? "M" : sexo === "HEMBRA" ? "H" : "";
  const parts = [code, campania || "", galpon || "", sx, corral || ""];
  if (parts.every(p => !p)) return "";
  return parts.join("-");
}
function useSaveStatus() {
  const [status, setStatus] = React.useState("idle");
  const timerRef = React.useRef(null);
  function trigger() {
    clearTimeout(timerRef.current);
    setStatus("saving");
    timerRef.current = setTimeout(() => {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1800);
    }, 700);
  }
  return [status, trigger];
}

// ---- AppHeader (SF brand) ---------------------------------------------------
function AppHeader({
  th,
  onToggleTheme
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: th.headerBg,
      color: th.headerText,
      padding: "9px 14px",
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      fontSize: 16,
      letterSpacing: "-.02em",
      flex: "none"
    }
  }, "San Fernando"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      opacity: .75,
      fontWeight: 700,
      letterSpacing: ".06em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, "Calidad \xB7 Clientes Lima")), /*#__PURE__*/React.createElement("button", {
    onClick: onToggleTheme,
    "aria-label": "Cambiar tema",
    style: {
      border: `1px solid rgba(255,255,255,.35)`,
      background: "transparent",
      color: th.headerText,
      borderRadius: 999,
      width: 36,
      height: 36,
      cursor: "pointer",
      fontSize: 15,
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, th.dark ? "☀" : "☾"));
}

// ---- WizardTopBar (paso, label, autosave, barra de progreso) ----------------
function WizardTopBar({
  th,
  paso,
  saveStatus,
  onBackToJornada
}) {
  const saved = saveStatus === "saved";
  const saving = saveStatus === "saving";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "none",
      background: th.surface,
      borderBottom: `1px solid ${th.border}`,
      padding: "10px 16px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBackToJornada,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: th.action,
      fontFamily: FONT,
      fontSize: 13,
      fontWeight: 600,
      padding: 0
    }
  }, "\u2190 Jornada"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, saving && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: th.faint
    }
  }, "Guardando\u2026"), saved && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: th.emerald
    }
  }, "Guardado \u2713"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: th.muted,
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 999,
      padding: "3px 10px"
    }
  }, paso, " / 7"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      color: th.strong,
      marginBottom: 10,
      lineHeight: 1.2
    }
  }, PASO_LABELS[paso - 1]), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, Array.from({
    length: 7
  }, (_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: 5,
      borderRadius: 3,
      background: i < paso ? th.action : th.border,
      opacity: i < paso ? 1 : 0.5
    }
  }))));
}

// ---- DefectoCard (pasos 6 + 7) ---------------------------------------------
function DefectoCard({
  th,
  nombre,
  vals,
  onChange,
  onRemove
}) {
  const v = vals || {
    unidades: 0,
    kg: 0
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong
    }
  }, nombre), onRemove && /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: th.faint,
      fontSize: 22,
      lineHeight: 1,
      padding: "2px 6px"
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, [{
    f: "unidades",
    label: "Unidades",
    step: "1"
  }, {
    f: "kg",
    label: "Kg",
    step: "0.01"
  }].map(({
    f,
    label,
    step
  }) => /*#__PURE__*/React.createElement("label", {
    key: f,
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: th.muted,
      display: "block",
      marginBottom: 4
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 0,
    step: step,
    inputMode: "decimal",
    value: v[f] || "",
    onChange: e => onChange(f, Number(e.target.value) || 0),
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: th.surface,
      border: `1px solid ${th.border}`,
      borderRadius: 10,
      padding: "10px 10px",
      fontSize: 16,
      fontWeight: 700,
      color: th.strong,
      fontFamily: MONO
    }
  })))));
}

// ---- Jornada detail screen -------------------------------------------------
function JornadaScreen({
  th,
  evals,
  onEnterEval,
  onNewEval,
  onToggleTheme
}) {
  const fecha = "sábado 28 de junio de 2026";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: th.bg,
      fontFamily: FONT
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    th: th,
    onToggleTheme: onToggleTheme
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 16px 6px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: th.action,
      fontWeight: 600
    }
  }, "\u2190 Jornadas"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: th.strong,
      marginTop: 2
    }
  }, fecha), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: th.muted,
      marginTop: 2
    }
  }, "AKIM S.A. \xB7 Ram\xEDrez, C.")), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "10px 16px",
      background: th.surface,
      border: `1px solid ${th.border}`,
      borderRadius: 16,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong,
      marginBottom: 12
    }
  }, "Saldo d\xEDa anterior"), ["MACHO", "HEMBRA"].map(sexo => /*#__PURE__*/React.createElement("div", {
    key: sexo,
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: th.muted,
      marginBottom: 8
    }
  }, sexo), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 6
    }
  }, ["Unidades", "Jabas", "Kg"].map(f => /*#__PURE__*/React.createElement("label", {
    key: f,
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: th.faint,
      display: "block",
      marginBottom: 3
    }
  }, f), /*#__PURE__*/React.createElement("input", {
    type: "number",
    defaultValue: "",
    inputMode: "decimal",
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 8,
      padding: "8px 8px",
      fontSize: 14,
      fontWeight: 600,
      color: th.strong,
      fontFamily: MONO
    }
  }))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "10px 16px",
      background: th.surface,
      border: `1px solid ${th.border}`,
      borderRadius: 16,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong,
      marginBottom: 12
    }
  }, "Evaluaciones del d\xEDa"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginBottom: 12
    }
  }, evals.map((ev, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => onEnterEval(ev),
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 12,
      padding: "12px 14px",
      cursor: "pointer",
      textAlign: "left",
      fontFamily: FONT
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 999,
      background: ev.sexo === "MACHO" ? "#dbeafe" : "#fce7f3",
      color: ev.sexo === "MACHO" ? "#1d4ed8" : "#be185d"
    }
  }, ev.sexo), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: th.body
    }
  }, ev.plantel, ev.galpon ? ` · ${ev.galpon}${ev.corral}` : "")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: ev.estado === "COMPLETA" ? th.okText : th.warn
    }
  }, ev.estado === "COMPLETA" ? "Completa ✓" : `Paso ${ev.paso}/7`)))), /*#__PURE__*/React.createElement("button", {
    onClick: onNewEval,
    style: {
      width: "100%",
      background: "none",
      border: `2px dashed ${th.action}`,
      borderRadius: 14,
      padding: "14px",
      fontSize: 15,
      fontWeight: 700,
      color: th.action,
      cursor: "pointer",
      fontFamily: FONT
    }
  }, "+ Nueva evaluaci\xF3n")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  })));
}

// ---- PASO 1: Datos del camión -----------------------------------------------
function Step1({
  th,
  state,
  set
}) {
  const {
    plantelQuery,
    campania,
    galpon,
    sexo,
    corral,
    jabas,
    cantidad,
    promVivo,
    promBeneficiado,
    nroGuia
  } = state;
  const complex = buildComplex(plantelQuery, campania, galpon, sexo, corral);
  const sexoOpts = [{
    v: "MACHO",
    label: "Macho",
    light: {
      bg: "#dbeafe",
      border: "#2563eb",
      text: "#1d4ed8"
    },
    dark: {
      bg: "#1e3a5f",
      border: "#60a5fa",
      text: "#bfdbfe"
    }
  }, {
    v: "HEMBRA",
    label: "Hembra",
    light: {
      bg: "#fce7f3",
      border: "#db2777",
      text: "#9d174d"
    },
    dark: {
      bg: "#4a1942",
      border: "#f472b6",
      text: "#fbcfe8"
    }
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 6
    }
  }, "Plantel"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    list: "plantel-opts",
    value: plantelQuery,
    onChange: e => set("plantelQuery", e.target.value),
    placeholder: "Busca por c\xF3digo\u2026",
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      fontSize: 16,
      color: th.strong,
      fontFamily: FONT
    }
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "plantel-opts"
  }, PLANTELES.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.codigo,
    value: p.label
  })))), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Campa\xF1a",
    type: "text",
    value: campania,
    onChange: v => set("campania", v),
    placeholder: "Ej. 2401",
    optional: true
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Galp\xF3n",
    type: "text",
    value: galpon,
    onChange: v => set("galpon", v),
    placeholder: "Ej. 11"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 8
    }
  }, "Sexo ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: th.danger
    }
  }, "*")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, sexoOpts.map(s => {
    const sel = sexo === s.v;
    const c = th.dark ? s.dark : s.light;
    return /*#__PURE__*/React.createElement("button", {
      key: s.v,
      onClick: () => set("sexo", s.v),
      style: {
        minHeight: 68,
        borderRadius: 16,
        cursor: "pointer",
        fontFamily: FONT,
        border: `2px solid ${sel ? c.border : th.border}`,
        background: sel ? c.bg : th.surface,
        color: sel ? c.text : th.muted,
        fontSize: 18,
        fontWeight: 800
      }
    }, s.label);
  }))), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Corral",
    type: "text",
    value: corral,
    onChange: v => set("corral", v),
    placeholder: "Ej. A",
    optional: true
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Jabas",
    type: "number",
    value: jabas,
    onChange: v => set("jabas", v)
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Unidades (cantidad de aves)",
    type: "number",
    value: cantidad,
    onChange: v => set("cantidad", v)
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Promedio vivo (kg)",
    type: "number",
    value: promVivo,
    onChange: v => set("promVivo", v),
    optional: true
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Promedio beneficiado (kg)",
    type: "number",
    value: promBeneficiado,
    onChange: v => set("promBeneficiado", v),
    optional: true
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "N\xB0 de Gu\xEDa",
    type: "text",
    value: nroGuia,
    onChange: v => set("nroGuia", v),
    optional: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: "14px 16px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 4
    }
  }, "Complex Entity"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: MONO,
      fontSize: 15,
      color: th.strong
    }
  }, complex || "—"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: th.faint,
      marginTop: 4
    }
  }, "Plantel-Campa\xF1a-Galp\xF3n-Sexo-Corral \xB7 calculado autom\xE1ticamente")));
}

// ---- PASO 2: Temperaturas --------------------------------------------------
function Step2({
  th,
  state,
  set
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: th.muted
    }
  }, "Registra las temperaturas en \xB0C al momento de la descarga."), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Veh\xEDculo con jabas (\xB0C)",
    type: "number",
    value: state.tempCamion,
    onChange: v => set("tempCamion", v)
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Plataforma sin jabas (\xB0C)",
    type: "number",
    value: state.tempPlatVacia,
    onChange: v => set("tempPlatVacia", v)
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Plataforma con jabas (\xB0C)",
    type: "number",
    value: state.tempPlat,
    onChange: v => set("tempPlat", v)
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Densidad (aves/m\xB2)",
    type: "number",
    value: state.densidad,
    onChange: v => set("densidad", v),
    optional: true
  }));
}

// ---- PASO 3: Almohadillas y Rasguños ----------------------------------------
function Step3({
  th,
  state,
  set
}) {
  const {
    alm,
    ras
  } = state;
  const almT = alm.sinLesion + alm.leve + alm.grave;
  const rasT = ras.sinLesion + ras.leve + ras.grave;
  const sec = [{
    key: "alm",
    label: "Almohadillas",
    total: almT,
    vals: alm,
    fields: ["sinLesion", "leve", "grave"],
    labels: ["Sin lesión", "Leve", "Grave"]
  }, {
    key: "ras",
    label: "Rasguños",
    total: rasT,
    vals: ras,
    fields: ["sinLesion", "leve", "grave"],
    labels: ["Sin lesión", "Leve", "Severo"]
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: th.muted
    }
  }, "Muestra de 200 aves. Registra almohadillas y rasgu\xF1os simult\xE1neamente."), sec.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.key
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: th.strong
    }
  }, s.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: th.muted
    }
  }, "Muestra: ", s.total)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, s.fields.map((f, i) => /*#__PURE__*/React.createElement(Counter, {
    key: f,
    th: th,
    label: s.labels[i],
    value: s.vals[f],
    onChange: v => set(s.key, {
      ...s.vals,
      [f]: v
    })
  }))))));
}

// ---- PASO 4: Hematomas -----------------------------------------------------
function Step4({
  th,
  state,
  set
}) {
  const {
    hemCon,
    hemSin,
    hemDetalle
  } = state;
  const detTotal = Object.values(hemDetalle).reduce((a, b) => a + b, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: th.muted
    }
  }, "Muestra de 50 aves."), /*#__PURE__*/React.createElement(Counter, {
    th: th,
    label: "Con hematoma",
    value: hemCon,
    onChange: v => set("hemCon", v)
  }), /*#__PURE__*/React.createElement(Counter, {
    th: th,
    label: "Sin hematoma",
    value: hemSin,
    onChange: v => set("hemSin", v)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 12,
      padding: "10px 14px",
      fontSize: 14,
      color: th.body
    }
  }, "Total evaluadas: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: MONO
    }
  }, hemCon + hemSin), " / 50"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong
    }
  }, "Grado \xD7 Ubicaci\xF3n"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: th.muted
    }
  }, "Total: ", detTotal, " / ", hemCon)), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "5px 8px",
      textAlign: "left",
      color: th.muted,
      fontWeight: 600
    }
  }), UBIC_HEM.map(u => /*#__PURE__*/React.createElement("th", {
    key: u.key,
    style: {
      padding: "5px 4px",
      textAlign: "center",
      color: th.muted,
      fontWeight: 600,
      fontSize: 12
    }
  }, u.label)))), /*#__PURE__*/React.createElement("tbody", null, GRADOS_HEM.map(g => /*#__PURE__*/React.createElement("tr", {
    key: g.key
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "4px 8px",
      color: th.body,
      fontWeight: 600,
      fontSize: 12,
      whiteSpace: "nowrap"
    }
  }, g.label), UBIC_HEM.map(u => {
    const k = `${g.key}_${u.key}`;
    return /*#__PURE__*/React.createElement("td", {
      key: u.key,
      style: {
        padding: 4
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "number",
      min: 0,
      inputMode: "numeric",
      value: hemDetalle[k] || "",
      onChange: e => set("hemDetalle", {
        ...hemDetalle,
        [k]: Number(e.target.value) || 0
      }),
      style: {
        width: "100%",
        maxWidth: 54,
        textAlign: "center",
        background: th.surface,
        border: `1px solid ${th.border}`,
        borderRadius: 8,
        padding: "9px 4px",
        fontSize: 15,
        fontWeight: 600,
        color: th.strong,
        fontFamily: MONO
      }
    }));
  }))))))));
}

// ---- PASO 5: Pigmentación --------------------------------------------------
function Step5({
  th,
  state,
  set
}) {
  const {
    pig
  } = state;
  const total = pig.reduce((a, b) => a + b, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: th.muted
    }
  }, "Muestra de 100 aves. Total: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: MONO
    }
  }, total), " / 100"), pig.map((val, nivel) => /*#__PURE__*/React.createElement(Counter, {
    key: nivel,
    th: th,
    label: `Nivel ${nivel}`,
    value: val,
    onChange: v => {
      const n = [...pig];
      n[nivel] = v;
      set("pig", n);
    }
  })));
}

// ---- PASO 6: Selección -----------------------------------------------------
function Step6({
  th,
  state,
  set
}) {
  const {
    defectos,
    extraIds,
    cantidad
  } = state;
  const extras = CATALOGO_ADICIONAL.filter(d => extraIds.includes(d.id));
  const disponibles = CATALOGO_ADICIONAL.filter(d => !extraIds.includes(d.id));
  const totalUnid = Object.values(defectos).reduce((a, d) => a + (d.unidades || 0), 0);
  const totalKg = Object.values(defectos).reduce((a, d) => a + (d.kg || 0), 0);
  function updDef(id, field, v) {
    set("defectos", {
      ...defectos,
      [id]: {
        ...(defectos[id] || {
          unidades: 0,
          kg: 0
        }),
        [field]: v
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: th.muted
    }
  }, "Aves que entrega el cliente como selecci\xF3n. Un defecto por ave."), /*#__PURE__*/React.createElement("div", {
    style: {
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 12,
      padding: "10px 14px",
      fontSize: 14,
      color: th.body
    }
  }, "Total: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: MONO
    }
  }, totalUnid), " unid \xB7 ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: MONO
    }
  }, totalKg.toFixed(2)), " kg"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: th.muted
    }
  }, "Defectos principales"), PRINCIPALES.map(t => /*#__PURE__*/React.createElement(DefectoCard, {
    key: t.id,
    th: th,
    nombre: t.nombre,
    vals: defectos[t.id],
    onChange: (f, v) => updDef(t.id, f, v)
  })), extras.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: th.muted
    }
  }, "Defectos adicionales"), extras.map(t => /*#__PURE__*/React.createElement(DefectoCard, {
    key: t.id,
    th: th,
    nombre: t.nombre,
    vals: defectos[t.id],
    onChange: (f, v) => updDef(t.id, f, v),
    onRemove: () => set("extraIds", extraIds.filter(x => x !== t.id))
  })), disponibles.length > 0 && /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 6
    }
  }, "+ Agregar defecto"), /*#__PURE__*/React.createElement("select", {
    value: "",
    onChange: e => {
      if (e.target.value) set("extraIds", [...extraIds, e.target.value]);
    },
    style: {
      width: "100%",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      fontSize: 15,
      color: th.strong,
      fontFamily: FONT
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Selecciona\u2026"), disponibles.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.nombre)))));
}

// ---- PASO 7: Merma y cierre ------------------------------------------------
function Step7({
  th,
  state,
  set
}) {
  const {
    merma,
    observaciones
  } = state;
  function updMerma(id, field, v) {
    set("merma", {
      ...merma,
      [id]: {
        ...(merma[id] || {
          unidades: 0,
          kg: 0
        }),
        [field]: v
      }
    });
  }
  const groups = [{
    label: "Alas",
    tipos: MERMA_ALAS
  }, {
    label: "Pierna",
    tipos: MERMA_PIERNA
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong
    }
  }, "Mutilados / Merma"), groups.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.label,
    style: {
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 16,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong,
      display: "block",
      marginBottom: 12
    }
  }, g.label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, g.tipos.map(t => /*#__PURE__*/React.createElement(DefectoCard, {
    key: t.id,
    th: th,
    nombre: t.nombre,
    vals: merma[t.id],
    onChange: (f, v) => updMerma(t.id, f, v)
  }))))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 6
    }
  }, "Observaciones"), /*#__PURE__*/React.createElement("textarea", {
    rows: 4,
    value: observaciones,
    onChange: e => set("observaciones", e.target.value),
    placeholder: "Notas adicionales\u2026",
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      fontSize: 15,
      color: th.strong,
      fontFamily: FONT,
      resize: "none"
    }
  })));
}

// ---- App -------------------------------------------------------------------
const TWEAK_DEFAULTS = {
  theme: "dark",
  brand: "sf",
  paso: 1
};
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const th = makeTheme(t.theme, t.brand);
  const toggleTheme = () => setTweak("theme", th.dark ? "light" : "dark");
  const [view, setView] = React.useState("jornada"); // "jornada" | "wizard" | "complete"
  const [paso, setPaso] = React.useState(1);
  const [fotos, setFotos] = React.useState(0);
  const [saveStatus, triggerSave] = useSaveStatus();
  const [evals, setEvals] = React.useState(SAMPLE_EVALS);

  // Step state
  const [s1, setS1] = React.useState({
    plantelQuery: "",
    campania: "",
    galpon: "",
    sexo: null,
    corral: "",
    jabas: "",
    cantidad: "",
    promVivo: "",
    promBeneficiado: "",
    nroGuia: ""
  });
  const [s2, setS2] = React.useState({
    tempCamion: "",
    tempPlatVacia: "",
    tempPlat: "",
    densidad: ""
  });
  const [s3, setS3] = React.useState({
    alm: {
      sinLesion: 0,
      leve: 0,
      grave: 0
    },
    ras: {
      sinLesion: 0,
      leve: 0,
      grave: 0
    }
  });
  const [s4, setS4] = React.useState({
    hemCon: 0,
    hemSin: 0,
    hemDetalle: {}
  });
  const [s5, setS5] = React.useState({
    pig: [0, 0, 0, 0, 0, 0, 0, 0]
  });
  const [s6, setS6] = React.useState({
    defectos: {},
    extraIds: []
  });
  const [s7, setS7] = React.useState({
    merma: {},
    observaciones: ""
  });
  function makeSet(setter) {
    return (k, v) => {
      setter(prev => ({
        ...prev,
        [k]: v
      }));
      triggerSave();
    };
  }
  function resetWizard() {
    setPaso(1);
    setFotos(0);
    setS1({
      plantelQuery: "",
      campania: "",
      galpon: "",
      sexo: null,
      corral: "",
      jabas: "",
      cantidad: "",
      promVivo: "",
      promBeneficiado: "",
      nroGuia: ""
    });
    setS2({
      tempCamion: "",
      tempPlatVacia: "",
      tempPlat: "",
      densidad: ""
    });
    setS3({
      alm: {
        sinLesion: 0,
        leve: 0,
        grave: 0
      },
      ras: {
        sinLesion: 0,
        leve: 0,
        grave: 0
      }
    });
    setS4({
      hemCon: 0,
      hemSin: 0,
      hemDetalle: {}
    });
    setS5({
      pig: [0, 0, 0, 0, 0, 0, 0, 0]
    });
    setS6({
      defectos: {},
      extraIds: []
    });
    setS7({
      merma: {},
      observaciones: ""
    });
  }
  function handleNewEval() {
    resetWizard();
    setView("wizard");
  }
  function handleEnterEval(ev) {
    resetWizard();
    if (ev.estado !== "COMPLETA") setPaso(ev.paso);
    setS1(prev => ({
      ...prev,
      plantelQuery: PLANTELES.find(p => p.codigo === ev.plantel)?.label || "",
      galpon: ev.galpon,
      corral: ev.corral,
      sexo: ev.sexo
    }));
    setView(ev.estado === "COMPLETA" ? "complete" : "wizard");
  }
  function handleNext() {
    if (paso < 7) {
      setPaso(p => p + 1);
      window.scrollTo && window.scrollTo(0, 0);
    } else handleCompletar();
  }
  function handleBack() {
    if (paso > 1) setPaso(p => p - 1);
  }
  function handleCompletar() {
    const plantel = s1.plantelQuery.split(" ")[0] || "P???";
    setEvals(prev => [...prev, {
      sexo: s1.sexo || "MACHO",
      plantel,
      galpon: s1.galpon,
      corral: s1.corral,
      estado: "COMPLETA",
      paso: 7
    }]);
    setView("complete");
  }
  function handleBackToJornada() {
    setView("jornada");
  }
  function renderStep() {
    switch (paso) {
      case 1:
        return /*#__PURE__*/React.createElement(Step1, {
          th: th,
          state: s1,
          set: makeSet(setS1)
        });
      case 2:
        return /*#__PURE__*/React.createElement(Step2, {
          th: th,
          state: s2,
          set: makeSet(setS2)
        });
      case 3:
        return /*#__PURE__*/React.createElement(Step3, {
          th: th,
          state: s3,
          set: makeSet(setS3)
        });
      case 4:
        return /*#__PURE__*/React.createElement(Step4, {
          th: th,
          state: s4,
          set: makeSet(setS4)
        });
      case 5:
        return /*#__PURE__*/React.createElement(Step5, {
          th: th,
          state: s5,
          set: makeSet(setS5)
        });
      case 6:
        return /*#__PURE__*/React.createElement(Step6, {
          th: th,
          state: {
            ...s6,
            cantidad: s1.cantidad
          },
          set: makeSet(setS6)
        });
      case 7:
        return /*#__PURE__*/React.createElement(Step7, {
          th: th,
          state: s7,
          set: makeSet(setS7)
        });
    }
  }

  // Completion screen
  if (view === "complete") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: th.bg,
        fontFamily: FONT
      }
    }, /*#__PURE__*/React.createElement(AppHeader, {
      th: th,
      onToggleTheme: toggleTheme
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        background: th.okBg,
        border: `1px solid ${th.emerald}`,
        borderRadius: 24,
        padding: "40px 28px",
        width: "100%",
        maxWidth: 340
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 56,
        lineHeight: 1
      }
    }, "\u2713"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 800,
        color: th.okText,
        margin: "12px 0 8px"
      }
    }, "Evaluaci\xF3n completa"), /*#__PURE__*/React.createElement("button", {
      onClick: handleBackToJornada,
      style: {
        marginTop: 8,
        background: th.action,
        color: th.actionText,
        border: "none",
        borderRadius: 14,
        padding: "14px 24px",
        fontSize: 16,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: FONT,
        width: "100%"
      }
    }, "Volver a la jornada"))));
  }

  // Jornada detail screen
  if (view === "jornada") {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(JornadaScreen, {
      th: th,
      evals: evals,
      onEnterEval: handleEnterEval,
      onNewEval: handleNewEval,
      onToggleTheme: toggleTheme
    }), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
      label: "Apariencia"
    }), /*#__PURE__*/React.createElement(TweakRadio, {
      label: "Tema",
      value: t.theme,
      options: ["dark", "light"],
      onChange: v => setTweak("theme", v)
    }), /*#__PURE__*/React.createElement(TweakSelect, {
      label: "Identidad SF",
      value: t.brand,
      options: [{
        value: "sf",
        label: "Azul SF · acción esmeralda"
      }, {
        value: "sfRedCta",
        label: "Azul SF · acción roja (CTA)"
      }, {
        value: "neutral",
        label: "Neutro · acción esmeralda"
      }],
      onChange: v => setTweak("brand", v)
    })));
  }

  // Wizard screen
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: th.bg,
      color: th.body,
      fontFamily: FONT
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    th: th,
    onToggleTheme: toggleTheme
  }), /*#__PURE__*/React.createElement(WizardTopBar, {
    th: th,
    paso: paso,
    saveStatus: saveStatus,
    onBackToJornada: handleBackToJornada
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: 16
    }
  }, renderStep()), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "none",
      display: "flex",
      gap: 8,
      padding: "10px 14px 14px",
      background: th.surface,
      borderTop: `1px solid ${th.border}`,
      alignItems: "stretch"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setFotos(f => Math.min(5, f + 1)),
    disabled: fotos >= 5,
    title: fotos >= 5 ? "Límite alcanzado" : "Agregar foto",
    style: {
      flex: "none",
      width: 56,
      borderRadius: 13,
      border: `1px solid ${th.border}`,
      background: th.surfaceAlt,
      cursor: fotos >= 5 ? "not-allowed" : "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: fotos >= 5 ? th.faint : th.body,
      gap: 2,
      fontFamily: FONT,
      opacity: fotos >= 5 ? 0.45 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      lineHeight: 1
    }
  }, "\uD83D\uDCF7"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700
    }
  }, fotos, "/5")), paso > 1 && /*#__PURE__*/React.createElement("button", {
    onClick: handleBack,
    style: {
      flex: "none",
      width: 72,
      borderRadius: 13,
      border: `2px solid ${th.border}`,
      background: th.surface,
      color: th.body,
      fontFamily: FONT,
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "Atr\xE1s"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(PrimaryBtn, {
    th: th,
    onClick: handleNext,
    disabled: paso === 1 && !s1.sexo
  }, paso < 7 ? "Siguiente →" : "Completar ✓"))), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Apariencia"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Tema",
    value: t.theme,
    options: ["dark", "light"],
    onChange: v => setTweak("theme", v)
  }), /*#__PURE__*/React.createElement(TweakSelect, {
    label: "Identidad SF",
    value: t.brand,
    options: [{
      value: "sf",
      label: "Azul SF · acción esmeralda"
    }, {
      value: "sfRedCta",
      label: "Azul SF · acción roja (CTA)"
    }, {
      value: "neutral",
      label: "Neutro · acción esmeralda"
    }],
    onChange: v => setTweak("brand", v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Ir a paso"
  }), /*#__PURE__*/React.createElement(TweakNumber, {
    label: "Paso (1-7)",
    value: paso,
    min: 1,
    max: 7,
    onChange: v => setPaso(Number(v))
  })));
}
window.CalidadLimaApp = App;
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_calidad_lima/calidad-lima.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calidad-lima/CalidadControls.jsx
try { (() => {
// CalidadControls — controles de diseño para el wizard de Calidad Lima
// Tema claro/oscuro, identidad San Fernando (azul + rojo CTA).

const FONT = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace';
const SF_RED = "#E2231A";
const SF_RED_DK = "#FF4A3D";
const SF_BLUE = "#0B4EA2";
function makeTheme(mode, brand) {
  const dark = mode === "dark";
  const base = dark ? {
    bg: "#08101a",
    surface: "#101c2c",
    surfaceAlt: "#182436",
    raised: "#1e2d40",
    strong: "#f0f6ff",
    body: "#dce8f5",
    muted: "#8ca8c5",
    faint: "#4d6b88",
    border: "#1e3048",
    borderStrong: "#2a4060",
    emerald: "#34d399",
    emeraldText: "#062b20",
    okBg: "rgba(3,105,161,.18)",
    okText: "#7DD3FC",
    danger: "#f87171",
    dangerBg: "rgba(248,113,113,.16)",
    dangerText: "#fca5a5",
    warn: "#fb923c",
    warnBg: "rgba(251,146,60,.16)",
    warnText: "#fdba74",
    red: SF_RED_DK,
    blue: "#1769c7",
    shadow: "0 8px 24px rgba(0,0,0,.55)"
  } : {
    bg: "#f5f6f8",
    surface: "#ffffff",
    surfaceAlt: "#f1f5f9",
    raised: "#ffffff",
    strong: "#0f172a",
    body: "#1a1a1a",
    muted: "#64748b",
    faint: "#94a3b8",
    border: "#e2e8f0",
    borderStrong: "#cbd5e1",
    emerald: "#059669",
    emeraldText: "#ffffff",
    okBg: "#d1fae5",
    okText: "#047857",
    danger: "#dc2626",
    dangerBg: "#fee2e2",
    dangerText: "#b91c1c",
    warn: "#d97706",
    warnBg: "#fef3c7",
    warnText: "#b45309",
    red: SF_RED,
    blue: SF_BLUE,
    shadow: "0 8px 24px rgba(15,23,42,.16)"
  };
  const redCta = brand === "sfRedCta";
  const action = redCta ? base.red : base.emerald;
  const actionText = redCta ? "#ffffff" : base.emeraldText;
  const headerBg = brand === "neutral" ? base.surface : base.blue;
  const headerText = brand === "neutral" ? base.strong : "#ffffff";
  const danger = redCta ? base.warn : base.danger;
  const dangerBg = redCta ? base.warnBg : base.dangerBg;
  const dangerText = redCta ? base.warnText : base.dangerText;
  return {
    ...base,
    dark,
    action,
    actionText,
    headerBg,
    headerText,
    danger,
    dangerBg,
    dangerText,
    brand
  };
}

// ---- BigInput — campo grande táctil ----------------------------------------
function BigInput({
  th,
  label,
  type,
  value,
  onChange,
  placeholder,
  optional
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 6
    }
  }, label, optional && /*#__PURE__*/React.createElement("span", {
    style: {
      color: th.faint,
      fontSize: 12,
      marginLeft: 6
    }
  }, "(opcional)")), /*#__PURE__*/React.createElement("input", {
    type: type || "text",
    inputMode: type === "number" ? "decimal" : undefined,
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      fontSize: 16,
      color: th.strong,
      fontFamily: FONT,
      outline: "none"
    }
  }));
}

// ---- Counter — −/número/+ para conteos -------------------------------------
function Counter({
  th,
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 16,
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: th.body,
      flex: 1,
      lineHeight: 1.3
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChange(Math.max(0, value - 1)),
    style: {
      width: 44,
      height: 44,
      borderRadius: 12,
      fontFamily: FONT,
      background: th.surface,
      border: `1px solid ${th.borderStrong}`,
      color: th.body,
      fontSize: 22,
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "\u2212"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 0,
    value: value || "",
    onChange: e => onChange(Math.max(0, Number(e.target.value) || 0)),
    style: {
      width: 60,
      textAlign: "center",
      background: th.surface,
      border: `1px solid ${th.border}`,
      borderRadius: 10,
      padding: "8px 4px",
      fontSize: 18,
      fontWeight: 700,
      color: th.strong,
      fontFamily: MONO
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChange(value + 1),
    style: {
      width: 44,
      height: 44,
      borderRadius: 12,
      fontFamily: FONT,
      background: th.okBg,
      border: `1px solid ${th.emerald}`,
      color: th.okText,
      fontSize: 22,
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "+")));
}

// ---- PrimaryBtn -----------------------------------------------------------
function PrimaryBtn({
  th,
  children,
  onClick,
  disabled
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    style: {
      width: "100%",
      border: "none",
      borderRadius: 16,
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? th.border : th.action,
      color: disabled ? th.faint : th.actionText,
      fontFamily: FONT,
      fontSize: 18,
      fontWeight: 800,
      minHeight: 60,
      opacity: disabled ? 0.6 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, children);
}
window.CalidadLimaControls = {
  makeTheme,
  BigInput,
  Counter,
  PrimaryBtn,
  FONT,
  MONO,
  SF_RED,
  SF_BLUE
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calidad-lima/CalidadControls.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calidad-lima/CalidadLima.jsx
try { (() => {
// Calidad Clientes Lima — prototipo fiel al wizard de jornadas
// Flujo: Jornada detail → Wizard 7 pasos → Evaluación completa
const C = window.CalidadLimaControls;
const {
  makeTheme,
  BigInput,
  Counter,
  PrimaryBtn,
  FONT,
  MONO
} = C;

// ---- Datos de muestra ------------------------------------------------------
const PLANTELES = [{
  codigo: "P006",
  label: "P006 · Norte (Lima)"
}, {
  codigo: "P007",
  label: "P007 · Sur (Lima)"
}, {
  codigo: "P012",
  label: "P012 · Centro (Lima)"
}, {
  codigo: "P015",
  label: "P015 · Callao"
}];
const PRINCIPALES = [{
  id: "fl",
  nombre: "Flacas"
}, {
  id: "he",
  nombre: "Heridas"
}, {
  id: "tu",
  nombre: "Tumores"
}, {
  id: "fp",
  nombre: "Fractura pechuga"
}, {
  id: "co",
  nombre: "Congestión"
}];
const CATALOGO_ADICIONAL = [{
  id: "br",
  nombre: "Brucelosis"
}, {
  id: "ce",
  nombre: "Celulitis"
}, {
  id: "cn",
  nombre: "Contaminación"
}, {
  id: "pe",
  nombre: "Pelo"
}, {
  id: "cl",
  nombre: "Cloaca"
}];
const MERMA_ALAS = [{
  id: "ag1",
  nombre: "Alas Grado 1°"
}, {
  id: "ag2",
  nombre: "Alas Grado 2°"
}, {
  id: "ag3",
  nombre: "Alas Grado 3°"
}, {
  id: "ar",
  nombre: "Alas Rota"
}];
const MERMA_PIERNA = [{
  id: "pg1",
  nombre: "Pierna Grado 1°"
}, {
  id: "pg2",
  nombre: "Pierna Grado 2°"
}, {
  id: "pg3",
  nombre: "Pierna Grado 3°"
}, {
  id: "pr",
  nombre: "Pierna Rota"
}];
const GRADOS_HEM = [{
  key: "GRADO1",
  label: "1er grado"
}, {
  key: "GRADO2",
  label: "2do grado"
}, {
  key: "GRADO3",
  label: "3er grado"
}];
const UBIC_HEM = [{
  key: "ALA",
  label: "Ala"
}, {
  key: "ESPINAZO",
  label: "Espin."
}, {
  key: "PECHUGA",
  label: "Pech."
}, {
  key: "PIERNA",
  label: "Pierna"
}];
const PASO_LABELS = ["Datos del camión", "Temperaturas", "Almohadillas y Rasguños", "Hematomas", "Pigmentación", "Selección", "Merma y cierre"];
const SAMPLE_EVALS = [{
  sexo: "MACHO",
  plantel: "P006",
  galpon: "11",
  corral: "A",
  estado: "COMPLETA",
  paso: 7
}, {
  sexo: "HEMBRA",
  plantel: "P007",
  galpon: "08",
  corral: "B",
  estado: "COMPLETA",
  paso: 7
}, {
  sexo: "MACHO",
  plantel: "P012",
  galpon: "03",
  corral: "A",
  estado: "BORRADOR",
  paso: 3
}];

// ---- Helpers ----------------------------------------------------------------
function buildComplex(plantelQuery, campania, galpon, sexo, corral) {
  const code = plantelQuery ? plantelQuery.split(" ")[0] : "";
  const sx = sexo === "MACHO" ? "M" : sexo === "HEMBRA" ? "H" : "";
  const parts = [code, campania || "", galpon || "", sx, corral || ""];
  if (parts.every(p => !p)) return "";
  return parts.join("-");
}
function useSaveStatus() {
  const [status, setStatus] = React.useState("idle");
  const timerRef = React.useRef(null);
  function trigger() {
    clearTimeout(timerRef.current);
    setStatus("saving");
    timerRef.current = setTimeout(() => {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1800);
    }, 700);
  }
  return [status, trigger];
}

// ---- AppHeader (SF brand) ---------------------------------------------------
function AppHeader({
  th,
  onToggleTheme
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: th.headerBg,
      color: th.headerText,
      padding: "9px 14px",
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      fontSize: 16,
      letterSpacing: "-.02em",
      flex: "none"
    }
  }, "San Fernando"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      opacity: .75,
      fontWeight: 700,
      letterSpacing: ".06em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, "Calidad \xB7 Clientes Lima")), /*#__PURE__*/React.createElement("button", {
    onClick: onToggleTheme,
    "aria-label": "Cambiar tema",
    style: {
      border: `1px solid rgba(255,255,255,.35)`,
      background: "transparent",
      color: th.headerText,
      borderRadius: 999,
      width: 36,
      height: 36,
      cursor: "pointer",
      fontSize: 15,
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, th.dark ? "☀" : "☾"));
}

// ---- WizardTopBar (paso, label, autosave, barra de progreso) ----------------
function WizardTopBar({
  th,
  paso,
  saveStatus,
  onBackToJornada
}) {
  const saved = saveStatus === "saved";
  const saving = saveStatus === "saving";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "none",
      background: th.surface,
      borderBottom: `1px solid ${th.border}`,
      padding: "10px 16px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBackToJornada,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: th.action,
      fontFamily: FONT,
      fontSize: 13,
      fontWeight: 600,
      padding: 0
    }
  }, "\u2190 Jornada"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, saving && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: th.faint
    }
  }, "Guardando\u2026"), saved && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: th.emerald
    }
  }, "Guardado \u2713"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: th.muted,
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 999,
      padding: "3px 10px"
    }
  }, paso, " / 7"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      color: th.strong,
      marginBottom: 10,
      lineHeight: 1.2
    }
  }, PASO_LABELS[paso - 1]), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, Array.from({
    length: 7
  }, (_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: 5,
      borderRadius: 3,
      background: i < paso ? th.action : th.border,
      opacity: i < paso ? 1 : 0.5
    }
  }))));
}

// ---- DefectoCard (pasos 6 + 7) ---------------------------------------------
function DefectoCard({
  th,
  nombre,
  vals,
  onChange,
  onRemove
}) {
  const v = vals || {
    unidades: 0,
    kg: 0
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong
    }
  }, nombre), onRemove && /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: th.faint,
      fontSize: 22,
      lineHeight: 1,
      padding: "2px 6px"
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, [{
    f: "unidades",
    label: "Unidades",
    step: "1"
  }, {
    f: "kg",
    label: "Kg",
    step: "0.01"
  }].map(({
    f,
    label,
    step
  }) => /*#__PURE__*/React.createElement("label", {
    key: f,
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: th.muted,
      display: "block",
      marginBottom: 4
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 0,
    step: step,
    inputMode: "decimal",
    value: v[f] || "",
    onChange: e => onChange(f, Number(e.target.value) || 0),
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: th.surface,
      border: `1px solid ${th.border}`,
      borderRadius: 10,
      padding: "10px 10px",
      fontSize: 16,
      fontWeight: 700,
      color: th.strong,
      fontFamily: MONO
    }
  })))));
}

// ---- Jornada detail screen -------------------------------------------------
function JornadaScreen({
  th,
  evals,
  onEnterEval,
  onNewEval,
  onToggleTheme
}) {
  const fecha = "sábado 28 de junio de 2026";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: th.bg,
      fontFamily: FONT
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    th: th,
    onToggleTheme: onToggleTheme
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 16px 6px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: th.action,
      fontWeight: 600
    }
  }, "\u2190 Jornadas"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: th.strong,
      marginTop: 2
    }
  }, fecha), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: th.muted,
      marginTop: 2
    }
  }, "AKIM S.A. \xB7 Ram\xEDrez, C.")), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "10px 16px",
      background: th.surface,
      border: `1px solid ${th.border}`,
      borderRadius: 16,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong,
      marginBottom: 12
    }
  }, "Saldo d\xEDa anterior"), ["MACHO", "HEMBRA"].map(sexo => /*#__PURE__*/React.createElement("div", {
    key: sexo,
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: th.muted,
      marginBottom: 8
    }
  }, sexo), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 6
    }
  }, ["Unidades", "Jabas", "Kg"].map(f => /*#__PURE__*/React.createElement("label", {
    key: f,
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: th.faint,
      display: "block",
      marginBottom: 3
    }
  }, f), /*#__PURE__*/React.createElement("input", {
    type: "number",
    defaultValue: "",
    inputMode: "decimal",
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 8,
      padding: "8px 8px",
      fontSize: 14,
      fontWeight: 600,
      color: th.strong,
      fontFamily: MONO
    }
  }))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "10px 16px",
      background: th.surface,
      border: `1px solid ${th.border}`,
      borderRadius: 16,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong,
      marginBottom: 12
    }
  }, "Evaluaciones del d\xEDa"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginBottom: 12
    }
  }, evals.map((ev, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => onEnterEval(ev),
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 12,
      padding: "12px 14px",
      cursor: "pointer",
      textAlign: "left",
      fontFamily: FONT
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 999,
      background: ev.sexo === "MACHO" ? "#dbeafe" : "#fce7f3",
      color: ev.sexo === "MACHO" ? "#1d4ed8" : "#be185d"
    }
  }, ev.sexo), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: th.body
    }
  }, ev.plantel, ev.galpon ? ` · ${ev.galpon}${ev.corral}` : "")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: ev.estado === "COMPLETA" ? th.okText : th.warn
    }
  }, ev.estado === "COMPLETA" ? "Completa ✓" : `Paso ${ev.paso}/7`)))), /*#__PURE__*/React.createElement("button", {
    onClick: onNewEval,
    style: {
      width: "100%",
      background: "none",
      border: `2px dashed ${th.action}`,
      borderRadius: 14,
      padding: "14px",
      fontSize: 15,
      fontWeight: 700,
      color: th.action,
      cursor: "pointer",
      fontFamily: FONT
    }
  }, "+ Nueva evaluaci\xF3n")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  })));
}

// ---- PASO 1: Datos del camión -----------------------------------------------
function Step1({
  th,
  state,
  set
}) {
  const {
    plantelQuery,
    campania,
    galpon,
    sexo,
    corral,
    jabas,
    cantidad,
    promVivo,
    promBeneficiado,
    nroGuia
  } = state;
  const complex = buildComplex(plantelQuery, campania, galpon, sexo, corral);
  const sexoOpts = [{
    v: "MACHO",
    label: "Macho",
    light: {
      bg: "#dbeafe",
      border: "#2563eb",
      text: "#1d4ed8"
    },
    dark: {
      bg: "#1e3a5f",
      border: "#60a5fa",
      text: "#bfdbfe"
    }
  }, {
    v: "HEMBRA",
    label: "Hembra",
    light: {
      bg: "#fce7f3",
      border: "#db2777",
      text: "#9d174d"
    },
    dark: {
      bg: "#4a1942",
      border: "#f472b6",
      text: "#fbcfe8"
    }
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 6
    }
  }, "Plantel"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    list: "plantel-opts",
    value: plantelQuery,
    onChange: e => set("plantelQuery", e.target.value),
    placeholder: "Busca por c\xF3digo\u2026",
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      fontSize: 16,
      color: th.strong,
      fontFamily: FONT
    }
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "plantel-opts"
  }, PLANTELES.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.codigo,
    value: p.label
  })))), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Campa\xF1a",
    type: "text",
    value: campania,
    onChange: v => set("campania", v),
    placeholder: "Ej. 2401",
    optional: true
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Galp\xF3n",
    type: "text",
    value: galpon,
    onChange: v => set("galpon", v),
    placeholder: "Ej. 11"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 8
    }
  }, "Sexo ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: th.danger
    }
  }, "*")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, sexoOpts.map(s => {
    const sel = sexo === s.v;
    const c = th.dark ? s.dark : s.light;
    return /*#__PURE__*/React.createElement("button", {
      key: s.v,
      onClick: () => set("sexo", s.v),
      style: {
        minHeight: 68,
        borderRadius: 16,
        cursor: "pointer",
        fontFamily: FONT,
        border: `2px solid ${sel ? c.border : th.border}`,
        background: sel ? c.bg : th.surface,
        color: sel ? c.text : th.muted,
        fontSize: 18,
        fontWeight: 800
      }
    }, s.label);
  }))), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Corral",
    type: "text",
    value: corral,
    onChange: v => set("corral", v),
    placeholder: "Ej. A",
    optional: true
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Jabas",
    type: "number",
    value: jabas,
    onChange: v => set("jabas", v)
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Unidades (cantidad de aves)",
    type: "number",
    value: cantidad,
    onChange: v => set("cantidad", v)
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Promedio vivo (kg)",
    type: "number",
    value: promVivo,
    onChange: v => set("promVivo", v),
    optional: true
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Promedio beneficiado (kg)",
    type: "number",
    value: promBeneficiado,
    onChange: v => set("promBeneficiado", v),
    optional: true
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "N\xB0 de Gu\xEDa",
    type: "text",
    value: nroGuia,
    onChange: v => set("nroGuia", v),
    optional: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: "14px 16px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 4
    }
  }, "Complex Entity"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: MONO,
      fontSize: 15,
      color: th.strong
    }
  }, complex || "—"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: th.faint,
      marginTop: 4
    }
  }, "Plantel-Campa\xF1a-Galp\xF3n-Sexo-Corral \xB7 calculado autom\xE1ticamente")));
}

// ---- PASO 2: Temperaturas --------------------------------------------------
function Step2({
  th,
  state,
  set
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: th.muted
    }
  }, "Registra las temperaturas en \xB0C al momento de la descarga."), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Veh\xEDculo con jabas (\xB0C)",
    type: "number",
    value: state.tempCamion,
    onChange: v => set("tempCamion", v)
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Plataforma sin jabas (\xB0C)",
    type: "number",
    value: state.tempPlatVacia,
    onChange: v => set("tempPlatVacia", v)
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Plataforma con jabas (\xB0C)",
    type: "number",
    value: state.tempPlat,
    onChange: v => set("tempPlat", v)
  }), /*#__PURE__*/React.createElement(BigInput, {
    th: th,
    label: "Densidad (aves/m\xB2)",
    type: "number",
    value: state.densidad,
    onChange: v => set("densidad", v),
    optional: true
  }));
}

// ---- PASO 3: Almohadillas y Rasguños ----------------------------------------
function Step3({
  th,
  state,
  set
}) {
  const {
    alm,
    ras
  } = state;
  const almT = alm.sinLesion + alm.leve + alm.grave;
  const rasT = ras.sinLesion + ras.leve + ras.grave;
  const sec = [{
    key: "alm",
    label: "Almohadillas",
    total: almT,
    vals: alm,
    fields: ["sinLesion", "leve", "grave"],
    labels: ["Sin lesión", "Leve", "Grave"]
  }, {
    key: "ras",
    label: "Rasguños",
    total: rasT,
    vals: ras,
    fields: ["sinLesion", "leve", "grave"],
    labels: ["Sin lesión", "Leve", "Severo"]
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: th.muted
    }
  }, "Muestra de 200 aves. Registra almohadillas y rasgu\xF1os simult\xE1neamente."), sec.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.key
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: th.strong
    }
  }, s.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: th.muted
    }
  }, "Muestra: ", s.total)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, s.fields.map((f, i) => /*#__PURE__*/React.createElement(Counter, {
    key: f,
    th: th,
    label: s.labels[i],
    value: s.vals[f],
    onChange: v => set(s.key, {
      ...s.vals,
      [f]: v
    })
  }))))));
}

// ---- PASO 4: Hematomas -----------------------------------------------------
function Step4({
  th,
  state,
  set
}) {
  const {
    hemCon,
    hemSin,
    hemDetalle
  } = state;
  const detTotal = Object.values(hemDetalle).reduce((a, b) => a + b, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: th.muted
    }
  }, "Muestra de 50 aves."), /*#__PURE__*/React.createElement(Counter, {
    th: th,
    label: "Con hematoma",
    value: hemCon,
    onChange: v => set("hemCon", v)
  }), /*#__PURE__*/React.createElement(Counter, {
    th: th,
    label: "Sin hematoma",
    value: hemSin,
    onChange: v => set("hemSin", v)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 12,
      padding: "10px 14px",
      fontSize: 14,
      color: th.body
    }
  }, "Total evaluadas: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: MONO
    }
  }, hemCon + hemSin), " / 50"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong
    }
  }, "Grado \xD7 Ubicaci\xF3n"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: th.muted
    }
  }, "Total: ", detTotal, " / ", hemCon)), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "5px 8px",
      textAlign: "left",
      color: th.muted,
      fontWeight: 600
    }
  }), UBIC_HEM.map(u => /*#__PURE__*/React.createElement("th", {
    key: u.key,
    style: {
      padding: "5px 4px",
      textAlign: "center",
      color: th.muted,
      fontWeight: 600,
      fontSize: 12
    }
  }, u.label)))), /*#__PURE__*/React.createElement("tbody", null, GRADOS_HEM.map(g => /*#__PURE__*/React.createElement("tr", {
    key: g.key
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "4px 8px",
      color: th.body,
      fontWeight: 600,
      fontSize: 12,
      whiteSpace: "nowrap"
    }
  }, g.label), UBIC_HEM.map(u => {
    const k = `${g.key}_${u.key}`;
    return /*#__PURE__*/React.createElement("td", {
      key: u.key,
      style: {
        padding: 4
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "number",
      min: 0,
      inputMode: "numeric",
      value: hemDetalle[k] || "",
      onChange: e => set("hemDetalle", {
        ...hemDetalle,
        [k]: Number(e.target.value) || 0
      }),
      style: {
        width: "100%",
        maxWidth: 54,
        textAlign: "center",
        background: th.surface,
        border: `1px solid ${th.border}`,
        borderRadius: 8,
        padding: "9px 4px",
        fontSize: 15,
        fontWeight: 600,
        color: th.strong,
        fontFamily: MONO
      }
    }));
  }))))))));
}

// ---- PASO 5: Pigmentación --------------------------------------------------
function Step5({
  th,
  state,
  set
}) {
  const {
    pig
  } = state;
  const total = pig.reduce((a, b) => a + b, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: th.muted
    }
  }, "Muestra de 100 aves. Total: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: MONO
    }
  }, total), " / 100"), pig.map((val, nivel) => /*#__PURE__*/React.createElement(Counter, {
    key: nivel,
    th: th,
    label: `Nivel ${nivel}`,
    value: val,
    onChange: v => {
      const n = [...pig];
      n[nivel] = v;
      set("pig", n);
    }
  })));
}

// ---- PASO 6: Selección -----------------------------------------------------
function Step6({
  th,
  state,
  set
}) {
  const {
    defectos,
    extraIds,
    cantidad
  } = state;
  const extras = CATALOGO_ADICIONAL.filter(d => extraIds.includes(d.id));
  const disponibles = CATALOGO_ADICIONAL.filter(d => !extraIds.includes(d.id));
  const totalUnid = Object.values(defectos).reduce((a, d) => a + (d.unidades || 0), 0);
  const totalKg = Object.values(defectos).reduce((a, d) => a + (d.kg || 0), 0);
  function updDef(id, field, v) {
    set("defectos", {
      ...defectos,
      [id]: {
        ...(defectos[id] || {
          unidades: 0,
          kg: 0
        }),
        [field]: v
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: th.muted
    }
  }, "Aves que entrega el cliente como selecci\xF3n. Un defecto por ave."), /*#__PURE__*/React.createElement("div", {
    style: {
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 12,
      padding: "10px 14px",
      fontSize: 14,
      color: th.body
    }
  }, "Total: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: MONO
    }
  }, totalUnid), " unid \xB7 ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: MONO
    }
  }, totalKg.toFixed(2)), " kg"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: th.muted
    }
  }, "Defectos principales"), PRINCIPALES.map(t => /*#__PURE__*/React.createElement(DefectoCard, {
    key: t.id,
    th: th,
    nombre: t.nombre,
    vals: defectos[t.id],
    onChange: (f, v) => updDef(t.id, f, v)
  })), extras.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: th.muted
    }
  }, "Defectos adicionales"), extras.map(t => /*#__PURE__*/React.createElement(DefectoCard, {
    key: t.id,
    th: th,
    nombre: t.nombre,
    vals: defectos[t.id],
    onChange: (f, v) => updDef(t.id, f, v),
    onRemove: () => set("extraIds", extraIds.filter(x => x !== t.id))
  })), disponibles.length > 0 && /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 6
    }
  }, "+ Agregar defecto"), /*#__PURE__*/React.createElement("select", {
    value: "",
    onChange: e => {
      if (e.target.value) set("extraIds", [...extraIds, e.target.value]);
    },
    style: {
      width: "100%",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      fontSize: 15,
      color: th.strong,
      fontFamily: FONT
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Selecciona\u2026"), disponibles.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.nombre)))));
}

// ---- PASO 7: Merma y cierre ------------------------------------------------
function Step7({
  th,
  state,
  set
}) {
  const {
    merma,
    observaciones
  } = state;
  function updMerma(id, field, v) {
    set("merma", {
      ...merma,
      [id]: {
        ...(merma[id] || {
          unidades: 0,
          kg: 0
        }),
        [field]: v
      }
    });
  }
  const groups = [{
    label: "Alas",
    tipos: MERMA_ALAS
  }, {
    label: "Pierna",
    tipos: MERMA_PIERNA
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong
    }
  }, "Mutilados / Merma"), groups.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.label,
    style: {
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 16,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: th.strong,
      display: "block",
      marginBottom: 12
    }
  }, g.label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, g.tipos.map(t => /*#__PURE__*/React.createElement(DefectoCard, {
    key: t.id,
    th: th,
    nombre: t.nombre,
    vals: merma[t.id],
    onChange: (f, v) => updMerma(t.id, f, v)
  }))))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: th.muted,
      display: "block",
      marginBottom: 6
    }
  }, "Observaciones"), /*#__PURE__*/React.createElement("textarea", {
    rows: 4,
    value: observaciones,
    onChange: e => set("observaciones", e.target.value),
    placeholder: "Notas adicionales\u2026",
    style: {
      width: "100%",
      boxSizing: "border-box",
      background: th.surfaceAlt,
      border: `1px solid ${th.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      fontSize: 15,
      color: th.strong,
      fontFamily: FONT,
      resize: "none"
    }
  })));
}

// ---- App -------------------------------------------------------------------
const TWEAK_DEFAULTS = {
  theme: "dark",
  brand: "sf",
  paso: 1
};
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const th = makeTheme(t.theme, t.brand);
  const toggleTheme = () => setTweak("theme", th.dark ? "light" : "dark");
  const [view, setView] = React.useState("jornada"); // "jornada" | "wizard" | "complete"
  const [paso, setPaso] = React.useState(1);
  const [fotos, setFotos] = React.useState(0);
  const [saveStatus, triggerSave] = useSaveStatus();
  const [evals, setEvals] = React.useState(SAMPLE_EVALS);

  // Step state
  const [s1, setS1] = React.useState({
    plantelQuery: "",
    campania: "",
    galpon: "",
    sexo: null,
    corral: "",
    jabas: "",
    cantidad: "",
    promVivo: "",
    promBeneficiado: "",
    nroGuia: ""
  });
  const [s2, setS2] = React.useState({
    tempCamion: "",
    tempPlatVacia: "",
    tempPlat: "",
    densidad: ""
  });
  const [s3, setS3] = React.useState({
    alm: {
      sinLesion: 0,
      leve: 0,
      grave: 0
    },
    ras: {
      sinLesion: 0,
      leve: 0,
      grave: 0
    }
  });
  const [s4, setS4] = React.useState({
    hemCon: 0,
    hemSin: 0,
    hemDetalle: {}
  });
  const [s5, setS5] = React.useState({
    pig: [0, 0, 0, 0, 0, 0, 0, 0]
  });
  const [s6, setS6] = React.useState({
    defectos: {},
    extraIds: []
  });
  const [s7, setS7] = React.useState({
    merma: {},
    observaciones: ""
  });
  function makeSet(setter) {
    return (k, v) => {
      setter(prev => ({
        ...prev,
        [k]: v
      }));
      triggerSave();
    };
  }
  function resetWizard() {
    setPaso(1);
    setFotos(0);
    setS1({
      plantelQuery: "",
      campania: "",
      galpon: "",
      sexo: null,
      corral: "",
      jabas: "",
      cantidad: "",
      promVivo: "",
      promBeneficiado: "",
      nroGuia: ""
    });
    setS2({
      tempCamion: "",
      tempPlatVacia: "",
      tempPlat: "",
      densidad: ""
    });
    setS3({
      alm: {
        sinLesion: 0,
        leve: 0,
        grave: 0
      },
      ras: {
        sinLesion: 0,
        leve: 0,
        grave: 0
      }
    });
    setS4({
      hemCon: 0,
      hemSin: 0,
      hemDetalle: {}
    });
    setS5({
      pig: [0, 0, 0, 0, 0, 0, 0, 0]
    });
    setS6({
      defectos: {},
      extraIds: []
    });
    setS7({
      merma: {},
      observaciones: ""
    });
  }
  function handleNewEval() {
    resetWizard();
    setView("wizard");
  }
  function handleEnterEval(ev) {
    resetWizard();
    if (ev.estado !== "COMPLETA") setPaso(ev.paso);
    setS1(prev => ({
      ...prev,
      plantelQuery: PLANTELES.find(p => p.codigo === ev.plantel)?.label || "",
      galpon: ev.galpon,
      corral: ev.corral,
      sexo: ev.sexo
    }));
    setView(ev.estado === "COMPLETA" ? "complete" : "wizard");
  }
  function handleNext() {
    if (paso < 7) {
      setPaso(p => p + 1);
      window.scrollTo && window.scrollTo(0, 0);
    } else handleCompletar();
  }
  function handleBack() {
    if (paso > 1) setPaso(p => p - 1);
  }
  function handleCompletar() {
    const plantel = s1.plantelQuery.split(" ")[0] || "P???";
    setEvals(prev => [...prev, {
      sexo: s1.sexo || "MACHO",
      plantel,
      galpon: s1.galpon,
      corral: s1.corral,
      estado: "COMPLETA",
      paso: 7
    }]);
    setView("complete");
  }
  function handleBackToJornada() {
    setView("jornada");
  }
  function renderStep() {
    switch (paso) {
      case 1:
        return /*#__PURE__*/React.createElement(Step1, {
          th: th,
          state: s1,
          set: makeSet(setS1)
        });
      case 2:
        return /*#__PURE__*/React.createElement(Step2, {
          th: th,
          state: s2,
          set: makeSet(setS2)
        });
      case 3:
        return /*#__PURE__*/React.createElement(Step3, {
          th: th,
          state: s3,
          set: makeSet(setS3)
        });
      case 4:
        return /*#__PURE__*/React.createElement(Step4, {
          th: th,
          state: s4,
          set: makeSet(setS4)
        });
      case 5:
        return /*#__PURE__*/React.createElement(Step5, {
          th: th,
          state: s5,
          set: makeSet(setS5)
        });
      case 6:
        return /*#__PURE__*/React.createElement(Step6, {
          th: th,
          state: {
            ...s6,
            cantidad: s1.cantidad
          },
          set: makeSet(setS6)
        });
      case 7:
        return /*#__PURE__*/React.createElement(Step7, {
          th: th,
          state: s7,
          set: makeSet(setS7)
        });
    }
  }

  // Completion screen
  if (view === "complete") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: th.bg,
        fontFamily: FONT
      }
    }, /*#__PURE__*/React.createElement(AppHeader, {
      th: th,
      onToggleTheme: toggleTheme
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        background: th.okBg,
        border: `1px solid ${th.emerald}`,
        borderRadius: 24,
        padding: "40px 28px",
        width: "100%",
        maxWidth: 340
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 56,
        lineHeight: 1
      }
    }, "\u2713"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 800,
        color: th.okText,
        margin: "12px 0 8px"
      }
    }, "Evaluaci\xF3n completa"), /*#__PURE__*/React.createElement("button", {
      onClick: handleBackToJornada,
      style: {
        marginTop: 8,
        background: th.action,
        color: th.actionText,
        border: "none",
        borderRadius: 14,
        padding: "14px 24px",
        fontSize: 16,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: FONT,
        width: "100%"
      }
    }, "Volver a la jornada"))));
  }

  // Jornada detail screen
  if (view === "jornada") {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(JornadaScreen, {
      th: th,
      evals: evals,
      onEnterEval: handleEnterEval,
      onNewEval: handleNewEval,
      onToggleTheme: toggleTheme
    }), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
      label: "Apariencia"
    }), /*#__PURE__*/React.createElement(TweakRadio, {
      label: "Tema",
      value: t.theme,
      options: ["dark", "light"],
      onChange: v => setTweak("theme", v)
    }), /*#__PURE__*/React.createElement(TweakSelect, {
      label: "Identidad SF",
      value: t.brand,
      options: [{
        value: "sf",
        label: "Azul SF · acción esmeralda"
      }, {
        value: "sfRedCta",
        label: "Azul SF · acción roja (CTA)"
      }, {
        value: "neutral",
        label: "Neutro · acción esmeralda"
      }],
      onChange: v => setTweak("brand", v)
    })));
  }

  // Wizard screen
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: th.bg,
      color: th.body,
      fontFamily: FONT
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    th: th,
    onToggleTheme: toggleTheme
  }), /*#__PURE__*/React.createElement(WizardTopBar, {
    th: th,
    paso: paso,
    saveStatus: saveStatus,
    onBackToJornada: handleBackToJornada
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: 16
    }
  }, renderStep()), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "none",
      display: "flex",
      gap: 8,
      padding: "10px 14px 14px",
      background: th.surface,
      borderTop: `1px solid ${th.border}`,
      alignItems: "stretch"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setFotos(f => Math.min(5, f + 1)),
    disabled: fotos >= 5,
    title: fotos >= 5 ? "Límite alcanzado" : "Agregar foto",
    style: {
      flex: "none",
      width: 56,
      borderRadius: 13,
      border: `1px solid ${th.border}`,
      background: th.surfaceAlt,
      cursor: fotos >= 5 ? "not-allowed" : "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: fotos >= 5 ? th.faint : th.body,
      gap: 2,
      fontFamily: FONT,
      opacity: fotos >= 5 ? 0.45 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      lineHeight: 1
    }
  }, "\uD83D\uDCF7"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700
    }
  }, fotos, "/5")), paso > 1 && /*#__PURE__*/React.createElement("button", {
    onClick: handleBack,
    style: {
      flex: "none",
      width: 72,
      borderRadius: 13,
      border: `2px solid ${th.border}`,
      background: th.surface,
      color: th.body,
      fontFamily: FONT,
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "Atr\xE1s"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(PrimaryBtn, {
    th: th,
    onClick: handleNext,
    disabled: paso === 1 && !s1.sexo
  }, paso < 7 ? "Siguiente →" : "Completar ✓"))), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Apariencia"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Tema",
    value: t.theme,
    options: ["dark", "light"],
    onChange: v => setTweak("theme", v)
  }), /*#__PURE__*/React.createElement(TweakSelect, {
    label: "Identidad SF",
    value: t.brand,
    options: [{
      value: "sf",
      label: "Azul SF · acción esmeralda"
    }, {
      value: "sfRedCta",
      label: "Azul SF · acción roja (CTA)"
    }, {
      value: "neutral",
      label: "Neutro · acción esmeralda"
    }],
    onChange: v => setTweak("brand", v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Ir a paso"
  }), /*#__PURE__*/React.createElement(TweakNumber, {
    label: "Paso (1-7)",
    value: paso,
    min: 1,
    max: 7,
    onChange: v => setPaso(Number(v))
  })));
}
window.CalidadLimaApp = App;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calidad-lima/CalidadLima.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calidad-lima/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calidad-lima/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/MobileKit.jsx
try { (() => {
// Mobile scale-capture app screens — "Báscula Ranger BT".
// Faithful Material recreation (blue accent), distinct from the web console.
// Primitives mirror the real Android widgets: filled buttons, underlined
// EditText fields, Spinners, Material Switch, RadioButton rows.
const M = {
  blue: "#1565c0",
  blueDark: "#0d47a1",
  error: "#d32f2f",
  ink: "#1a1a1a",
  muted: "#5f6368",
  hair: "#e0e0e0",
  field: "#f1f3f4",
  bg: "#ffffff",
  ok: "#2e7d32",
  amber: "#e65100",
  amberBg: "#fff3e0"
};
function MButton({
  children,
  onClick,
  disabled,
  kind = "filled",
  big,
  style
}) {
  const base = {
    width: "100%",
    border: "none",
    borderRadius: 8,
    cursor: disabled ? "default" : "pointer",
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    letterSpacing: ".02em",
    padding: big ? "20px" : "12px 16px",
    fontSize: big ? 18 : 14,
    textTransform: "uppercase"
  };
  const kinds = {
    filled: {
      background: disabled ? "#c7d6ea" : M.blue,
      color: "#fff"
    },
    outline: {
      background: "transparent",
      color: disabled ? "#9e9e9e" : M.blue,
      border: `1px solid ${disabled ? "#cfcfcf" : M.blue}`
    },
    text: {
      background: "transparent",
      color: M.blue,
      textTransform: "none",
      letterSpacing: 0,
      fontWeight: 500,
      padding: 0,
      width: "auto"
    }
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: disabled ? undefined : onClick,
    style: {
      ...base,
      ...kinds[kind],
      ...style
    }
  }, children);
}
function MField({
  label,
  value,
  onChange,
  type = "text",
  placeholder
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12,
      color: M.muted,
      marginBottom: 4
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange?.(e.target.value),
    type: type,
    placeholder: placeholder,
    style: {
      width: "100%",
      boxSizing: "border-box",
      border: "none",
      borderBottom: `2px solid ${M.blue}`,
      background: M.field,
      borderRadius: "4px 4px 0 0",
      padding: "10px 12px",
      fontSize: 15,
      fontFamily: "var(--font-sans)",
      color: M.ink,
      outline: "none"
    }
  }));
}

// Material Spinner — a dropdown with the underline + caret look.
function MSelect({
  label,
  value,
  onChange,
  options,
  bold
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      marginBottom: 14
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12,
      fontWeight: bold ? 700 : 400,
      color: bold ? M.ink : M.muted,
      marginBottom: 4
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: e => onChange?.(e.target.value),
    style: {
      width: "100%",
      boxSizing: "border-box",
      appearance: "none",
      WebkitAppearance: "none",
      border: "none",
      borderBottom: `1px solid ${M.muted}`,
      background: "transparent",
      padding: "8px 24px 8px 2px",
      fontSize: 15,
      fontFamily: "var(--font-sans)",
      color: M.ink,
      outline: "none"
    }
  }, options.map(o => {
    const val = typeof o === "object" ? o.value : o;
    const lab = typeof o === "object" ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: val,
      value: val
    }, lab);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 2,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      color: M.muted,
      fontSize: 11
    }
  }, "\u25BC")));
}
function MSwitch({
  checked,
  onChange,
  label,
  size = 13
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 0",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size,
      color: M.ink
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    onClick: () => onChange(!checked),
    style: {
      position: "relative",
      width: 38,
      height: 16,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: 0,
      width: "100%",
      height: 12,
      borderRadius: 6,
      background: checked ? "#90b4e0" : "#bdbdbd"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 0,
      left: checked ? 20 : 0,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: checked ? M.blue : "#fafafa",
      boxShadow: "0 1px 3px rgba(0,0,0,.3)"
    }
  })));
}
function MRadioRow({
  label,
  options,
  value,
  onChange,
  size = 12
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, label && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: M.muted,
      marginBottom: 2
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, options.map(o => /*#__PURE__*/React.createElement("label", {
    key: o.value,
    onClick: () => onChange(o.value),
    style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: 5,
      cursor: "pointer",
      fontSize: size
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      borderRadius: "50%",
      border: `2px solid ${value === o.value ? M.blue : "#9e9e9e"}`,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none"
    }
  }, value === o.value && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: M.blue
    }
  })), o.label))));
}

// ---- App bar ----
function MAppBar({
  title,
  action,
  nav
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: M.blue,
      color: "#fff",
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flex: "none",
      boxShadow: "0 2px 4px rgba(0,0,0,.2)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      minWidth: 0
    }
  }, nav, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, title)), action);
}
window.Mobile = {
  M,
  MButton,
  MField,
  MSelect,
  MSwitch,
  MRadioRow,
  MAppBar
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/MobileKit.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/DashboardScreen.jsx
try { (() => {
// DashboardScreen — recreation of /dashboard. KPI row + chart cards.
const NS_DASH = window.ControlDeCalidadAvColaDesignSystem_515b76;
function MiniLineChart({
  data,
  meta
}) {
  // data: [{label, pct}] — simple emerald line + dashed red meta on an SVG grid
  const w = 520,
    h = 200,
    padL = 32,
    padB = 28,
    padT = 12,
    padR = 12;
  const max = Math.max(meta, ...data.map(d => d.pct)) * 1.2;
  const x = i => padL + i / (data.length - 1) * (w - padL - padR);
  const y = v => padT + (1 - v / max) * (h - padT - padB);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.pct)}`).join(" ");
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${h}`,
    style: {
      width: "100%",
      height: "auto"
    }
  }, [0, 0.5, 1].map(t => /*#__PURE__*/React.createElement("line", {
    key: t,
    x1: padL,
    x2: w - padR,
    y1: padT + t * (h - padT - padB),
    y2: padT + t * (h - padT - padB),
    stroke: "var(--divider)",
    strokeWidth: "1"
  })), /*#__PURE__*/React.createElement("line", {
    x1: padL,
    x2: w - padR,
    y1: y(meta),
    y2: y(meta),
    stroke: "var(--accent-meta)",
    strokeWidth: "1.5",
    strokeDasharray: "4 4"
  }), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: "var(--accent-data-1)",
    strokeWidth: "2.5"
  }), data.map((d, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: x(i),
    cy: y(d.pct),
    r: "3",
    fill: "var(--accent-data-1)"
  })), data.map((d, i) => /*#__PURE__*/React.createElement("text", {
    key: i,
    x: x(i),
    y: h - 8,
    fontSize: "10",
    fill: "var(--text-faint)",
    textAnchor: "middle"
  }, d.label)));
}
function MiniBarChart({
  data,
  color = "var(--accent-data-1)"
}) {
  const max = Math.max(...data.map(d => d.value));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, data.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.label,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      flex: "none",
      fontSize: 12,
      color: "var(--text-muted)",
      textAlign: "right"
    }
  }, d.label), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: "var(--slate-100)",
      borderRadius: 4,
      height: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${d.value / max * 100}%`,
      background: color,
      height: "100%",
      borderRadius: 4
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 52,
      flex: "none",
      fontSize: 12,
      fontVariantNumeric: "tabular-nums",
      color: "var(--text-body)"
    }
  }, d.display ?? d.value))));
}
function DashboardScreen() {
  const {
    KpiCard,
    Card
  } = NS_DASH;
  const tendencia = [{
    label: "S22",
    pct: 0.91
  }, {
    label: "S23",
    pct: 1.05
  }, {
    label: "S24",
    pct: 0.88
  }, {
    label: "S25",
    pct: 1.18
  }, {
    label: "S26",
    pct: 1.23
  }];
  const porCliente = [{
    label: "AKIM",
    value: 1.23,
    display: "1.230%"
  }, {
    label: "SUPER",
    value: 1.05,
    display: "1.050%"
  }, {
    label: "REDONDOS",
    value: 0.84,
    display: "0.842%"
  }, {
    label: "OTROS",
    value: 0.62,
    display: "0.620%"
  }];
  const porDefecto = [{
    label: "Hematoma",
    value: 184
  }, {
    label: "Rasguño",
    value: 142
  }, {
    label: "Pododermatitis",
    value: 96
  }, {
    label: "Pigmentación",
    value: 71
  }, {
    label: "Defecto selección",
    value: 58
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "0 0 4px",
      fontSize: "var(--text-xl)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-strong)"
    }
  }, "Dashboard"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 24px",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)"
    }
  }, "Resumen general de inspecciones de todos los verificadores."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 16,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(KpiCard, {
    label: "Inspecciones registradas",
    value: "312"
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Aves inspeccionadas",
    value: "48,210"
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Unidades seleccionadas",
    value: "593"
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "% Selecci\xF3n global",
    value: "1.230%",
    sub: "Meta: 1.2%",
    highlight: "danger"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "% Selecci\xF3n semanal vs meta"
  }, /*#__PURE__*/React.createElement(MiniLineChart, {
    data: tendencia,
    meta: 1.2
  })), /*#__PURE__*/React.createElement(Card, {
    title: "% Selecci\xF3n por cliente"
  }, /*#__PURE__*/React.createElement(MiniBarChart, {
    data: porCliente
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Top defectos (unidades)",
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement(MiniBarChart, {
    data: porDefecto,
    color: "var(--accent-data-2)"
  }))));
}
window.DashboardScreen = DashboardScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/DashboardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/InspeccionesScreen.jsx
try { (() => {
// InspeccionesScreen — recreation of /inspecciones: filter bar + list table.
const NS_INSP = window.ControlDeCalidadAvColaDesignSystem_515b76;
function InspeccionesScreen() {
  const {
    Card,
    Field,
    Select,
    Input,
    Button,
    DataTable,
    Badge
  } = NS_INSP;
  const all = [{
    id: 1,
    fecha: "27/06/2026",
    cliente: "AKIM",
    plantel: "P006 · 12A",
    cantidad: 200,
    pct: "0.842%",
    excede: false,
    verif: "J. Ramos",
    fotos: 3
  }, {
    id: 2,
    fecha: "27/06/2026",
    cliente: "SUPER",
    plantel: "P011 · 04B",
    cantidad: 180,
    pct: "1.430%",
    excede: true,
    verif: "L. Díaz",
    fotos: 1
  }, {
    id: 3,
    fecha: "26/06/2026",
    cliente: "AKIM",
    plantel: "P006 · 09A",
    cantidad: 210,
    pct: "0.910%",
    excede: false,
    verif: "M. Quispe",
    fotos: 0
  }, {
    id: 4,
    fecha: "26/06/2026",
    cliente: "REDONDOS",
    plantel: "P003 · 01A",
    cantidad: 195,
    pct: "1.205%",
    excede: true,
    verif: "J. Ramos",
    fotos: 4
  }, {
    id: 5,
    fecha: "25/06/2026",
    cliente: "AKIM",
    plantel: "P006 · 07B",
    cantidad: 205,
    pct: "0.760%",
    excede: false,
    verif: "L. Díaz",
    fotos: 2
  }];
  const [cliente, setCliente] = React.useState("");
  const rows = all.filter(r => !cliente || r.cliente === cliente);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: "var(--text-xl)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-strong)"
    }
  }, "Inspecciones"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Exportar CSV"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "+ Nueva inspecci\xF3n"))), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 8,
      alignItems: "end"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Cliente"
  }, /*#__PURE__*/React.createElement(Select, {
    value: cliente,
    onChange: e => setCliente(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Todos los clientes"), /*#__PURE__*/React.createElement("option", {
    value: "AKIM"
  }, "AKIM"), /*#__PURE__*/React.createElement("option", {
    value: "SUPER"
  }, "SUPER"), /*#__PURE__*/React.createElement("option", {
    value: "REDONDOS"
  }, "REDONDOS"))), /*#__PURE__*/React.createElement(Field, {
    label: "Verificador"
  }, /*#__PURE__*/React.createElement(Select, {
    defaultValue: ""
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Todos"), /*#__PURE__*/React.createElement("option", null, "J. Ramos"))), /*#__PURE__*/React.createElement(Field, {
    label: "Desde"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "date"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "dark"
  }, "Filtrar"))), /*#__PURE__*/React.createElement(DataTable, {
    rowKey: r => r.id,
    columns: [{
      key: "fecha",
      header: "Fecha",
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: "var(--text-link)",
          cursor: "pointer"
        }
      }, r.fecha)
    }, {
      key: "cliente",
      header: "Cliente"
    }, {
      key: "plantel",
      header: "Plantel / Galpón"
    }, {
      key: "cantidad",
      header: "Cantidad",
      align: "right",
      numeric: true
    }, {
      key: "pct",
      header: "% Selección",
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: r.excede ? "danger" : "ok"
      }, r.pct)
    }, {
      key: "verif",
      header: "Verificador"
    }, {
      key: "fotos",
      header: "Fotos",
      align: "right",
      numeric: true
    }],
    rows: rows,
    empty: "No hay inspecciones registradas con estos filtros."
  }));
}
window.InspeccionesScreen = InspeccionesScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/InspeccionesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/LoginScreen.jsx
try { (() => {
// LoginScreen — recreation of /login. Centered narrow card on the canvas.
const NS_LOGIN = window.ControlDeCalidadAvColaDesignSystem_515b76;
function LoginScreen({
  onLogin
}) {
  const {
    Card,
    Field,
    Input,
    Button,
    Alert
  } = NS_LOGIN;
  const [email, setEmail] = React.useState("supervisor@avicola.com");
  const [pass, setPass] = React.useState("demo1234");
  const [error, setError] = React.useState(null);
  const [pending, setPending] = React.useState(false);
  const submit = e => {
    e.preventDefault();
    setError(null);
    setPending(true);
    setTimeout(() => {
      setPending(false);
      if (pass !== "demo1234") {
        setError("Credenciales inválidas.");
        return;
      }
      onLogin({
        nombre: "María Quispe",
        role: "Supervisor"
      });
    }, 450);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: "var(--container-narrow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#0B4EA2",
      borderRadius: 16,
      padding: "20px 32px",
      marginBottom: 24,
      display: "inline-block"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#fff",
      fontWeight: 800,
      fontSize: "1.6rem",
      letterSpacing: "-.02em",
      lineHeight: 1.1
    }
  }, "San Fernando"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(255,255,255,.75)",
      fontSize: "0.65rem",
      fontWeight: 700,
      letterSpacing: ".07em",
      textTransform: "uppercase",
      marginTop: 4
    }
  }, "Control de Calidad Av\xEDcola")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)"
    }
  }, "Inicia sesi\xF3n para registrar y revisar inspecciones")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Correo",
    htmlFor: "email"
  }, /*#__PURE__*/React.createElement(Input, {
    id: "email",
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "tucorreo@avicola.com"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Contrase\xF1a",
    htmlFor: "pass"
  }, /*#__PURE__*/React.createElement(Input, {
    id: "pass",
    type: "password",
    value: pass,
    onChange: e => setPass(e.target.value),
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  })), error && /*#__PURE__*/React.createElement(Alert, {
    tone: "danger"
  }, error), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    fullWidth: true,
    disabled: pending
  }, pending ? "Ingresando…" : "Ingresar"))), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 24,
      textAlign: "center",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)"
    }
  }, "\xBFNo tienes cuenta? Solic\xEDtala a tu supervisor de calidad.")));
}
window.LoginScreen = LoginScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/LoginScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.KpiCard = __ds_scope.KpiCard;

__ds_ns.StatusDot = __ds_scope.StatusDot;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.AppHeader = __ds_scope.AppHeader;

__ds_ns.NavTabs = __ds_scope.NavTabs;

})();
