import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  TALENT_OPTIONS,
  type EventSettings,
  type RegistrationRecord,
} from '../types/database.types.ts';
import { formatDateTime, formatFoodLabel } from './utils.ts';

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'student';
}

export async function downloadNodeAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2.5,
    backgroundColor: '#fff4e2',
  });
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

export async function downloadNodeAsPdf(
  element: HTMLElement,
  filename: string,
  aspect: '4:5' | 'pass' = '4:5'
): Promise<void> {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2.5,
    backgroundColor: '#fff4e2',
  });

  const widthMm = aspect === '4:5' ? 160 : 120;
  const heightMm = aspect === '4:5' ? 200 : 210;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm],
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export async function shareNodeOrLink(
  element: HTMLElement | null,
  title: string,
  text: string,
  url: string,
  filename: string
): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      if (element && navigator.canShare) {
        const dataUrl = await toPng(element, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: '#fff4e2',
        });
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title, text, files: [file] });
          return 'shared';
        }
      }
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return 'shared';
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(`${text}\n${url}`);
  }
  return 'copied';
}

function escapeCsvCell(value: string): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportRegistrationsCsv(
  records: RegistrationRecord[],
  filename = 'ignition-2k26-registrations.csv'
): void {
  const headers = [
    'Registration ID',
    'Student Name',
    'Selected Talents',
    'Other Talent Description',
    'Food Preference',
    'Event Check-In Status',
    'Check-In Time',
    'Registration Date (ISO)',
  ];

  const rows = records.map((r) => [
    r.pass_number,
    r.student_name,
    r.selected_talents.join('; '),
    r.other_talent_description || '',
    formatFoodLabel(r.food_preference),
    r.checked_in ? 'Events Joined' : 'Pending',
    r.checkin_time ? formatDateTime(r.checkin_time) : '',
    r.created_at,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportRegistrationsJson(
  records: RegistrationRecord[],
  filename = 'ignition-2k26-registrations.json'
): void {
  const cleanRecords = records.map((r) => ({
    registration_id: r.pass_number,
    student_name: r.student_name,
    selected_talents: r.selected_talents,
    other_talent_description: r.other_talent_description,
    food_preference: r.food_preference,
    checked_in: Boolean(r.checked_in),
    checkin_time: r.checkin_time || null,
    checked_in_by: r.checked_in_by || null,
    created_at: r.created_at,
  }));

  const blob = new Blob([JSON.stringify(cleanRecords, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportRegistrationsExcel(
  records: RegistrationRecord[],
  settings: EventSettings,
  filename = 'ignition-2k26-report.xlsx'
): void {
  const wb = XLSX.utils.book_new();

  const toSheetRows = (list: RegistrationRecord[]) =>
    list.map((r, idx) => ({
      'S.No': idx + 1,
      'Registration ID': r.pass_number,
      'Student Name': r.student_name,
      'Selected Talents': r.selected_talents.join(', '),
      'Other Talent': r.other_talent_description || '-',
      'Food Preference': formatFoodLabel(r.food_preference),
      'Check-In Status': r.checked_in ? 'Events Joined' : 'Pending',
      'Check-In Time': r.checkin_time ? formatDateTime(r.checkin_time) : '-',
      'Registered At': formatDateTime(r.created_at),
    }));

  const colWidths = [
    { wch: 6 },
    { wch: 20 },
    { wch: 24 },
    { wch: 32 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
  ];

  const allSheet = XLSX.utils.json_to_sheet(toSheetRows(records));
  allSheet['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, allSheet, 'All Registrations');

  const vegRecords = records.filter((r) => r.food_preference === 'vegetarian');
  const vegSheet = XLSX.utils.json_to_sheet(toSheetRows(vegRecords));
  vegSheet['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, vegSheet, 'Vegetarian');

  const nonVegRecords = records.filter(
    (r) => r.food_preference === 'non_vegetarian'
  );
  const nonVegSheet = XLSX.utils.json_to_sheet(toSheetRows(nonVegRecords));
  nonVegSheet['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, nonVegSheet, 'Non-Vegetarian');

  const talentRows = TALENT_OPTIONS.map((t) => {
    const matching = records.filter((r) => r.selected_talents.includes(t.id));
    return {
      Talent: t.label,
      'Total Selections': matching.length,
      'Percentage of Students':
        records.length > 0
          ? `${((matching.length / records.length) * 100).toFixed(1)}%`
          : '0.0%',
      Students: matching.map((m) => m.student_name).join(', '),
    };
  });
  const talentSheet = XLSX.utils.json_to_sheet(talentRows);
  talentSheet['!cols'] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 64 },
  ];
  XLSX.utils.book_append_sheet(wb, talentSheet, 'Talent Analysis');

  const summaryRows = [
    { Metric: 'Event Name', Value: settings.event_name },
    { Metric: 'Department', Value: settings.department_name },
    { Metric: 'Institution', Value: settings.institution_name },
    { Metric: 'Event Date', Value: settings.event_date },
    { Metric: 'Event Venue', Value: settings.event_venue },
    { Metric: 'Generated At', Value: formatDateTime(new Date().toISOString()) },
    { Metric: 'Total Registrations', Value: records.length },
    {
      Metric: 'Events Joined (Checked In)',
      Value: records.filter((r) => r.checked_in).length,
    },
    { Metric: 'Vegetarian Students', Value: vegRecords.length },
    { Metric: 'Non-Vegetarian Students', Value: nonVegRecords.length },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 52 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  XLSX.writeFile(wb, filename);
}

export function exportRegistrationsPdf(
  records: RegistrationRecord[],
  settings: EventSettings,
  reportTitle: string,
  filename = 'ignition-2k26-report.pdf'
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const vegCount = records.filter((r) => r.food_preference === 'vegetarian').length;
  const nonVegCount = records.length - vegCount;

  const drawHeader = (pageNum: number) => {
    doc.setFillColor(142, 27, 27);
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setTextColor(255, 244, 226);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${settings.event_name} — ${reportTitle}`, margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 224, 102);
    doc.text(
      `${settings.department_name} · ${settings.institution_name}`,
      margin,
      18
    );
    doc.text(
      `Generated: ${formatDateTime(new Date().toISOString())}  |  Page ${pageNum}`,
      pageWidth - margin,
      18,
      { align: 'right' }
    );
  };

  let pageNum = 1;
  drawHeader(pageNum);

  // Summary strip
  doc.setFillColor(246, 239, 226);
  doc.roundedRect(margin, 28, pageWidth - margin * 2, 12, 2, 2, 'F');
  doc.setTextColor(90, 15, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(
    `Total Students: ${records.length}    |    Vegetarian: ${vegCount}    |    Non-Vegetarian: ${nonVegCount}    |    Date: ${settings.event_date}`,
    margin + 4,
    35.5
  );

  let y = 48;
  const cols = [
    { label: '#', x: margin, w: 10 },
    { label: 'Pass ID', x: margin + 10, w: 34 },
    { label: 'Student Name', x: margin + 44, w: 46 },
    { label: 'Talents', x: margin + 90, w: 68 },
    { label: 'Food', x: margin + 158, w: 28 },
    { label: 'Custom Talent', x: margin + 186, w: 54 },
    { label: 'Registered', x: margin + 240, w: 30 },
  ];

  const drawTableHeader = () => {
    doc.setFillColor(27, 27, 27);
    doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
    doc.setTextColor(255, 244, 226);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    for (const col of cols) {
      doc.text(col.label, col.x + 1.5, y);
    }
    y += 7;
  };

  drawTableHeader();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  records.forEach((r, idx) => {
    const talentStr = r.selected_talents.join(', ');
    const notesStr = r.other_talent_description || '';

    const talentLines = doc.splitTextToSize(talentStr || '-', cols[3].w - 3);
    const noteLines = doc.splitTextToSize(notesStr || '-', cols[5].w - 3);
    const rowLines = Math.max(talentLines.length, noteLines.length, 1);
    const rowHeight = Math.max(7, rowLines * 4 + 3);

    if (y + rowHeight > pageHeight - 14) {
      doc.addPage();
      pageNum += 1;
      drawHeader(pageNum);
      y = 34;
      drawTableHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    if (idx % 2 === 0) {
      doc.setFillColor(255, 250, 240);
      doc.rect(margin, y - 4.5, pageWidth - margin * 2, rowHeight, 'F');
    }

    doc.setTextColor(27, 27, 27);
    doc.text(String(idx + 1), cols[0].x + 1.5, y);
    doc.text(r.pass_number, cols[1].x + 1.5, y);
    doc.text(r.student_name.slice(0, 26), cols[2].x + 1.5, y);
    doc.text(talentLines, cols[3].x + 1.5, y);
    doc.text(formatFoodLabel(r.food_preference), cols[4].x + 1.5, y);
    doc.text(noteLines, cols[5].x + 1.5, y);
    doc.text(formatDateTime(r.created_at).slice(0, 17), cols[6].x + 1.5, y);

    y += rowHeight;
  });

  doc.save(filename);
}

export { sanitizeFilename };
