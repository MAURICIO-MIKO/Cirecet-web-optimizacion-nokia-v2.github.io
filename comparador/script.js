document.getElementById("compararBtn").addEventListener("click", async () => {
  const file1 = document.getElementById("excel1").files[0];
  const file2 = document.getElementById("excel2").files[0];
  const resultado = document.getElementById("resultado");

  if (!file1 || !file2) {
    alert("Selecciona los dos archivos Excel primero.");
    return;
  }

  resultado.classList.remove("hidden");
  resultado.innerHTML = "📂 Analizando hojas 5G y 4G... ⏳";

  try {
    const workbook1 = await leerLibro(file1);
    const workbook2 = await leerLibro(file2);
    let htmlTotal = "";

    const hojasObjetivo = ["5G", "4G"];

    for (const hoja of hojasObjetivo) {
      const data1 = leerHoja(workbook1, hoja);
      const data2 = leerHoja(workbook2, hoja);

      if (!data1 || !data2) {
        htmlTotal += `<h3>⚠️ No se encontró la hoja "${hoja}" en alguno de los archivos.</h3>`;
        continue;
      }

      const [headers1, fila2_1] = data1;
      const [headers2, fila2_2] = data2;

      // === CAMPOS CRÍTICOS SEGÚN TU PY ===
      const camposCriticos = hoja === "5G" ? [
        "Site NAME",
        "Cod. CelSig",
        "gNodeB NAME",
        "mrBTSId",
        "gNodeB id",
        "O&M gNB IP",
        "O&M NetMask",
        "O&M Gateway",
        "O&M VLAN",
        "O&M iOMS-prim IP",
        "O&M iOMS-sec IP",
        "O&M NetAct Subnet",
        "O&M PKI Server IP",
        "Sync gNB IP",
        "Sync NetMask",
        "Sync Gateway",
        "Sync VLAN",
        "Sync ToP1 IP",
        "Sync ToP2 IP",
        "S1 gNB IP/OUTER IP",
        "S1-X2 NetMask",
        "S1-X2 Gateway",
        "S1-X2 VLAN",
        "INNER IP",
        "Security Gateway IP",
        "TAC",
        "AMF nvpcc-amf01/2/3-mde1",
        "AMF nvpcc-amf01/2/3-mno1",
        "AMF nvpcc-amf01/2/3-bep1",
        "AMF nvpcc-amf01/2/3-btb1",
        "AMF nvpcc-amf01/2/3-mad1",
        "Zero correlation zone config NR3500",
        "Prach Configuration Index NR3500",
        "Phys Cell Id NR3500",
        "PRACH root sequence Index NR3500"
      ] : [
        "eNodeB id",
        "S1 eNB IP/OUTER IP",
        "S1 NetMask",
        "S1 Gateway",
        "S1 VLAN",
        "INNER IP",
        "Security Gateway IP",
        "MME1 (IP1/IP2)",
        "MME2 (IP1/IP2)",
        "MME3 (IP1/IP2)",
        "MME4 (IP1/IP2)",
        // 🔥 Siempre incluir ambos bloques de LTE
        "PrachCS L1800",
        "Physical Layer Cell Identity L1800",
        "RACH root sequence L1800",
        "PrachCS L2600",
        "Physical Layer Cell Identity L2600",
        "RACH root sequence L2600"
      ];

      const diferencias = [];
      const coincidencias = [];

      // === COMPARACIÓN POR NOMBRE DE COLUMNA ===
      for (const headerCritico of camposCriticos) {
        const idx1 = headers1.findIndex(h => h.trim().toUpperCase() === headerCritico.toUpperCase());
        const idx2 = headers2.findIndex(h => h.trim().toUpperCase() === headerCritico.toUpperCase());

        if (idx1 === -1 || idx2 === -1) {
          diferencias.push({
            hoja,
            col: headerCritico,
            celda: idx1 === -1 ? "❌ No existe en Excel 1" : "❌ No existe en Excel 2",
            v1: idx1 === -1 ? "—" : fila2_1[idx1],
            v2: idx2 === -1 ? "—" : fila2_2[idx2],
            tipo1: idx1 === -1 ? "n/a" : typeof fila2_1[idx1],
            tipo2: idx2 === -1 ? "n/a" : typeof fila2_2[idx2],
          });
          continue;
        }

        const v1 = fila2_1[idx1];
        const v2 = fila2_2[idx2];
        const tipo1 = typeof v1;
        const tipo2 = typeof v2;

        const normalizar = (val) => {
          if (val === null || val === undefined) return "";
          if (typeof val === "number") return String(val).trim();
          return String(val).trim().toUpperCase();
        };

        const n1 = normalizar(v1);
        const n2 = normalizar(v2);

        const colLetter1 = indiceAColumna(idx1);
        const colLetter2 = indiceAColumna(idx2);

        if (n1 !== n2 || tipo1 !== tipo2) {
          diferencias.push({
            hoja,
            col: headerCritico,
            celda: `${colLetter1}2 / ${colLetter2}2`,
            v1,
            v2,
            tipo1,
            tipo2,
          });
        } else {
          coincidencias.push({
            hoja,
            col: headerCritico,
            celda: `${colLetter1}2`,
            v1,
            v2,
            tipo1,
            tipo2,
          });
        }
      }

      // === MOSTRAR RESULTADO ===
      htmlTotal += `
        <h3>${diferencias.length === 0
          ? `✅ Hoja ${hoja}: todos los parámetros críticos son idénticos`
          : `⚠️ ${diferencias.length} diferencias encontradas en hoja ${hoja}`}</h3>
        <form id="form-${hoja}" class="grid-form">
      `;

      const todos = [...coincidencias, ...diferencias];
      htmlTotal += todos
        .map((d) => {
          const esDiff = diferencias.some(x => x.col === d.col && x.celda === d.celda);
          const bg = esDiff ? "#fff7e6" : "#eaffea";
          const colorMsg = esDiff ? "red" : "green";
          const msg = esDiff ? "⚠️ Diferencia detectada" : "✅ Coincide con el otro Excel";

          // 🎨 Colores por bloque LTE
          const esL1800 = d.col.includes("L1800");
          const esL2600 = d.col.includes("L2600");
          const borde = esL1800 ? "2px solid #007bff" : esL2600 ? "2px solid #ff8800" : "none";

          return `
            <div class="form-item" style="background:${bg}; border-left:${borde};">
              <label>
                📄 Hoja: <b>${d.hoja}</b><br>
                🧩 Campo XML: <b>${d.col}</b><br>
                📍 Celda: <b>${d.celda}</b>
              </label>
              <p>Excel 1 (${d.tipo1}):</p>
              <input type="text" value="${d.v1}" style="background:${esDiff ? "#ffe5e5" : "#eaffea"}"/>
              <p>Excel 2 (${d.tipo2}):</p>
              <input type="text" value="${d.v2}" style="background:${esDiff ? "#e5ffe5" : "#eaffea"}"/>
              <p style="color:${colorMsg};font-weight:bold">${msg}</p>
            </div>
          `;
        })
        .join("");

      htmlTotal += `
          <button type="button" id="btnGuardar-${hoja}" class="btn-success">💾 Guardar correcciones</button>
        </form>
      `;
    }

    resultado.innerHTML = htmlTotal;

    // === EVENTO DE GUARDADO (SIMULADO) ===
    document.querySelectorAll("[id^='btnGuardar-']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const hoja = btn.id.replace("btnGuardar-", "");
        alert(`✅ Cambios en hoja ${hoja} guardados (simulado).`);
      });
    });

  } catch (err) {
    console.error(err);
    resultado.innerHTML = `<h3>⚠️ Error al procesar los archivos Excel.</h3><p>${err.message}</p>`;
  }
});


// === FUNCIONES AUXILIARES ===
async function leerLibro(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      resolve(workbook);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function leerHoja(workbook, nombreHoja) {
  const sheet = workbook.Sheets[nombreHoja];
  if (!sheet) return null;
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headers = data[0]?.map(h => String(h).trim()) || [];
  const fila2 = data[1] || [];
  return [headers, fila2];
}

function indiceAColumna(indice) {
  let columna = "";
  let n = indice + 1;
  while (n > 0) {
    const resto = (n - 1) % 26;
    columna = String.fromCharCode(65 + resto) + columna;
    n = Math.floor((n - 1) / 26);
  }
  return columna;
}
