(() => {
  // Offsets are stored in title heights (em of the title row), limited so the logo stays near the title.
  const offsetLimit = 2;
  const viewports = { desktop: 1366, mobile: 390 };
  const previewUrl = new URL("title-logo-preview/", document.currentScript?.src ?? window.location.href).href;

  const toNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };

  const clampOffset = (value) => Math.round(Math.min(offsetLimit, Math.max(-offsetLimit, toNumber(value))) * 100) / 100;

  const normalizeOffset = (value) => {
    const plain = value && typeof value.toJS === "function" ? value.toJS() : value || {};
    return { x: clampOffset(plain.x), y: clampOffset(plain.y) };
  };

  const setOffset = (row, offset) => {
    row.style.setProperty("--title-logo-offset-x", String(offset.x));
    row.style.setProperty("--title-logo-offset-y", String(offset.y));
  };

  // Applies unsaved CMS values to the title row of the Hugo-rendered preview page.
  const applySettings = (doc, settings) => {
    const row = doc.querySelector(".page-title-row");
    const logo = row?.querySelector(".title-logo");
    if (!row || !logo) return;

    row.dataset.logoPosition = settings.position || "right";
    row.style.setProperty("--title-logo-scale", String(toNumber(settings.size, 100) / 100));
    setOffset(row, settings.offset);
    if (settings.imageUrl && logo.getAttribute("src") !== settings.imageUrl) logo.setAttribute("src", settings.imageUrl);
    if (settings.alt !== undefined) logo.alt = settings.alt || "";

    const title = row.querySelector("h1");
    if (title && settings.title) title.textContent = settings.title;
  };

  // Lets the editor drag the logo; the offset is shown live and committed when the pointer is released.
  const attachDrag = (doc, { getOffset, onCommit }) => {
    const row = doc.querySelector(".page-title-row");
    const logo = row?.querySelector(".title-logo");
    if (!row || !logo) return () => {};

    const updateRatio = () => {
      if (logo.naturalWidth && logo.naturalHeight) {
        row.style.setProperty("--title-logo-ratio", (logo.naturalWidth / logo.naturalHeight).toFixed(4));
      }
    };

    let drag = null;
    const offsetFor = (event) => {
      const em = Number.parseFloat(doc.defaultView.getComputedStyle(row).fontSize);
      return {
        x: clampOffset(drag.offset.x + (event.clientX - drag.x) / em),
        y: clampOffset(drag.offset.y + (event.clientY - drag.y) / em),
      };
    };
    const down = (event) => {
      event.preventDefault();
      logo.setPointerCapture?.(event.pointerId);
      drag = { x: event.clientX, y: event.clientY, offset: getOffset() };
      logo.style.cursor = "grabbing";
    };
    const move = (event) => {
      if (drag) setOffset(row, offsetFor(event));
    };
    const up = (event) => {
      if (!drag) return;
      const offset = offsetFor(event);
      drag = null;
      logo.style.cursor = "grab";
      onCommit(offset);
    };

    logo.draggable = false;
    logo.style.cursor = "grab";
    logo.style.touchAction = "none";
    logo.addEventListener("load", updateRatio);
    logo.addEventListener("pointerdown", down);
    logo.addEventListener("pointermove", move);
    logo.addEventListener("pointerup", up);
    logo.addEventListener("pointercancel", up);
    updateRatio();

    return () => {
      logo.removeEventListener("load", updateRatio);
      logo.removeEventListener("pointerdown", down);
      logo.removeEventListener("pointermove", move);
      logo.removeEventListener("pointerup", up);
      logo.removeEventListener("pointercancel", up);
    };
  };

  window.MonteTitleLogoPreview = { applySettings, attachDrag, normalizeOffset };

  if (!window.CMS) return;

  const { useEffect, useRef, useState } = window.CMS.React;
  const { h } = window;

  const buttonStyle = (active) => ({
    padding: "4px 12px",
    border: "1px solid currentColor",
    borderRadius: "6px",
    background: active ? "rgba(127, 127, 127, 0.25)" : "transparent",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
  });

  const TitleLogoOffsetControl = ({ forID, value, onChange, entry, getAsset }) => {
    const offset = normalizeOffset(value);
    const data = (key) => entry?.getIn(["data", key]);
    const image = data("image");

    const [viewport, setViewport] = useState("desktop");
    const [title, setTitle] = useState("Willkommen");
    const [doc, setDoc] = useState(null);
    const [frameHeight, setFrameHeight] = useState(240);
    const [width, setWidth] = useState(0);
    const frameRef = useRef(null);
    const wrapperRef = useRef(null);
    const latest = useRef({});
    latest.current = { offset, onChange };

    useEffect(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return undefined;
      const observer = new ResizeObserver(([item]) => setWidth(item.contentRect.width));
      observer.observe(wrapper);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      if (!doc) return undefined;
      const section = doc.querySelector("main");
      const measure = () => {
        if (!section) return;
        const margin = Number.parseFloat(doc.defaultView.getComputedStyle(section).marginBottom) || 0;
        setFrameHeight(Math.ceil(section.getBoundingClientRect().bottom + margin));
      };
      const observer = new doc.defaultView.ResizeObserver(measure);
      if (section) observer.observe(section);
      const detach = attachDrag(doc, {
        getOffset: () => latest.current.offset,
        onCommit: (next) => latest.current.onChange(next),
      });
      return () => {
        observer.disconnect();
        detach();
      };
    }, [doc]);

    useEffect(() => {
      if (!doc) return;
      applySettings(doc, {
        position: data("position"),
        size: data("size"),
        alt: data("alt"),
        imageUrl: image ? (getAsset?.(image)?.url ?? "") : "",
        offset,
        title,
      });
    });

    const frameWidth = viewports[viewport];
    const scale = width ? Math.min(1, width / frameWidth) : 1;
    const update = (axis, raw) => onChange({ ...offset, [axis]: clampOffset(raw) });

    // Sveltia CMS 0.227.2 exposes `h` (React.createElement) but not the `html` HTM tag.
    const row = (gap, ...children) => h("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap } }, ...children);
    const labelStyle = { display: "flex", alignItems: "center", gap: "6px" };
    const offsetInput = (axis, props) =>
      h("input", {
        ...props,
        type: "number",
        step: "0.05",
        min: -offsetLimit,
        max: offsetLimit,
        value: offset[axis],
        onChange: (event) => update(axis, event.target.value),
        style: { width: "6em", padding: "4px 8px" },
      });

    return h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "10px" } },
      row(
        "8px",
        ...Object.keys(viewports).map((key) =>
          h(
            "button",
            { type: "button", key, "aria-pressed": viewport === key, style: buttonStyle(viewport === key), onClick: () => setViewport(key) },
            key === "desktop" ? "Desktop" : "Handy",
          ),
        ),
        h(
          "label",
          { style: { ...labelStyle, flex: "1 1 220px" } },
          "Beispieltitel (nur Vorschau)",
          h("input", { type: "text", value: title, onChange: (event) => setTitle(event.target.value), style: { flex: 1, minWidth: 0, padding: "4px 8px" } }),
        ),
      ),
      h(
        "div",
        { ref: wrapperRef, style: { height: `${frameHeight * scale}px`, overflow: "hidden", border: "1px solid rgba(127, 127, 127, 0.4)", borderRadius: "6px" } },
        h("iframe", {
          ref: frameRef,
          src: previewUrl,
          title: "Vorschau der Titelzeile",
          scrolling: "no",
          onLoad: () => setDoc(frameRef.current?.contentDocument ?? null),
          style: {
            display: "block",
            border: 0,
            width: `${frameWidth}px`,
            height: `${frameHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            marginInlineStart: `${Math.max(0, (width - frameWidth * scale) / 2)}px`,
          },
        }),
      ),
      row(
        "12px",
        h("label", { style: labelStyle }, "Versatz horizontal", offsetInput("x", { id: forID })),
        h("label", { style: labelStyle }, "Versatz vertikal", offsetInput("y", {})),
        h("button", { type: "button", style: buttonStyle(false), onClick: () => onChange({ x: 0, y: 0 }) }, "Versatz zurücksetzen"),
      ),
    );
  };

  window.CMS.registerFieldType("title-logo-offset", TitleLogoOffsetControl);
})();
