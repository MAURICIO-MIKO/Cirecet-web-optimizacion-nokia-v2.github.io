document.getElementById("leerExcelBtn").addEventListener("click", async () => {
  const excelFile = document.getElementById("excelFile").files[0];
  const plantilla = document.getElementById("plantilla").value;
  const resultado = document.getElementById("resultado");

  if (!excelFile) {
    alert("Selecciona un archivo Excel primero.");
    return;
  }

  const formData = new FormData();
  formData.append("excel", excelFile);
  formData.append("plantilla", plantilla);

  // 🌐 Tu backend desplegado en Render
  const apiUrl = "https://nokia-backend.onrender.com/procesar";

  try {
    resultado.innerHTML = "Procesando... ⏳";
    const res = await fetch(apiUrl, { method: "POST", body: formData });

    if (!res.ok) throw new Error(`Error API: ${res.status}`);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "salida.xml";
    a.click();

    resultado.innerHTML = "<span style='color:green;'>✅ XML generado correctamente.</span>";
  } catch (err) {
    console.error(err);
    resultado.innerHTML = "<span style='color:red;'>❌ Error generando XML.</span>";
  }
});
