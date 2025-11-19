
function leerFichero() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Por favor, selecciona un archivo.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.Sheets["ML"]) {
            alert("La hoja ML no existe en el excel seleccionado");
            return;
        }

        const ws = workbook.Sheets["ML"];

        const ipnb_id = getValueByColumnName(ws, "IPNB ID");
        const vrf_cp = getValueByColumnName(ws, "VRF (CP/UP)").split("/")[0];
        const vrf_up = getValueByColumnName(ws, "VRF (CP/UP)").split("/")[1] || "";
        const wbtsname = getValueByColumnName(ws, "WBTSNAME");
        const qnup_id = getValueByColumnName(ws, "QNUP ID");
        const rnc_ip_address = getValueByColumnName(ws, "RNC IP ADDRESS (NPGE/QNUP)");
        const nb_ip_servicio =getValueByColumnName(ws, "NB IP SERVICIO");

        // Rellenar los campos del formulario
        document.getElementById('ipnb_id').value = ipnb_id;
        document.getElementById('vrf_cp').value = vrf_cp;
        document.getElementById('vrf_up').value = vrf_up;
        document.getElementById('wbtsname').value = wbtsname;
        document.getElementById('qnup_id').value = qnup_id;
        document.getElementById('rnc_ip_address').value = rnc_ip_address;
        document.getElementById('nb_ip_servicio').value = nb_ip_servicio;

        // Llamar a la función para cada campo después de leer los valores
        applyErrorColor('ipnb_id');
        applyErrorColor('vrf_cp');
        applyErrorColor('vrf_up');
        applyErrorColor('wbtsname');
        applyErrorColor('qnup_id');
        applyErrorColor('rnc_ip_address');
        applyErrorColor('nb_ip_servicio');

         // ⭐⭐ ACTUALIZAR DIAGRAMA ⭐⭐
        renderRncDiagram();
    };

    reader.readAsArrayBuffer(file);
}

function getValueByColumnName(ws, columnName) {
    const range = XLSX.utils.decode_range(ws['!ref']); 
    let columnIndex = -1;

    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col }); 
        if (ws[cellAddress] && ws[cellAddress].v === columnName) {
            columnIndex = col;
            break;
        }
    }

    if (columnIndex !== -1) {
        const cellAddress = XLSX.utils.encode_cell({ r: 1, c: columnIndex }); 
        return ws[cellAddress] ? ws[cellAddress].v : "##ERROR## En campo " + columnName;
    }
    return "##ERROR## No se ha encontrado " + columnName;;
}

function applyErrorColor(fieldId) {
    const field = document.getElementById(fieldId);
    if (field.value.includes("ERROR")) {
        field.style.color = "red"; 
    } else {
        field.style.color = "black"; 
    }
}

function generarSalida() {
    const ipnb_id = document.getElementById('ipnb_id').value;
    const vrf_cp = document.getElementById('vrf_cp').value;
    const vrf_up = document.getElementById('vrf_up').value;
    const wbtsname = document.getElementById('wbtsname').value;
    const qnup_id = document.getElementById('qnup_id').value;
    const rnc_ip_address = document.getElementById('rnc_ip_address').value;
    const nb_ip_servicio = document.getElementById('nb_ip_servicio').value;

    let myString = `
*********************************************************************************************************
CREACION RUTA A NIVEL DE McRNC
*********************************************************************************************************


************************************************************** CONSULTA *********************************************************
show networking ipro ipbr-id ${ipnb_id}
show networking ipbr ipbr-id ${ipnb_id}
show networking instance ${vrf_cp} monitoring bfd session config name ${wbtsname}
    `

    if (vrf_up != "") {
      myString += `
show networking instance ${vrf_up} monitoring bfd session config name ${wbtsname}\n\n`
    }

    myString += `
********************************************************************************** CREACION **********************************************************

add networking ipbr ipbr-id ${ipnb_id} ipbr-name ${wbtsname} route-bandwidth 100000 committed-bandwidth 25000 committed-sig-bandwidth 750 committed-dcn-bandwidth 100 dspm-profile-id 4 phb-profile-id 4 ifc-nrtdch IFC ifc-nrthsdpa IFC scheduler-type virtualQueue

add networking ipro ipbr-id ${ipnb_id} vrf ${vrf_cp} owner /QNUP-${qnup_id} iface iub_${vrf_cp.substring(3)} ip-address ${rnc_ip_address}
    `
    if (vrf_up != "") {
      myString +=`
add networking ipro ipbr-id ${ipnb_id} vrf ${vrf_up} owner /QNUP-${qnup_id} iface iub_${vrf_cp.substring(3)} ip-address ${rnc_ip_address}\n\n`
    }

    myString +=`
add networking instance ${vrf_cp} monitoring bfd session /QNUP-${qnup_id} name ${wbtsname} srcaddr ${rnc_ip_address} dstaddr ${nb_ip_servicio} reference-id 78 rx-interval 500 tx-interval 500 detect-mult 5\n\n`

    if (vrf_up != "") {
      myString +=`
add networking instance ${vrf_up} monitoring bfd session /QNUP-${qnup_id} name ${wbtsname} srcaddr ${rnc_ip_address} dstaddr ${nb_ip_servicio} reference-id 78 rx-interval 500 tx-interval 500 detect-mult 5\n\n`
    }

    // Insertar la cadena en el elemento <pre>
    document.getElementById('myPre').textContent = myString;

}

