(() => {
  const maxItems = 8;

  const textValue = (value) => (typeof value === "string" ? value : "");

  const normalizeItems = (items) =>
    (Array.isArray(items) ? items : []).slice(0, maxItems).map((item) => ({
      image: textValue(item?.image),
      title: textValue(item?.title),
      subtitle: textValue(item?.subtitle),
      alt: textValue(item?.alt),
    }));

  const defaultColumns = "3";
  const previewItemBases = {
    1: "100cqi",
    2: "max(10rem, 50cqi)",
    3: "max(9rem, 33.333cqi)",
    4: "max(8rem, 25cqi)",
  };
  const normalizeColumns = (value) => {
    const columns = Number(value);
    return Number.isInteger(columns) && columns >= 1 && columns <= 4 ? String(columns) : defaultColumns;
  };

  const encodeItems = (items) => {
    const bytes = new TextEncoder().encode(JSON.stringify(normalizeItems(items)));
    let binary = "";

    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }

    return btoa(binary);
  };

  const decodeItems = (encoded) => {
    if (typeof encoded !== "string" || !encoded) return [];

    try {
      const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
      return normalizeItems(JSON.parse(new TextDecoder().decode(bytes)));
    } catch {
      return [];
    }
  };

  const createPreview = ({ items = [], columns } = {}, getAsset) => {
    const normalizedColumns = normalizeColumns(columns);
    const preview = document.createElement("div");
    preview.className = "circle-items-preview";
    preview.style.display = "flex";
    preview.style.flexWrap = "wrap";
    preview.style.justifyContent = "space-evenly";
    preview.style.inlineSize = "100%";
    preview.style.containerType = "inline-size";
    preview.style.rowGap = "1rem";

    normalizeItems(items).forEach((item) => {
      const itemWrapper = document.createElement("div");
      itemWrapper.style.flex = `0 0 ${previewItemBases[normalizedColumns]}`;
      itemWrapper.style.minInlineSize = "0";

      const figure = document.createElement("figure");
      figure.style.display = "grid";
      figure.style.inlineSize = "100%";
      figure.style.maxInlineSize = "10rem";
      figure.style.justifyItems = "center";
      figure.style.gap = "0.5rem";
      figure.style.margin = "0 auto";
      figure.style.textAlign = "center";

      if (item.image) {
        const frame = document.createElement("div");
        frame.style.aspectRatio = "1";
        frame.style.inlineSize = "5rem";
        frame.style.overflow = "clip";
        frame.style.borderRadius = "50%";

        const image = document.createElement("img");
        const asset = getAsset?.(item.image);
        image.src = asset?.url ?? item.image;
        image.alt = item.alt || item.title;
        image.style.blockSize = "100%";
        image.style.inlineSize = "100%";
        image.style.objectFit = "cover";
        frame.append(image);
        figure.append(frame);
      }

      const caption = document.createElement("figcaption");
      caption.style.display = "grid";
      caption.style.gap = "0.125rem";

      if (item.title) {
        const title = document.createElement("p");
        title.textContent = item.title;
        title.style.fontWeight = "600";
        title.style.margin = "0";
        caption.append(title);
      }

      if (item.subtitle) {
        const subtitle = document.createElement("p");
        subtitle.textContent = item.subtitle;
        subtitle.style.margin = "0";
        caption.append(subtitle);
      }

      figure.append(caption);
      itemWrapper.append(figure);
      preview.append(itemWrapper);
    });

    return preview;
  };

  CMS.registerEditorComponent({
    id: "circle-items",
    label: "Bildreihe",
    icon: "photo_library",
    mode: "dialog",
    summary: "Bildreihe",
    fields: [
      {
        name: "columns",
        label: "Maximale Elemente pro Reihe",
        widget: "select",
        options: ["1", "2", "3", "4"],
        default: defaultColumns,
        required: true,
      },
      {
        name: "items",
        label: "Elemente",
        widget: "list",
        label_singular: "Element",
        required: true,
        min: 1,
        max: maxItems,
        fields: [
          {
            name: "image",
            label: "Bild",
            widget: "image",
            required: true,
            hint: "Bitte vor der Veröffentlichung Bildrechte und die Einwilligung erkennbarer Personen prüfen.",
          },
          { name: "title", label: "Titel", widget: "string", required: true },
          { name: "subtitle", label: "Untertitel", widget: "string", required: false },
          {
            name: "alt",
            label: "Alternativtext",
            widget: "string",
            required: false,
            hint: "Leer lassen, um den Titel als Alternativtext zu verwenden.",
          },
        ],
      },
    ],
    pattern: /^\{\{<\s*circle-items(?:\s+columns="(?<columns>[1-4])")?\s+data="(?<data>[A-Za-z0-9+\/=]*)"\s*>\}\}$/m,
    fromBlock: (match) => ({ items: decodeItems(match?.groups?.data), columns: normalizeColumns(match?.groups?.columns) }),
    toBlock: ({ items = [], columns = defaultColumns } = {}) => `{{< circle-items columns="${normalizeColumns(columns)}" data="${encodeItems(items)}" >}}`,
    toPreview: createPreview,
  });
})();
