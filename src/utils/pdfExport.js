const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 36;
const HEADER_HEIGHT = 88;
const ROW_HEIGHT = 28;
const FOOTER_HEIGHT = 28;

const encoder = new TextEncoder();

const toPdfText = (value) =>
  String(value ?? '')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const toFileName = (value) =>
  String(value || 'records')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'records';

const fitText = (value, maxChars) => {
  const text = String(value ?? '-').trim() || '-';
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 3))}...`;
};

const getRowsPerPage = () =>
  Math.max(1, Math.floor((PAGE_HEIGHT - MARGIN - HEADER_HEIGHT - FOOTER_HEIGHT) / ROW_HEIGHT) - 1);

const concatBytes = (parts) => {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
};

const isWhitePixel = (red, green, blue) => red > 242 && green > 242 && blue > 242;

const loadLogoImage = async (logoUrl, options = {}) => {
  if (!logoUrl) return null;

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const {
        maxWidth = 220,
        background = [255, 255, 255],
        opacity = 1,
        removeWhiteBackground = true,
      } = options;
      const scale = Math.min(1, maxWidth / image.naturalWidth);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height).data;
      const rgb = new Uint8Array(width * height * 3);

      for (let source = 0, target = 0; source < imageData.length; source += 4, target += 3) {
        const red = imageData[source];
        const green = imageData[source + 1];
        const blue = imageData[source + 2];
        const sourceAlpha = imageData[source + 3] / 255;
        const whiteBackgroundAlpha = removeWhiteBackground && isWhitePixel(red, green, blue) ? 0 : 1;
        const alpha = sourceAlpha * whiteBackgroundAlpha * opacity;
        rgb[target] = Math.round(red * alpha + background[0] * (1 - alpha));
        rgb[target + 1] = Math.round(green * alpha + background[1] * (1 - alpha));
        rgb[target + 2] = Math.round(blue * alpha + background[2] * (1 - alpha));
      }

      resolve({ width, height, data: rgb });
    };
    image.onerror = () => resolve(null);
    image.src = logoUrl;
  });
};

const createPageContent = ({ title, subtitle, columns, rows, pageNumber, totalPages, headerLogo, watermarkLogo }) => {
  const tableWidth = PAGE_WIDTH - MARGIN * 2;
  const totalWeight = columns.reduce((sum, column) => sum + (column.width || 1), 0);
  const widths = columns.map((column) => (tableWidth * (column.width || 1)) / totalWeight);
  const rowsPerPage = getRowsPerPage();

  const commands = [
    'q',
    '1 1 1 rg 0 0 842 595 re f',
    'Q',
    'q',
    '0.93 0.96 1 rg 0 535 842 60 re f',
    'Q',
  ];

  if (watermarkLogo) {
    const watermarkWidth = 240;
    const watermarkHeight = Math.round((watermarkLogo.height / watermarkLogo.width) * watermarkWidth);
    commands.push(
      'q',
      `${watermarkWidth} 0 0 ${watermarkHeight} ${(PAGE_WIDTH - watermarkWidth) / 2} ${(PAGE_HEIGHT - watermarkHeight) / 2 - 18} cm`,
      '/LogoWatermark Do',
      'Q'
    );
  }

  if (headerLogo) {
    const logoWidth = 88;
    const logoHeight = Math.round((headerLogo.height / headerLogo.width) * logoWidth);
    commands.push('q', `${logoWidth} 0 0 ${logoHeight} ${MARGIN} ${PAGE_HEIGHT - MARGIN - logoHeight + 6} cm`, '/LogoHeader Do', 'Q');
  }

  commands.push(
    '0 0 0 rg',
    'BT',
    '/F1 18 Tf',
    `1 0 0 1 ${headerLogo ? MARGIN + 104 : MARGIN} ${PAGE_HEIGHT - MARGIN + 2} Tm`,
    `(${toPdfText(title)}) Tj`,
    'ET',
    '0.18 0.22 0.28 rg',
    'BT',
    '/F1 9 Tf',
    `1 0 0 1 ${headerLogo ? MARGIN + 104 : MARGIN} ${PAGE_HEIGHT - MARGIN - 18} Tm`,
    `(${toPdfText(subtitle)}) Tj`,
    'ET'
  );

  let y = PAGE_HEIGHT - MARGIN - HEADER_HEIGHT;
  commands.push(`0.90 0.94 0.98 rg ${MARGIN} ${y - 6} ${tableWidth} ${ROW_HEIGHT} re f`, '0 0 0 rg');

  let x = MARGIN;
  columns.forEach((column, index) => {
    commands.push(
      'BT',
      '/F1 9 Tf',
      `1 0 0 1 ${x + 6} ${y + 4} Tm`,
      `(${toPdfText(fitText(column.label, Math.floor(widths[index] / 5.2)))}) Tj`,
      'ET'
    );
    x += widths[index];
  });

  y -= ROW_HEIGHT;
  rows.forEach((row) => {
    commands.push('0.88 0.90 0.94 RG', `${MARGIN} ${y + ROW_HEIGHT - 7} ${tableWidth} 0.5 re S`, '0 0 0 rg');
    x = MARGIN;
    columns.forEach((column, index) => {
      const value = typeof column.value === 'function' ? column.value(row) : row[column.key];
      commands.push(
        'BT',
        '/F1 8 Tf',
        `1 0 0 1 ${x + 6} ${y + 5} Tm`,
        `(${toPdfText(fitText(value, Math.floor(widths[index] / 4.6)))}) Tj`,
        'ET'
      );
      x += widths[index];
    });
    y -= ROW_HEIGHT;
  });

  commands.push(
    '0.18 0.22 0.28 rg',
    'BT',
    '/F1 8 Tf',
    `1 0 0 1 ${MARGIN} 24 Tm`,
    `(${toPdfText(`Page ${pageNumber} of ${totalPages} | Rows on page: ${rows.length} | Rows per page: ${rowsPerPage}`)}) Tj`,
    'ET'
  );

  return encoder.encode(commands.join('\n'));
};

const buildPdf = ({ title, subtitle, columns, rows, headerLogo, watermarkLogo }) => {
  const rowsPerPage = getRowsPerPage();
  const chunks = [];
  for (let i = 0; i < rows.length; i += rowsPerPage) chunks.push(rows.slice(i, i + rowsPerPage));
  if (!chunks.length) chunks.push([]);

  const objects = [
    encoder.encode('<< /Type /Catalog /Pages 2 0 R >>'),
    encoder.encode(''),
    encoder.encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),
  ];

  let headerLogoObjectId = null;
  if (headerLogo) {
    headerLogoObjectId = objects.length + 1;
    objects.push(
      concatBytes([
        encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${headerLogo.width} /Height ${headerLogo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${headerLogo.data.length} >>\nstream\n`),
        headerLogo.data,
        encoder.encode('\nendstream'),
      ])
    );
  }

  let watermarkLogoObjectId = null;
  if (watermarkLogo) {
    watermarkLogoObjectId = objects.length + 1;
    objects.push(
      concatBytes([
        encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${watermarkLogo.width} /Height ${watermarkLogo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${watermarkLogo.data.length} >>\nstream\n`),
        watermarkLogo.data,
        encoder.encode('\nendstream'),
      ])
    );
  }

  const pageObjectIds = [];
  const totalPages = chunks.length;

  chunks.forEach((chunk, index) => {
    const pageObjectId = objects.length + 1;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);
    const xObjectEntries = [
      headerLogoObjectId ? `/LogoHeader ${headerLogoObjectId} 0 R` : '',
      watermarkLogoObjectId ? `/LogoWatermark ${watermarkLogoObjectId} 0 R` : '',
    ].filter(Boolean);
    const xObject = xObjectEntries.length ? `/XObject << ${xObjectEntries.join(' ')} >>` : '';
    objects.push(
      encoder.encode(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> ${xObject} >> /Contents ${contentObjectId} 0 R >>`
      )
    );
    const stream = createPageContent({
      title,
      subtitle,
      columns,
      rows: chunk,
      pageNumber: index + 1,
      totalPages,
      headerLogo,
      watermarkLogo,
    });
    objects.push(concatBytes([encoder.encode(`<< /Length ${stream.length} >>\nstream\n`), stream, encoder.encode('\nendstream')]));
  });

  objects[1] = encoder.encode(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`);

  const parts = [encoder.encode('%PDF-1.4\n')];
  const offsets = [0];
  let length = parts[0].length;

  objects.forEach((object, index) => {
    offsets.push(length);
    const prefix = encoder.encode(`${index + 1} 0 obj\n`);
    const suffix = encoder.encode('\nendobj\n');
    parts.push(prefix, object, suffix);
    length += prefix.length + object.length + suffix.length;
  });

  const xrefOffset = length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  parts.push(encoder.encode(xref));

  return concatBytes(parts);
};

export const downloadRowsAsPdf = async ({ title, filename, columns, rows, logoUrl, rangeLabel }) => {
  const exportedAt = new Date().toLocaleString('en-IN');
  const [headerLogo, watermarkLogo] = await Promise.all([
    loadLogoImage(logoUrl, {
      maxWidth: 220,
      background: [237, 245, 255],
      opacity: 1,
      removeWhiteBackground: true,
    }),
    loadLogoImage(logoUrl, {
      maxWidth: 520,
      background: [255, 255, 255],
      opacity: 0.08,
      removeWhiteBackground: true,
    }),
  ]);
  const pdf = buildPdf({
    title,
    subtitle: `${rangeLabel || 'Records'} | Generated ${exportedAt} | Total records: ${rows.length}`,
    columns,
    rows,
    headerLogo,
    watermarkLogo,
  });
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${toFileName(filename || title)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