function descargarContenido() {
    // Obtener el contenido del elemento <pre>
    const content = document.getElementById('myPre').textContent;

    // Crear un blob con el contenido
    const blob = new Blob([content], { type: 'text/plain' });

    // Crear un enlace de descarga
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'contenido.txt'; // Nombre del archivo

    // Simular un clic en el enlace para iniciar la descarga
    link.click();

    // Liberar el objeto URL
    URL.revokeObjectURL(link.href);
}

function renderRncDiagram() {
    const ipnb_id = document.getElementById("ipnb_id").value || "IPNB?";
    const wbtsname = document.getElementById("wbtsname").value || "WBTS?";
    const rnc_ip = document.getElementById("rnc_ip_address").value || "RNC IP?";
    const nb_ip = document.getElementById("nb_ip_servicio").value || "NB IP?";
    const vrf_cp = document.getElementById("vrf_cp").value || "VRF-CP?";
    const vrf_up = document.getElementById("vrf_up").value || "VRF-UP?";
    const qnup_id = document.getElementById("qnup_id").value || "QNUP?";

    const svg = `
    <svg width="900" height="500">

        <!-- CN (Core Network) -->
        <rect x="330" y="20" width="240" height="70" rx="15" fill="#bed9ff" stroke="#5677a8" stroke-width="2"/>
        <text x="450" y="50" text-anchor="middle" class="rncLabel">CORE NETWORK</text>
        <text x="450" y="70" text-anchor="middle" class="nodeLabel">(IuCS / IuPS)</text>

        <!-- Line CN -> RNC -->
        <line x1="450" y1="90" x2="450" y2="140" stroke="#d98e4e" stroke-width="3"/>

        <!-- RNC BLOCK -->
        <rect x="260" y="140" width="380" height="140" rx="15" fill="#c8f3df" stroke="#4da67a" stroke-width="2"/>
        <text x="450" y="170" text-anchor="middle" class="rncLabel">RNC</text>

        <!-- RNC PARAMS -->
        <text x="450" y="195" text-anchor="middle" class="nodeLabel">IP: ${rnc_ip}</text>
        <text x="450" y="215" text-anchor="middle" class="nodeLabel">VRF CP: ${vrf_cp}</text>
        <text x="450" y="235" text-anchor="middle" class="nodeLabel">VRF UP: ${vrf_up}</text>
        <text x="450" y="255" text-anchor="middle" class="nodeLabel">QNUP ID: ${qnup_id}</text>

        <!-- LINES FROM RNC TO NODEBs -->
        <line x1="450" y1="280" x2="200" y2="350" stroke="#d98e4e" stroke-width="3"/>
        <line x1="450" y1="280" x2="450" y2="350" stroke="#d98e4e" stroke-width="3"/>
        <line x1="450" y1="280" x2="700" y2="350" stroke="#d98e4e" stroke-width="3"/>

        <!-- NODEB 1 (WBTS principal) -->
        <rect x="150" y="350" width="120" height="80" rx="10" fill="#a8e59d" stroke="#4f7a42" stroke-width="2"/>
        <text x="210" y="380" text-anchor="middle" class="nodeLabel">${wbtsname}</text>
        <text x="210" y="400" text-anchor="middle" class="nodeLabel">NB IP: ${nb_ip}</text>
        <text x="210" y="420" text-anchor="middle" class="nodeLabel">IPNB ID: ${ipnb_id}</text>

        <!-- NODEB 2 -->
        <rect x="390" y="350" width="120" height="80" rx="10" fill="#d9f7d6" stroke="#4f7a42" stroke-width="2"/>
        <text x="450" y="390" text-anchor="middle" class="nodeLabel">NodeB 2</text>

        <!-- NODEB 3 -->
        <rect x="630" y="350" width="120" height="80" rx="10" fill="#d9f7d6" stroke="#4f7a42" stroke-width="2"/>
        <text x="690" y="390" text-anchor="middle" class="nodeLabel">NodeB 3</text>

    </svg>
    `;

    document.getElementById("rncDiagramContainer").innerHTML = svg;
}


// Actualiza el diagrama cada vez que se cambie un campo
["ipnb_id", "wbtsname", "rnc_ip_address", "nb_ip_servicio", "vrf_cp"]
    .forEach(id => {
        document.getElementById(id).addEventListener("input", renderRncDiagram);
    });

// Render inicial
document.addEventListener("DOMContentLoaded", renderRncDiagram);
