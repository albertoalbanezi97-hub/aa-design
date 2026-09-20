/* @ds-bundle: {"format":4,"namespace":"AlbaneziDesignSystem_e1c419","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"32522d2ee0a2","components/core/Button.jsx":"ca30ecf95b4b","components/core/Card.jsx":"ba9f04394ec5","components/core/IconButton.jsx":"a8d52b753e64","components/feedback/Dialog.jsx":"d1357414df40","components/feedback/Toast.jsx":"2068e3b97903","components/feedback/Tooltip.jsx":"5810768297d8","components/forms/Checkbox.jsx":"d3ee22540d5e","components/forms/Input.jsx":"3348184c88b2","components/forms/Radio.jsx":"92f649238cc6","components/forms/Select.jsx":"66f7badceb3e","components/navigation/Tabs.jsx":"e4fd8aadf141","ui_kits/marketing-site/Contact.jsx":"70a29b1943aa","ui_kits/marketing-site/Home.jsx":"c11278950c4d","ui_kits/marketing-site/Process.jsx":"448dcc4d836d","ui_kits/marketing-site/Shell.jsx":"a48742b42f83","ui_kits/marketing-site/Work.jsx":"b7dbb117c8a8"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AlbaneziDesignSystem_e1c419 = window.AlbaneziDesignSystem_e1c419 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function Badge({
  children,
  tone = 'neutral'
}) {
  const tones = {
    neutral: {
      background: 'var(--sand-200)',
      color: 'var(--charcoal-900)'
    },
    brass: {
      background: 'var(--brass-500)',
      color: 'var(--paper-50)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--charcoal-900)',
      border: '1px solid var(--charcoal-900)'
    }
  };
  return React.createElement('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 'var(--text-xs)',
      fontFamily: 'var(--font-sans-body)',
      fontWeight: 600,
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      ...tones[tone]
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const sizes = {
  sm: {
    padding: '8px 16px',
    fontSize: 'var(--text-sm)'
  },
  md: {
    padding: '12px 24px',
    fontSize: 'var(--text-base)'
  },
  lg: {
    padding: '16px 32px',
    fontSize: 'var(--text-lg)'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick,
  style
}) {
  const base = {
    fontFamily: 'var(--font-sans-body)',
    fontWeight: 600,
    letterSpacing: 'var(--tracking-wide)',
    textTransform: 'uppercase',
    fontSize: sizes[size].fontSize,
    padding: sizes[size].padding,
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'background var(--duration-base) var(--ease-standard), color var(--duration-base) var(--ease-standard), border-color var(--duration-base) var(--ease-standard)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    ...style
  };
  const variants = {
    primary: {
      background: 'var(--charcoal-900)',
      color: 'var(--paper-50)',
      borderBottom: '3px solid var(--brass-500)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--charcoal-900)',
      border: '1.5px solid var(--charcoal-900)'
    },
    accent: {
      background: 'var(--brass-500)',
      color: 'var(--paper-50)',
      borderBottom: '3px solid var(--charcoal-900)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--charcoal-700)',
      padding: sizes[size].padding.split(' ')[0] + ' 4px'
    }
  };
  return React.createElement('button', {
    disabled,
    onClick,
    style: {
      ...base,
      ...variants[variant]
    }
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function Card({
  title,
  eyebrow,
  children,
  image,
  variant = 'default',
  style
}) {
  const wrap = {
    background: 'var(--surface-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    boxShadow: variant === 'lifted' ? 'var(--shadow-lifted)' : 'var(--shadow-card)',
    fontFamily: 'var(--font-sans-body)',
    ...style
  };
  return React.createElement('div', {
    style: wrap
  }, image ? React.createElement('div', {
    style: {
      aspectRatio: '4/3',
      background: `center/cover no-repeat url(${image})`,
      backgroundColor: 'var(--sand-200)'
    }
  }) : null, React.createElement('div', {
    style: {
      padding: '24px'
    }
  }, eyebrow ? React.createElement('div', {
    style: {
      fontSize: 'var(--text-xs)',
      letterSpacing: 'var(--tracking-wider)',
      textTransform: 'uppercase',
      color: 'var(--brass-500)',
      fontWeight: 600,
      marginBottom: '8px'
    }
  }, eyebrow) : null, title ? React.createElement('h3', {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontSize: 'var(--text-xl)',
      color: 'var(--charcoal-900)',
      margin: '0 0 8px',
      fontWeight: 600
    }
  }, title) : null, React.createElement('div', {
    style: {
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--charcoal-700)'
    }
  }, children)));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 40,
  onClick
}) {
  const variants = {
    ghost: {
      background: 'transparent',
      border: '1px solid var(--border-subtle)',
      color: 'var(--charcoal-900)'
    },
    solid: {
      background: 'var(--charcoal-900)',
      border: 'none',
      color: 'var(--paper-50)'
    }
  };
  return React.createElement('button', {
    onClick,
    'aria-label': label,
    title: label,
    style: {
      width: size,
      height: size,
      borderRadius: 'var(--radius-sm)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'background var(--duration-fast) var(--ease-standard)',
      ...variants[variant]
    }
  }, icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open,
  title,
  children,
  onClose,
  actions
}) {
  if (!open) return null;
  return React.createElement('div', {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'color-mix(in oklch, var(--charcoal-900) 55%, transparent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }
  }, React.createElement('div', {
    style: {
      background: 'var(--surface-card)',
      width: 'min(480px, 90vw)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lifted)',
      borderTop: '3px solid var(--brass-500)',
      fontFamily: 'var(--font-sans-body)'
    }
  }, React.createElement('div', {
    style: {
      padding: '28px 28px 0'
    }
  }, React.createElement('h3', {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontSize: 'var(--text-xl)',
      margin: 0,
      color: 'var(--charcoal-900)'
    }
  }, title)), React.createElement('div', {
    style: {
      padding: '16px 28px',
      color: 'var(--charcoal-700)',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-relaxed)'
    }
  }, children), React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      padding: '0 28px 28px'
    }
  }, actions)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function Toast({
  tone = 'neutral',
  children
}) {
  const tones = {
    neutral: {
      borderColor: 'var(--charcoal-900)'
    },
    success: {
      borderColor: 'var(--success)'
    },
    danger: {
      borderColor: 'var(--danger)'
    }
  };
  return React.createElement('div', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      background: 'var(--charcoal-900)',
      color: 'var(--paper-50)',
      fontFamily: 'var(--font-sans-body)',
      fontSize: 'var(--text-sm)',
      padding: '14px 18px',
      borderRadius: 'var(--radius-sm)',
      borderLeft: `3px solid ${tones[tone].borderColor === 'var(--charcoal-900)' ? 'var(--brass-500)' : tones[tone].borderColor}`,
      boxShadow: 'var(--shadow-card)'
    }
  }, children);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const {
  useState
} = React;
function Tooltip({
  label,
  children,
  side = 'top'
}) {
  const [show, setShow] = useState(false);
  const pos = {
    top: {
      bottom: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    bottom: {
      top: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)'
    }
  }[side] || {};
  return React.createElement('span', {
    style: {
      position: 'relative',
      display: 'inline-block'
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false)
  }, children, show ? React.createElement('span', {
    style: {
      position: 'absolute',
      ...pos,
      background: 'var(--charcoal-900)',
      color: 'var(--paper-50)',
      fontFamily: 'var(--font-sans-body)',
      fontSize: 'var(--text-xs)',
      padding: '6px 10px',
      borderRadius: 'var(--radius-sm)',
      whiteSpace: 'nowrap',
      zIndex: 10
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  checked,
  onChange,
  disabled
}) {
  return React.createElement('label', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'var(--font-sans-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--charcoal-900)',
      opacity: disabled ? 0.5 : 1
    }
  }, React.createElement('span', {
    style: {
      width: '18px',
      height: '18px',
      flexShrink: 0,
      border: '1.5px solid var(--charcoal-900)',
      borderRadius: '2px',
      background: checked ? 'var(--charcoal-900)' : 'transparent',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, checked ? React.createElement('span', {
    style: {
      width: '8px',
      height: '8px',
      background: 'var(--brass-500)'
    }
  }) : null), React.createElement('input', {
    type: 'checkbox',
    checked,
    onChange,
    disabled,
    style: {
      display: 'none'
    }
  }), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  label,
  placeholder,
  type = 'text',
  error,
  disabled,
  value,
  onChange
}) {
  return React.createElement('label', {
    style: {
      display: 'block',
      fontFamily: 'var(--font-sans-body)'
    }
  }, label ? React.createElement('span', {
    style: {
      display: 'block',
      fontSize: 'var(--text-xs)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      color: 'var(--charcoal-700)',
      marginBottom: '8px'
    }
  }, label) : null, React.createElement('input', {
    type,
    placeholder,
    disabled,
    value,
    onChange,
    style: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '12px 14px',
      fontSize: 'var(--text-base)',
      fontFamily: 'var(--font-sans-body)',
      color: 'var(--charcoal-900)',
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `1.5px solid ${error ? 'var(--danger)' : 'var(--charcoal-900)'}`,
      borderRadius: 'var(--radius-sm)',
      outline: 'none'
    }
  }), error ? React.createElement('span', {
    style: {
      display: 'block',
      marginTop: '6px',
      fontSize: 'var(--text-xs)',
      color: 'var(--danger)'
    }
  }, error) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  label,
  checked,
  onChange,
  name,
  disabled
}) {
  return React.createElement('label', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'var(--font-sans-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--charcoal-900)',
      opacity: disabled ? 0.5 : 1
    }
  }, React.createElement('span', {
    style: {
      width: '18px',
      height: '18px',
      flexShrink: 0,
      border: '1.5px solid var(--charcoal-900)',
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, checked ? React.createElement('span', {
    style: {
      width: '9px',
      height: '9px',
      borderRadius: '50%',
      background: 'var(--brass-500)'
    }
  }) : null), React.createElement('input', {
    type: 'radio',
    name,
    checked,
    onChange,
    disabled,
    style: {
      display: 'none'
    }
  }), label);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  label,
  options = [],
  value,
  onChange
}) {
  return React.createElement('label', {
    style: {
      display: 'block',
      fontFamily: 'var(--font-sans-body)'
    }
  }, label ? React.createElement('span', {
    style: {
      display: 'block',
      fontSize: 'var(--text-xs)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      color: 'var(--charcoal-700)',
      marginBottom: '8px'
    }
  }, label) : null, React.createElement('select', {
    value,
    onChange,
    style: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '12px 14px',
      fontSize: 'var(--text-base)',
      fontFamily: 'var(--font-sans-body)',
      color: 'var(--charcoal-900)',
      background: 'var(--surface-card)',
      border: '1.5px solid var(--charcoal-900)',
      borderRadius: 'var(--radius-sm)'
    }
  }, options.map((o, i) => React.createElement('option', {
    key: i,
    value: o
  }, o))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
const {
  useState
} = React;
function Tabs({
  items = [],
  defaultIndex = 0
}) {
  const [active, setActive] = useState(defaultIndex);
  return React.createElement('div', {
    style: {
      fontFamily: 'var(--font-sans-body)'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      gap: '32px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, items.map((it, i) => React.createElement('button', {
    key: i,
    onClick: () => setActive(i),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '12px 0',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      color: active === i ? 'var(--charcoal-900)' : 'var(--charcoal-700)',
      borderBottom: active === i ? '3px solid var(--brass-500)' : '3px solid transparent',
      marginBottom: '-1px'
    }
  }, it.label))), React.createElement('div', {
    style: {
      padding: '24px 0',
      fontSize: 'var(--text-base)',
      color: 'var(--charcoal-700)',
      lineHeight: 'var(--leading-relaxed)'
    }
  }, items[active] ? items[active].content : null));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Contact.jsx
try { (() => {
function Contact() {
  const {
    useState
  } = React;
  const {
    Input,
    Select,
    Checkbox,
    Button,
    Dialog
  } = window.AlbaneziDesignSystem_e1c419;
  const [open, setOpen] = useState(false);
  const [visit, setVisit] = useState(true);
  return React.createElement('div', {
    style: {
      padding: '96px 64px',
      background: 'var(--sand-200)',
      display: 'flex',
      gap: '80px'
    }
  }, React.createElement('div', {
    style: {
      flex: 1
    }
  }, React.createElement('div', {
    style: {
      fontSize: '13px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--brass-500)',
      fontWeight: 600,
      marginBottom: '16px'
    }
  }, 'Get In Touch'), React.createElement('h1', {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontWeight: 600,
      fontSize: '44px',
      color: 'var(--charcoal-900)',
      margin: '0 0 20px'
    }
  }, 'Let\u2019s talk about your project.'), React.createElement('p', {
    style: {
      fontSize: '17px',
      lineHeight: 1.65,
      color: 'var(--charcoal-700)',
      maxWidth: '420px'
    }
  }, 'Tell us a bit about what you\u2019re planning and we\u2019ll follow up within one business day to schedule a consultation.')), React.createElement('form', {
    onSubmit: e => {
      e.preventDefault();
      setOpen(true);
    },
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      background: 'var(--surface-card)',
      padding: '40px',
      borderRadius: 'var(--radius-md)',
      borderTop: '3px solid var(--brass-500)',
      boxShadow: 'var(--shadow-card)'
    }
  }, React.createElement(Input, {
    label: 'Full Name',
    placeholder: 'Jane Smith'
  }), React.createElement(Input, {
    label: 'Email',
    type: 'email',
    placeholder: 'jane@email.com'
  }), React.createElement(Select, {
    label: 'Project Type',
    options: ['New Build', 'Addition', 'Renovation', 'Laneway/Garden Suite']
  }), React.createElement(Checkbox, {
    label: 'I\u2019d like a site visit',
    checked: visit,
    onChange: e => setVisit(e.target.checked)
  }), React.createElement(Button, {
    type: 'submit',
    variant: 'primary',
    size: 'lg'
  }, 'Send Message'), React.createElement(Dialog, {
    open,
    title: 'Thanks \u2014 message sent.',
    onClose: () => setOpen(false),
    actions: React.createElement(Button, {
      size: 'sm',
      onClick: () => setOpen(false)
    }, 'Close')
  }, 'We\u2019ll follow up within one business day to schedule your consultation.')));
}
window.Contact = Contact;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Contact.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Home.jsx
try { (() => {
function Home({
  onNav
}) {
  const {
    Button,
    Card,
    Badge
  } = window.AlbaneziDesignSystem_e1c419;
  return React.createElement('div', null, React.createElement('section', {
    style: {
      background: 'var(--charcoal-900)',
      color: 'var(--paper-50)',
      padding: '120px 64px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px'
    }
  }, React.createElement('div', {
    style: {
      fontSize: '13px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--brass-500)',
      fontWeight: 600
    }
  }, 'Residential Design \u00B7 Southwest Ontario'), React.createElement('h1', {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontWeight: 600,
      fontSize: '72px',
      lineHeight: 1.05,
      margin: 0,
      maxWidth: '820px',
      letterSpacing: '-0.01em'
    }
  }, 'Design, built to last.'), React.createElement('p', {
    style: {
      fontSize: '19px',
      color: 'var(--sand-200)',
      maxWidth: '560px',
      lineHeight: 1.65,
      margin: 0
    }
  }, 'We take your home from first sketch to a building-permit-ready drawing set \u2014 concept, planning approvals, and construction documents, all under one roof.'), React.createElement('div', {
    style: {
      display: 'flex',
      gap: '16px',
      marginTop: '12px'
    }
  }, React.createElement(Button, {
    variant: 'accent',
    size: 'lg',
    onClick: () => onNav('Contact')
  }, 'Book a Consultation'), React.createElement(Button, {
    variant: 'secondary',
    size: 'lg',
    onClick: () => onNav('Work'),
    style: {
      borderColor: 'var(--paper-50)',
      color: 'var(--paper-50)'
    }
  }, 'View Our Work'))), React.createElement('section', {
    style: {
      padding: '96px 64px',
      background: 'var(--surface-page)'
    }
  }, React.createElement('div', {
    style: {
      fontSize: '13px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--brass-500)',
      fontWeight: 600,
      marginBottom: '16px'
    }
  }, 'Selected Work'), React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: '32px'
    }
  }, [{
    e: 'New Build',
    t: 'The Elmvale Residence',
    d: '2,400 sq ft \u00B7 14-week permit set'
  }, {
    e: 'Addition',
    t: 'Wortley Village Addition',
    d: '720 sq ft second-storey addition'
  }, {
    e: 'Renovation',
    t: 'Old South Kitchen + Rear',
    d: 'Full main-floor renovation'
  }].map((p, i) => React.createElement(Card, {
    key: i,
    eyebrow: p.e,
    title: p.t
  }, p.d)))), React.createElement('section', {
    style: {
      padding: '96px 64px',
      background: 'var(--sand-200)',
      display: 'flex',
      gap: '64px',
      alignItems: 'flex-start'
    }
  }, React.createElement('div', {
    style: {
      flex: 1
    }
  }, React.createElement('h2', {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontWeight: 600,
      fontSize: '38px',
      color: 'var(--charcoal-900)',
      margin: '0 0 16px'
    }
  }, 'From concept to permit.'), React.createElement('p', {
    style: {
      fontSize: '17px',
      lineHeight: 1.65,
      color: 'var(--charcoal-700)',
      maxWidth: '480px',
      margin: 0
    }
  }, 'One team carries your drawings through every stage \u2014 no handoffs, no re-explaining the project.')), React.createElement('div', {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }
  }, ['Concept & Feasibility', 'Design Development', 'Permit Drawings', 'Construction Support'].map((s, i) => React.createElement('div', {
    key: i,
    style: {
      display: 'flex',
      gap: '20px',
      alignItems: 'baseline',
      borderBottom: '1px solid var(--border-subtle)',
      paddingBottom: '16px'
    }
  }, React.createElement('span', {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontSize: '22px',
      color: 'var(--brass-500)',
      fontWeight: 600
    }
  }, '0' + (i + 1)), React.createElement('span', {
    style: {
      fontSize: '17px',
      color: 'var(--charcoal-900)',
      fontWeight: 500
    }
  }, s))))));
}
window.Home = Home;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Process.jsx
try { (() => {
function Process() {
  const {
    Tabs
  } = window.AlbaneziDesignSystem_e1c419;
  return React.createElement('div', {
    style: {
      padding: '96px 64px',
      background: 'var(--surface-page)'
    }
  }, React.createElement('div', {
    style: {
      fontSize: '13px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--brass-500)',
      fontWeight: 600,
      marginBottom: '16px'
    }
  }, 'Process'), React.createElement('h1', {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontWeight: 600,
      fontSize: '46px',
      color: 'var(--charcoal-900)',
      margin: '0 0 40px',
      maxWidth: '700px'
    }
  }, 'How a project moves from sketch to permit.'), React.createElement('div', {
    style: {
      maxWidth: '760px'
    }
  }, React.createElement(Tabs, {
    items: [{
      label: 'Concept',
      content: 'We start with a site visit and a conversation about how you want to live in the space \u2014 followed by hand sketches and a rough floor plan to react to.'
    }, {
      label: 'Design',
      content: 'Sketches become scaled drawings: floor plans, elevations, and a 3D massing study so you can see the home before it\u2019s built.'
    }, {
      label: 'Permit',
      content: 'We prepare a fully dimensioned, stamped drawing set and manage submission to your municipality\u2019s building department.'
    }, {
      label: 'Build',
      content: 'We stay on as a resource through construction \u2014 answering contractor questions and issuing revised drawings as needed.'
    }]
  })));
}
window.Process = Process;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Process.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Shell.jsx
try { (() => {
const NAV = ['Work', 'Services', 'Process', 'About', 'Contact'];
function Header({
  active,
  onNav
}) {
  return React.createElement('header', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '28px 64px',
      background: 'var(--surface-page)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      cursor: 'pointer'
    },
    onClick: () => onNav('Work')
  }, React.createElement('img', {
    src: '../../assets/logo/logo-badge-light.png',
    style: {
      height: '44px'
    }
  }), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontWeight: 600,
      fontSize: '20px',
      color: 'var(--charcoal-900)',
      letterSpacing: '-0.01em'
    }
  }, 'AA-Design')), React.createElement('nav', {
    style: {
      display: 'flex',
      gap: '40px'
    }
  }, NAV.map(n => React.createElement('a', {
    key: n,
    onClick: () => onNav(n),
    style: {
      cursor: 'pointer',
      fontFamily: 'var(--font-sans-body)',
      fontSize: '14px',
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: active === n ? 'var(--charcoal-900)' : 'var(--charcoal-700)',
      borderBottom: active === n ? '3px solid var(--brass-500)' : '3px solid transparent',
      paddingBottom: '4px',
      textDecoration: 'none'
    }
  }, n))));
}
function Footer() {
  return React.createElement('footer', {
    style: {
      background: 'var(--charcoal-900)',
      color: 'var(--paper-50)',
      padding: '64px 64px 40px',
      fontFamily: 'var(--font-sans-body)'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '40px',
      marginBottom: '48px'
    }
  }, React.createElement('div', null, React.createElement('img', {
    src: '../../assets/logo/logo-badge-dark.png',
    style: {
      height: '56px',
      marginBottom: '16px'
    }
  }), React.createElement('div', {
    style: {
      fontSize: '14px',
      color: 'var(--sand-200)',
      maxWidth: '280px',
      lineHeight: 1.6
    }
  }, 'Residential design drawings, concept through building permit. Serving southwest Ontario.')), React.createElement('div', {
    style: {
      display: 'flex',
      gap: '64px'
    }
  }, React.createElement('div', null, React.createElement('div', {
    style: {
      fontSize: '12px',
      letterSpacing: '0.08em',
      color: 'var(--brass-500)',
      textTransform: 'uppercase',
      marginBottom: '14px',
      fontWeight: 600
    }
  }, 'Studio'), ['Work', 'Services', 'Process', 'About'].map(l => React.createElement('div', {
    key: l,
    style: {
      fontSize: '14px',
      color: 'var(--sand-200)',
      marginBottom: '10px'
    }
  }, l))), React.createElement('div', null, React.createElement('div', {
    style: {
      fontSize: '12px',
      letterSpacing: '0.08em',
      color: 'var(--brass-500)',
      textTransform: 'uppercase',
      marginBottom: '14px',
      fontWeight: 600
    }
  }, 'Contact'), React.createElement('div', {
    style: {
      fontSize: '14px',
      color: 'var(--sand-200)',
      marginBottom: '10px'
    }
  }, 'hello@aad.ca'), React.createElement('div', {
    style: {
      fontSize: '14px',
      color: 'var(--sand-200)'
    }
  }, 'London, Ontario')))), React.createElement('div', {
    style: {
      borderTop: '1px solid var(--charcoal-700)',
      paddingTop: '20px',
      fontSize: '12px',
      color: 'var(--charcoal-700)'
    }
  }, '\u00A9 2026 AA-Design. All rights reserved.'));
}
window.Header = Header;
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Work.jsx
try { (() => {
const PROJECTS = [{
  e: 'New Build',
  t: 'The Elmvale Residence',
  d: '2,400 sq ft custom home \u00B7 permit-ready in 14 weeks'
}, {
  e: 'Addition',
  t: 'Wortley Village Addition',
  d: '720 sq ft second-storey addition over an existing footprint'
}, {
  e: 'Renovation',
  t: 'Old South Kitchen + Rear',
  d: 'Full main-floor renovation and rear extension'
}, {
  e: 'New Build',
  t: 'Komoka Country Home',
  d: '3,100 sq ft rural build with detached garage'
}, {
  e: 'Laneway Suite',
  t: 'Byron Garden Suite',
  d: '600 sq ft laneway suite, permit set only'
}, {
  e: 'Renovation',
  t: 'Talbot Village Refresh',
  d: 'Interior reconfiguration, structural drawings'
}];
function Work() {
  const {
    Card,
    Badge
  } = window.AlbaneziDesignSystem_e1c419;
  return React.createElement('div', {
    style: {
      padding: '96px 64px',
      background: 'var(--surface-page)'
    }
  }, React.createElement('div', {
    style: {
      marginBottom: '48px'
    }
  }, React.createElement('div', {
    style: {
      fontSize: '13px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--brass-500)',
      fontWeight: 600,
      marginBottom: '16px'
    }
  }, 'Our Work'), React.createElement('h1', {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontWeight: 600,
      fontSize: '46px',
      color: 'var(--charcoal-900)',
      margin: '0 0 16px'
    }
  }, 'Projects across southwest Ontario.'), React.createElement('div', {
    style: {
      display: 'flex',
      gap: '10px'
    }
  }, ['All', 'New Build', 'Addition', 'Renovation', 'Laneway Suite'].map(f => React.createElement(Badge, {
    key: f,
    tone: f === 'All' ? 'brass' : 'outline'
  }, f)))), React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: '32px'
    }
  }, PROJECTS.map((p, i) => React.createElement(Card, {
    key: i,
    eyebrow: p.e,
    title: p.t
  }, p.d))));
}
window.Work = Work;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Work.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
