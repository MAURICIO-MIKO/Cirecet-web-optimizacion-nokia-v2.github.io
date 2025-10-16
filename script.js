// --- FUNCIONALIDAD PRINCIPAL ---

document.getElementById("leerExcelBtn").addEventListener("click", () => {
  const file = document.getElementById("excelFile").files[0];
  if (!file) {
    alert("Selecciona un archivo Excel primero.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheet5G = workbook.Sheets["5G"];
    const sheet4G = workbook.Sheets["4G"];

    const form5g = document.getElementById("form5g");
    const form4g = document.getElementById("form4g");
    form5g.innerHTML = "";
    form4g.innerHTML = "";

    if (sheet5G) generarFormulario(sheet5G, form5g);
    if (sheet4G) generarFormulario(sheet4G, form4g);

    document.getElementById("formularios").classList.remove("hidden");
  };
  reader.readAsArrayBuffer(file);
});

function generarFormulario(sheet, contenedor) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (data.length < 2) return;

  const headers = data[0];
  const values = data[1];

  headers.forEach((campo, i) => {
    if (!campo) return;
    const valor = values[i] || "";
    const div = document.createElement("div");
    div.classList.add("form-item");
    div.innerHTML = `
      <label>${campo}</label>
      <input type="text" name="${campo}" value="${valor}" />
    `;
    contenedor.appendChild(div);
  });
}

// --- GENERAR XML ---
document.getElementById("generarBtn").addEventListener("click", async () => {
  const plantilla = document.getElementById("plantilla").value;
  const excel = document.getElementById("excelFile").files[0];
  const resultado = document.getElementById("resultado");

  if (!excel) {
    alert("Debes seleccionar un archivo Excel.");
    return;
  }

  const formData = new FormData();
  formData.append("excel", excel);
  formData.append("plantilla", plantilla);

  resultado.innerHTML = "Procesando... ⏳";

  try {
    const res = await fetch("https://nokia-backend.onrender.com/procesar", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "salida.xml";
      a.click();
      URL.revokeObjectURL(url);
      resultado.innerHTML = "✅ XML generado correctamente.";
    } else {
      const errorText = await res.text();
      resultado.innerHTML = `❌ Error al generar XML:<br>${errorText}`;
    }
  } catch (err) {
    console.error(err);
    resultado.innerHTML = "⚠️ Error de conexión con el servidor.";
  }
});
