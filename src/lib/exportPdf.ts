/**
 * تحويل صفوف بيانات (نفس بنية أوراق Excel) إلى ملف PDF وتنزيله مباشرة من المتصفح.
 * يُبنى جدول HTML مؤقت (خارج الشاشة) بحيث يتولى المتصفح رسم النص العربي بشكل صحيح
 * (تشكيل واتجاه) قبل تحويله لصفحات PDF عبر jsPDF + html2canvas.
 * يجب استدعاؤها من مكوّن عميل فقط (تعتمد على document/window).
 */
export async function downloadRowsAsPdf({
  title,
  fileName,
  sheets,
}: {
  title: string;
  fileName: string;
  sheets: { name: string; rows: Record<string, unknown>[] }[];
}) {
  const { jsPDF } = await import("jspdf");

  const container = document.createElement("div");
  container.setAttribute("dir", "rtl");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-10000px";
  container.style.width = "1000px";
  container.style.background = "#ffffff";
  container.style.padding = "24px";
  container.style.fontFamily = "Tahoma, Arial, sans-serif";
  container.style.color = "#0f172a";

  const titleEl = document.createElement("h1");
  titleEl.textContent = title;
  titleEl.style.cssText = "font-size:20px; margin:0 0 16px; text-align:right;";
  container.appendChild(titleEl);

  for (const sheet of sheets) {
    const heading = document.createElement("h2");
    heading.textContent = sheet.name;
    heading.style.cssText = "font-size:15px; margin:20px 0 8px; text-align:right;";
    container.appendChild(heading);

    const rows = sheet.rows.length ? sheet.rows : [{ "تنبيه": "لا توجد بيانات ضمن هذا النطاق" }];
    const headers = Object.keys(rows[0]);

    const table = document.createElement("table");
    table.setAttribute("dir", "rtl");
    table.style.cssText = "width:100%; border-collapse:collapse; font-size:11px;";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      th.style.cssText =
        "border:1px solid #cbd5e1; background:#f1f5f9; padding:6px 8px; text-align:right; font-weight:600;";
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      headers.forEach((h) => {
        const td = document.createElement("td");
        const value = row[h];
        td.textContent = value === null || value === undefined || value === "" ? "—" : String(value);
        td.style.cssText = "border:1px solid #e2e8f0; padding:6px 8px; text-align:right;";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    await pdf.html(container, {
      x: 24,
      y: 24,
      width: 547,
      windowWidth: 1000,
      autoPaging: "slice",
      html2canvas: { scale: 0.65, useCORS: true, backgroundColor: "#ffffff" },
    });
    pdf.save(`${fileName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
