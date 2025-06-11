// Sistema de Gestión de Combis - LocalStorage Implementation
class CombiManagementSystem {
  constructor() {
    this.initializeData()
    this.loadDashboardData()
    this.setupEventListeners()
  }

  // Initialize default data if not exists
  initializeData() {
    if (!localStorage.getItem("combis")) {
      const defaultCombis = [
        { id: "COMBI-001", asientos: 20, estado: "Activa", fechaRegistro: new Date().toISOString() },
        { id: "COMBI-002", asientos: 16, estado: "Activa", fechaRegistro: new Date().toISOString() },
      ]
      localStorage.setItem("combis", JSON.stringify(defaultCombis))
    }

    if (!localStorage.getItem("choferes")) {
      const defaultChoferes = [
        {
          id: 1,
          nombre: "Juan Pérez García",
          telefono: "999-123-4567",
          licencia: "LIC123456",
          estado: "Disponible",
          fechaRegistro: new Date().toISOString(),
        },
        {
          id: 2,
          nombre: "María González López",
          telefono: "999-987-6543",
          licencia: "LIC789012",
          estado: "En Ruta",
          fechaRegistro: new Date().toISOString(),
        },
      ]
      localStorage.setItem("choferes", JSON.stringify(defaultChoferes))
    }

    if (!localStorage.getItem("rutas")) {
      const defaultRutas = [
        {
          id: 1,
          origen: "Dzitbalché",
          destino: "Campeche",
          precio: 25.0,
          duracion: 90,
          fechaCreacion: new Date().toISOString(),
        },
        {
          id: 2,
          origen: "Campeche",
          destino: "Dzitbalché",
          precio: 25.0,
          duracion: 90,
          fechaCreacion: new Date().toISOString(),
        },
      ]
      localStorage.setItem("rutas", JSON.stringify(defaultRutas))
    }

    if (!localStorage.getItem("horarios")) {
      const defaultHorarios = [
        {
          id: 1,
          rutaId: 1,
          horario: "14:30",
          combiId: "COMBI-001",
          choferId: 1,
          fecha: new Date().toISOString().split("T")[0],
          asientosOcupados: [1, 3, 7, 12, 15],
        },
        {
          id: 2,
          rutaId: 2,
          horario: "16:00",
          combiId: "COMBI-002",
          choferId: 2,
          fecha: new Date().toISOString().split("T")[0],
          asientosOcupados: [2, 5, 8, 11, 14, 16, 18, 20],
        },
      ]
      localStorage.setItem("horarios", JSON.stringify(defaultHorarios))
    }

    if (!localStorage.getItem("reservas")) {
      const defaultReservas = [
        {
          id: 1234,
          pasajero: {
            nombre: "Ana García",
            telefono: "999-123-4567",
          },
          horarioId: 1,
          asientos: [1],
          total: 25.0,
          estado: "Confirmada",
          metodoPago: "efectivo",
          fechaCreacion: new Date().toISOString(),
          fechaVencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 1235,
          pasajero: {
            nombre: "Carlos López",
            telefono: "999-987-6543",
          },
          horarioId: 1,
          asientos: [3],
          total: 25.0,
          estado: "Pendiente",
          metodoPago: "efectivo",
          fechaCreacion: new Date().toISOString(),
          fechaVencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      ]
      localStorage.setItem("reservas", JSON.stringify(defaultReservas))
    }
  }

  // Get data from localStorage
  getData(key) {
    return JSON.parse(localStorage.getItem(key) || "[]")
  }

  // Save data to localStorage
  saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data))
  }

  // Setup event listeners
  setupEventListeners() {
    // Form submissions
    document.getElementById("combi-form-element").addEventListener("submit", (e) => this.handleCombiSubmit(e))
    document.getElementById("chofer-form-element").addEventListener("submit", (e) => this.handleChoferSubmit(e))
    document.getElementById("ruta-form-element").addEventListener("submit", (e) => this.handleRutaSubmit(e))
    document.getElementById("horario-form").addEventListener("submit", (e) => this.handleHorarioSubmit(e))
  }

  // Dashboard methods
  loadDashboardData() {
    const reservas = this.getData("reservas")
    const today = new Date().toISOString().split("T")[0]

    // Calculate metrics
    const reservasHoy = reservas.filter((r) => r.fechaCreacion.split("T")[0] === today)
    const pasajerosHoy = reservasHoy
      .filter((r) => r.estado === "Confirmada")
      .reduce((sum, r) => sum + r.asientos.length, 0)
    const ingresosHoy = reservasHoy.filter((r) => r.estado === "Confirmada").reduce((sum, r) => sum + r.total, 0)
    const pagosPendientes = reservas.filter((r) => r.estado === "Pendiente").length

    // Update dashboard
    document.getElementById("pasajeros-hoy").textContent = pasajerosHoy
    document.getElementById("ingresos-hoy").textContent = `$${ingresosHoy.toFixed(2)}`
    document.getElementById("viajes-hoy").textContent = this.getData("horarios").filter((h) => h.fecha === today).length
    document.getElementById("pagos-pendientes").textContent = pagosPendientes

    this.loadAlertas()
    this.loadOcupacion()
  }

  loadAlertas() {
    const container = document.getElementById("alertas-container")
    const reservas = this.getData("reservas")
    const alertas = []

    // Check for pending payments
    reservas
      .filter((r) => r.estado === "Pendiente")
      .forEach((reserva) => {
        const vencimiento = new Date(reserva.fechaVencimiento)
        const ahora = new Date()
        const horasRestantes = Math.ceil((vencimiento - ahora) / (1000 * 60 * 60))

        if (horasRestantes <= 2 && horasRestantes > 0) {
          alertas.push({
            tipo: "warning",
            titulo: "Pago pendiente",
            mensaje: `Reserva #${reserva.id} vence en ${horasRestantes} horas`,
            icono: "fas fa-exclamation-triangle",
          })
        }
      })

    // Check for upcoming trips
    const horarios = this.getData("horarios")
    const ahora = new Date()
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes()

    horarios.forEach((horario) => {
      const [hora, minuto] = horario.horario.split(":").map(Number)
      const horarioMinutos = hora * 60 + minuto
      const diferencia = horarioMinutos - horaActual

      if (diferencia > 0 && diferencia <= 60) {
        const rutas = this.getData("rutas")
        const ruta = rutas.find((r) => r.id === horario.rutaId)
        if (ruta) {
          alertas.push({
            tipo: "info",
            titulo: "Viaje próximo",
            mensaje: `${ruta.origen} - ${ruta.destino} ${horario.horario}`,
            icono: "fas fa-info-circle",
          })
        }
      }
    })

    if (alertas.length === 0) {
      container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-bell-slash text-3xl mb-2"></i>
                    <p>No hay alertas pendientes</p>
                </div>
            `
    } else {
      container.innerHTML = alertas
        .map(
          (alerta) => `
                <div class="flex items-center p-3 ${alerta.tipo === "warning" ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-blue-50 dark:bg-blue-900/20"} rounded-lg">
                    <i class="${alerta.icono} ${alerta.tipo === "warning" ? "text-yellow-600" : "text-blue-600"} mr-3"></i>
                    <div>
                        <p class="font-medium">${alerta.titulo}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${alerta.mensaje}</p>
                    </div>
                </div>
            `,
        )
        .join("")
    }
  }

  loadOcupacion() {
    const container = document.getElementById("ocupacion-container")
    const horarios = this.getData("horarios")
    const combis = this.getData("combis")
    const rutas = this.getData("rutas")
    const today = new Date().toISOString().split("T")[0]

    const horariosHoy = horarios.filter((h) => h.fecha === today)

    if (horariosHoy.length === 0) {
      container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-bus text-3xl mb-2"></i>
                    <p>No hay viajes programados</p>
                </div>
            `
      return
    }

    container.innerHTML = horariosHoy
      .map((horario) => {
        const combi = combis.find((c) => c.id === horario.combiId)
        const ruta = rutas.find((r) => r.id === horario.rutaId)
        const ocupados = horario.asientosOcupados.length
        const total = combi ? combi.asientos : 20
        const porcentaje = (ocupados / total) * 100

        let colorClass = "bg-green-600"
        if (porcentaje >= 80) colorClass = "bg-red-600"
        else if (porcentaje >= 60) colorClass = "bg-yellow-600"

        return `
                <div class="flex items-center justify-between">
                    <span>${horario.combiId} (${horario.horario})</span>
                    <div class="flex items-center">
                        <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div class="${colorClass} h-2 rounded-full" style="width: ${porcentaje}%"></div>
                        </div>
                        <span class="text-sm">${ocupados}/${total}</span>
                    </div>
                </div>
            `
      })
      .join("")
  }

  // Combis management
  handleCombiSubmit(e) {
    e.preventDefault()
    const id = document.getElementById("combi-id").value
    const asientos = Number.parseInt(document.getElementById("combi-asientos").value)

    const combis = this.getData("combis")

    // Check if ID already exists
    if (combis.find((c) => c.id === id)) {
      showToast("❌ Ya existe una combi con ese identificador", "error")
      return
    }

    const newCombi = {
      id,
      asientos,
      estado: "Activa",
      fechaRegistro: new Date().toISOString(),
    }

    combis.push(newCombi)
    this.saveData("combis", combis)

    showToast(`✅ Combi ${id} registrada exitosamente!`, "success")
    hideCombiForm()
    this.loadCombisList()
    this.updateCombiSelects()
  }

  loadCombisList() {
    const combis = this.getData("combis")
    const tbody = document.getElementById("combis-list")

    if (combis.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-8 text-center text-gray-500 dark:text-gray-400">
                        No hay combis registradas
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = combis
      .map(
        (combi) => `
            <tr class="border-b border-gray-100 dark:border-gray-800">
                <td class="py-3 font-medium">${combi.id}</td>
                <td class="py-3">${combi.asientos}</td>
                <td class="py-3">
                    <span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm">
                        ${combi.estado}
                    </span>
                </td>
                <td class="py-3">
                    <button onclick="editCombi('${combi.id}')" class="text-blue-600 hover:text-blue-800 mr-3" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCombi('${combi.id}')" class="text-red-600 hover:text-red-800" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `,
      )
      .join("")
  }

  deleteCombi(id) {
    if (confirm(`¿Está seguro de eliminar la combi ${id}?`)) {
      const combis = this.getData("combis")
      const filtered = combis.filter((c) => c.id !== id)
      this.saveData("combis", filtered)
      showToast(`🗑️ Combi ${id} eliminada`, "info")
      this.loadCombisList()
      this.updateCombiSelects()
    }
  }

  updateCombiSelects() {
    const combis = this.getData("combis")
    const selects = ["horario-combi"]

    selects.forEach((selectId) => {
      const select = document.getElementById(selectId)
      if (select) {
        const currentValue = select.value
        select.innerHTML =
          '<option value="">Seleccionar combi...</option>' +
          combis.map((combi) => `<option value="${combi.id}">${combi.id}</option>`).join("")
        select.value = currentValue
      }
    })
  }

  // Choferes management
  handleChoferSubmit(e) {
    e.preventDefault()
    const nombre = document.getElementById("chofer-nombre").value
    const telefono = document.getElementById("chofer-telefono").value
    const licencia = document.getElementById("chofer-licencia").value

    const choferes = this.getData("choferes")
    const newId = Math.max(...choferes.map((c) => c.id), 0) + 1

    const newChofer = {
      id: newId,
      nombre,
      telefono,
      licencia,
      estado: "Disponible",
      fechaRegistro: new Date().toISOString(),
    }

    choferes.push(newChofer)
    this.saveData("choferes", choferes)

    showToast(`✅ Chofer ${nombre} registrado exitosamente!`, "success")
    hideChoferForm()
    this.loadChoferesList()
    this.updateChoferSelects()
  }

  loadChoferesList() {
    const choferes = this.getData("choferes")
    const tbody = document.getElementById("choferes-list")

    if (choferes.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-8 text-center text-gray-500 dark:text-gray-400">
                        No hay choferes registrados
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = choferes
      .map(
        (chofer) => `
            <tr class="border-b border-gray-100 dark:border-gray-800">
                <td class="py-3 font-medium">${chofer.nombre}</td>
                <td class="py-3">${chofer.telefono}</td>
                <td class="py-3">${chofer.licencia}</td>
                <td class="py-3">
                    <span class="px-2 py-1 rounded text-sm ${
                      chofer.estado === "Disponible"
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                    }">
                        ${chofer.estado}
                    </span>
                </td>
                <td class="py-3">
                    <button onclick="editChofer(${chofer.id})" class="text-blue-600 hover:text-blue-800 mr-3" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteChofer(${chofer.id})" class="text-red-600 hover:text-red-800" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `,
      )
      .join("")
  }

  deleteChofer(id) {
    if (confirm("¿Está seguro de eliminar este chofer?")) {
      const choferes = this.getData("choferes")
      const filtered = choferes.filter((c) => c.id !== id)
      this.saveData("choferes", filtered)
      showToast("🗑️ Chofer eliminado", "info")
      this.loadChoferesList()
      this.updateChoferSelects()
    }
  }

  updateChoferSelects() {
    const choferes = this.getData("choferes")
    const selects = ["horario-chofer"]

    selects.forEach((selectId) => {
      const select = document.getElementById(selectId)
      if (select) {
        const currentValue = select.value
        select.innerHTML =
          '<option value="">Seleccionar chofer...</option>' +
          choferes.map((chofer) => `<option value="${chofer.id}">${chofer.nombre}</option>`).join("")
        select.value = currentValue
      }
    })
  }

  // Rutas management
  handleRutaSubmit(e) {
    e.preventDefault()
    const origen = document.getElementById("ruta-origen").value
    const destino = document.getElementById("ruta-destino").value
    const precio = Number.parseFloat(document.getElementById("ruta-precio").value)
    const duracion = Number.parseInt(document.getElementById("ruta-duracion").value)

    const rutas = this.getData("rutas")
    const newId = Math.max(...rutas.map((r) => r.id), 0) + 1

    const newRuta = {
      id: newId,
      origen,
      destino,
      precio,
      duracion,
      fechaCreacion: new Date().toISOString(),
    }

    rutas.push(newRuta)
    this.saveData("rutas", rutas)

    showToast(`✅ Ruta ${origen} - ${destino} creada exitosamente!`, "success")
    hideRutaForm()
    this.loadRutasList()
    this.updateRutaSelects()
  }

  loadRutasList() {
    const rutas = this.getData("rutas")
    const container = document.getElementById("rutas-list")

    if (rutas.length === 0) {
      container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-route text-3xl mb-2"></i>
                    <p>No hay rutas creadas</p>
                </div>
            `
      return
    }

    container.innerHTML = rutas
      .map(
        (ruta) => `
            <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold">${ruta.origen} - ${ruta.destino}</h4>
                    <span class="text-primary font-bold">$${ruta.precio.toFixed(2)}</span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Duración: ${ruta.duracion} minutos</p>
                <div class="flex gap-2 mt-2">
                    <button onclick="editRuta(${ruta.id})" class="text-blue-600 hover:text-blue-800 text-sm">
                        <i class="fas fa-edit mr-1"></i>Editar
                    </button>
                    <button onclick="deleteRuta(${ruta.id})" class="text-red-600 hover:text-red-800 text-sm">
                        <i class="fas fa-trash mr-1"></i>Eliminar
                    </button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  deleteRuta(id) {
    if (confirm("¿Está seguro de eliminar esta ruta?")) {
      const rutas = this.getData("rutas")
      const filtered = rutas.filter((r) => r.id !== id)
      this.saveData("rutas", filtered)
      showToast("🗑️ Ruta eliminada", "info")
      this.loadRutasList()
      this.updateRutaSelects()
    }
  }

  updateRutaSelects() {
    const rutas = this.getData("rutas")
    const selects = ["horario-ruta", "reserva-ruta"]

    selects.forEach((selectId) => {
      const select = document.getElementById(selectId)
      if (select) {
        const currentValue = select.value
        select.innerHTML =
          '<option value="">Seleccionar ruta...</option>' +
          rutas.map((ruta) => `<option value="${ruta.id}">${ruta.origen} - ${ruta.destino}</option>`).join("")
        select.value = currentValue
      }
    })
  }

  // Horarios management
  handleHorarioSubmit(e) {
    e.preventDefault()
    const rutaId = Number.parseInt(document.getElementById("horario-ruta").value)
    const horario = document.getElementById("horario-salida").value
    const combiId = document.getElementById("horario-combi").value
    const choferId = Number.parseInt(document.getElementById("horario-chofer").value)

    const horarios = this.getData("horarios")
    const newId = Math.max(...horarios.map((h) => h.id), 0) + 1

    const newHorario = {
      id: newId,
      rutaId,
      horario,
      combiId,
      choferId,
      fecha: new Date().toISOString().split("T")[0],
      asientosOcupados: [],
    }

    horarios.push(newHorario)
    this.saveData("horarios", horarios)

    showToast(`✅ Horario ${horario} asignado exitosamente!`, "success")
    document.getElementById("horario-form").reset()
    this.loadHorariosList()
    this.loadDashboardData()
  }

  loadHorariosList() {
    const horarios = this.getData("horarios")
    const rutas = this.getData("rutas")
    const combis = this.getData("combis")
    const choferes = this.getData("choferes")
    const container = document.getElementById("horarios-list")
    const today = new Date().toISOString().split("T")[0]

    const horariosHoy = horarios.filter((h) => h.fecha === today)

    if (horariosHoy.length === 0) {
      container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-clock text-3xl mb-2"></i>
                    <p>No hay horarios programados</p>
                </div>
            `
      return
    }

    container.innerHTML = horariosHoy
      .map((horario) => {
        const ruta = rutas.find((r) => r.id === horario.rutaId)
        const combi = combis.find((c) => c.id === horario.combiId)
        const chofer = choferes.find((c) => c.id === horario.choferId)
        const ocupados = horario.asientosOcupados.length
        const total = combi ? combi.asientos : 20

        let statusClass = "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
        if (ocupados >= total * 0.8) statusClass = "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
        else if (ocupados >= total * 0.6)
          statusClass = "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"

        return `
                <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-semibold">${horario.horario} - ${ruta ? `${ruta.origen} → ${ruta.destino}` : "Ruta no encontrada"}</h4>
                        <span class="${statusClass} px-2 py-1 rounded text-sm">${ocupados}/${total}</span>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        ${horario.combiId} - ${chofer ? chofer.nombre : "Chofer no encontrado"}
                    </p>
                    <div class="flex gap-2 mt-2">
                        <button onclick="viewHorario(${horario.id})" class="text-blue-600 hover:text-blue-800 text-sm">
                            <i class="fas fa-eye mr-1"></i>Ver
                        </button>
                        <button onclick="cancelHorario(${horario.id})" class="text-red-600 hover:text-red-800 text-sm">
                            <i class="fas fa-ban mr-1"></i>Cancelar
                        </button>
                    </div>
                </div>
            `
      })
      .join("")
  }

  // Reservas management
  loadReservasList(filter = "todas") {
    const reservas = this.getData("reservas")
    const horarios = this.getData("horarios")
    const rutas = this.getData("rutas")
    const tbody = document.getElementById("reservas-list")

    let filteredReservas = reservas
    if (filter !== "todas") {
      const statusMap = {
        confirmadas: "Confirmada",
        pendientes: "Pendiente",
        canceladas: "Cancelada",
      }
      filteredReservas = reservas.filter((r) => r.estado === statusMap[filter])
    }

    if (filteredReservas.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="py-8 text-center text-gray-500 dark:text-gray-400">
                        No hay reservas ${filter === "todas" ? "" : filter}
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = filteredReservas
      .map((reserva) => {
        const horario = horarios.find((h) => h.id === reserva.horarioId)
        const ruta = horario ? rutas.find((r) => r.id === horario.rutaId) : null

        let statusClass = "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
        if (reserva.estado === "Pendiente")
          statusClass = "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
        else if (reserva.estado === "Cancelada")
          statusClass = "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"

        return `
                <tr class="border-b border-gray-100 dark:border-gray-800">
                    <td class="py-3 font-medium">#${reserva.id}</td>
                    <td class="py-3">
                        <div>
                            <div class="font-medium">${reserva.pasajero.nombre}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">${reserva.pasajero.telefono}</div>
                        </div>
                    </td>
                    <td class="py-3">${ruta ? `${ruta.origen} - ${ruta.destino}` : "N/A"}</td>
                    <td class="py-3">${horario ? horario.horario : "N/A"}</td>
                    <td class="py-3">${reserva.asientos.join(", ")}</td>
                    <td class="py-3">$${reserva.total.toFixed(2)}</td>
                    <td class="py-3">
                        <span class="${statusClass} px-2 py-1 rounded text-sm">${reserva.estado}</span>
                    </td>
                    <td class="py-3">
                        <button onclick="printTicket(${reserva.id})" class="text-blue-600 hover:text-blue-800 mr-2" title="Imprimir boleto">
                            <i class="fas fa-print"></i>
                        </button>
                        <button onclick="sendWhatsApp(${reserva.id})" class="text-green-600 hover:text-green-800 mr-2" title="Enviar WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        ${
                          reserva.estado === "Pendiente"
                            ? `
                            <button onclick="confirmPayment(${reserva.id})" class="text-green-600 hover:text-green-800 mr-2" title="Confirmar pago">
                                <i class="fas fa-check"></i>
                            </button>
                        `
                            : ""
                        }
                        <button onclick="cancelReservation(${reserva.id})" class="text-red-600 hover:text-red-800" title="Cancelar">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>
            `
      })
      .join("")
  }

  confirmPayment(reservaId) {
    const reservas = this.getData("reservas")
    const reserva = reservas.find((r) => r.id === reservaId)

    if (reserva) {
      reserva.estado = "Confirmada"
      this.saveData("reservas", reservas)
      showToast(`✅ Pago confirmado para reserva #${reservaId}`, "success")
      this.loadReservasList()
      this.loadDashboardData()
    }
  }

  cancelReservation(reservaId) {
    if (confirm(`¿Está seguro de cancelar la reserva #${reservaId}?`)) {
      const reservas = this.getData("reservas")
      const horarios = this.getData("horarios")
      const reserva = reservas.find((r) => r.id === reservaId)

      if (reserva) {
        // Free up seats
        const horario = horarios.find((h) => h.id === reserva.horarioId)
        if (horario) {
          reserva.asientos.forEach((asiento) => {
            const index = horario.asientosOcupados.indexOf(asiento)
            if (index > -1) {
              horario.asientosOcupados.splice(index, 1)
            }
          })
          this.saveData("horarios", horarios)
        }

        reserva.estado = "Cancelada"
        this.saveData("reservas", reservas)
        showToast(`❌ Reserva #${reservaId} cancelada`, "info")
        this.loadReservasList()
        this.loadDashboardData()
      }
    }
  }

  // Initialize system
  init() {
    this.loadCombisList()
    this.loadChoferesList()
    this.loadRutasList()
    this.loadHorariosList()
    this.loadReservasList()
    this.updateCombiSelects()
    this.updateChoferSelects()
    this.updateRutaSelects()
  }
}

// Global variables
let selectedSeats = []
let currentPrice = 25.0
let currentHorarioId = null
const combiSystem = new CombiManagementSystem()

// Dark mode detection
if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.classList.add("dark")
}
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
  if (event.matches) {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
})

// Navigation
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.add("hidden")
  })

  // Show selected section
  document.getElementById(sectionName + "-section").classList.remove("hidden")

  // Update active nav button
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("bg-primary-dark")
  })
  event.target.closest(".nav-btn").classList.add("bg-primary-dark")

  // Load section data
  if (sectionName === "combis") {
    combiSystem.loadCombisList()
  } else if (sectionName === "choferes") {
    combiSystem.loadChoferesList()
  } else if (sectionName === "rutas") {
    combiSystem.loadRutasList()
    combiSystem.loadHorariosList()
  } else if (sectionName === "reservas") {
    combiSystem.loadReservasList()
  } else if (sectionName === "dashboard") {
    combiSystem.loadDashboardData()
  }
}

// Combis Management
function showCombiForm() {
  document.getElementById("combi-form").classList.remove("hidden")
  updateSeatLayout()
}

function hideCombiForm() {
  document.getElementById("combi-form").classList.add("hidden")
  document.getElementById("combi-form-element").reset()
}

function updateSeatLayout() {
  const asientos = document.getElementById("combi-asientos").value
  const container = document.getElementById("seat-layout-preview")

  let layout = ""
  const rows = Math.ceil(asientos / 4)

  container.style.gridTemplateColumns = "repeat(4, 1fr)"

  for (let i = 1; i <= asientos; i++) {
    layout += `<div class="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">${i}</div>`
  }

  container.innerHTML = layout
}

function editCombi(id) {
  showToast("🔧 Función de edición en desarrollo", "info")
}

function deleteCombi(id) {
  combiSystem.deleteCombi(id)
}

// Choferes Management
function showChoferForm() {
  document.getElementById("chofer-form").classList.remove("hidden")
}

function hideChoferForm() {
  document.getElementById("chofer-form").classList.add("hidden")
  document.getElementById("chofer-form-element").reset()
}

function editChofer(id) {
  showToast("🔧 Función de edición en desarrollo", "info")
}

function deleteChofer(id) {
  combiSystem.deleteChofer(id)
}

// Rutas Management
function showRutaForm() {
  document.getElementById("ruta-form").classList.remove("hidden")
}

function hideRutaForm() {
  document.getElementById("ruta-form").classList.add("hidden")
  document.getElementById("ruta-form-element").reset()
}

function editRuta(id) {
  showToast("🔧 Función de edición en desarrollo", "info")
}

function deleteRuta(id) {
  combiSystem.deleteRuta(id)
}

function viewHorario(id) {
  showToast("👁️ Vista detallada en desarrollo", "info")
}

function cancelHorario(id) {
  if (confirm("¿Está seguro de cancelar este horario?")) {
    showToast("❌ Horario cancelado", "info")
  }
}

// Reservas Management
function showReservaForm() {
  document.getElementById("reserva-form").classList.remove("hidden")
  combiSystem.updateRutaSelects()
}

function hideReservaForm() {
  document.getElementById("reserva-form").classList.add("hidden")
  selectedSeats = []
  currentHorarioId = null
  updateSelectedSeatsDisplay()

  // Hide containers
  document.getElementById("seat-selection-container").classList.add("hidden")
  document.getElementById("passenger-info-container").classList.add("hidden")
  document.getElementById("payment-method-container").classList.add("hidden")

  // Reset form
  document.getElementById("reserva-ruta").value = ""
  document.getElementById("reserva-horario").value = ""
  document.getElementById("pasajero-nombre").value = ""
  document.getElementById("pasajero-telefono").value = ""
  document.querySelectorAll('input[name="payment-method"]').forEach((radio) => (radio.checked = false))
}

function updateAvailableHorarios() {
  const rutaId = Number.parseInt(document.getElementById("reserva-ruta").value)
  const horarioSelect = document.getElementById("reserva-horario")

  horarioSelect.innerHTML = '<option value="">Seleccionar horario...</option>'

  if (!rutaId) return

  const horarios = combiSystem.getData("horarios")
  const combis = combiSystem.getData("combis")
  const today = new Date().toISOString().split("T")[0]

  const horariosDisponibles = horarios.filter((h) => h.rutaId === rutaId && h.fecha === today)

  horariosDisponibles.forEach((horario) => {
    const combi = combis.find((c) => c.id === horario.combiId)
    const disponibles = combi ? combi.asientos - horario.asientosOcupados.length : 0

    if (disponibles > 0) {
      horarioSelect.innerHTML += `<option value="${horario.id}">${horario.horario} - ${horario.combiId} (${disponibles} disponibles)</option>`
    }
  })
}

function loadSeatLayout() {
  const horarioId = Number.parseInt(document.getElementById("reserva-horario").value)
  if (!horarioId) return

  currentHorarioId = horarioId
  const horarios = combiSystem.getData("horarios")
  const combis = combiSystem.getData("combis")
  const rutas = combiSystem.getData("rutas")

  const horario = horarios.find((h) => h.id === horarioId)
  const combi = combis.find((c) => c.id === horario.combiId)
  const ruta = rutas.find((r) => r.id === horario.rutaId)

  if (!horario || !combi || !ruta) return

  currentPrice = ruta.precio

  document.getElementById("seat-selection-container").classList.remove("hidden")
  document.getElementById("passenger-info-container").classList.remove("hidden")
  document.getElementById("payment-method-container").classList.remove("hidden")

  const container = document.getElementById("seat-layout-container")
  container.style.gridTemplateColumns = "repeat(4, 1fr)"

  let layout = ""
  const occupiedSeats = horario.asientosOcupados

  for (let i = 1; i <= combi.asientos; i++) {
    const isOccupied = occupiedSeats.includes(i)
    const seatClass = isOccupied ? "seat-occupied" : "seat-available"
    layout += `<div class="seat w-10 h-10 ${seatClass} rounded flex items-center justify-center text-white text-sm font-bold" 
                   onclick="${isOccupied ? "" : "toggleSeat(" + i + ")"}">${i}</div>`
  }

  container.innerHTML = layout
  selectedSeats = []
  updateSelectedSeatsDisplay()
}

function toggleSeat(seatNumber) {
  const seatElement = document.querySelector(`[onclick="toggleSeat(${seatNumber})"]`)

  if (selectedSeats.includes(seatNumber)) {
    // Deselect seat
    selectedSeats = selectedSeats.filter((s) => s !== seatNumber)
    seatElement.classList.remove("seat-selected")
    seatElement.classList.add("seat-available")
  } else {
    // Select seat
    selectedSeats.push(seatNumber)
    seatElement.classList.remove("seat-available")
    seatElement.classList.add("seat-selected")
  }

  updateSelectedSeatsDisplay()
}

function updateSelectedSeatsDisplay() {
  const seatsList = document.getElementById("selected-seats-list")
  const totalPrice = document.getElementById("total-price")

  if (selectedSeats.length === 0) {
    seatsList.textContent = "Ningún asiento seleccionado"
    totalPrice.textContent = "Total: $0.00"
  } else {
    seatsList.textContent = `Asientos: ${selectedSeats.join(", ")}`
    totalPrice.textContent = `Total: $${(selectedSeats.length * currentPrice).toFixed(2)}`
  }
}

function createReservation() {
  const rutaId = Number.parseInt(document.getElementById("reserva-ruta").value)
  const horarioId = Number.parseInt(document.getElementById("reserva-horario").value)
  const nombre = document.getElementById("pasajero-nombre").value.trim()
  const telefono = document.getElementById("pasajero-telefono").value.trim()
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')

  if (!rutaId || !horarioId || !nombre || !telefono || selectedSeats.length === 0 || !paymentMethod) {
    showToast("⚠️ Por favor complete todos los campos requeridos", "warning")
    return
  }

  const reservas = combiSystem.getData("reservas")
  const horarios = combiSystem.getData("horarios")
  const reservaId = Math.max(...reservas.map((r) => r.id), 1000) + 1
  const total = selectedSeats.length * currentPrice

  // Update occupied seats
  const horario = horarios.find((h) => h.id === horarioId)
  if (horario) {
    horario.asientosOcupados.push(...selectedSeats)
    combiSystem.saveData("horarios", horarios)
  }

  // Create reservation
  const newReservation = {
    id: reservaId,
    pasajero: { nombre, telefono },
    horarioId,
    asientos: [...selectedSeats],
    total,
    estado: paymentMethod.value === "efectivo" ? "Pendiente" : "Pendiente",
    metodoPago: paymentMethod.value,
    fechaCreacion: new Date().toISOString(),
    fechaVencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  reservas.push(newReservation)
  combiSystem.saveData("reservas", reservas)

  // Show success notification
  const statusText = paymentMethod.value === "efectivo" ? "Pendiente de Pago (24h)" : "Pendiente de Pago Online"
  showToast(`🎫 Reserva #${reservaId} creada - ${statusText}`, "success", 6000)

  // Show reservation details
  setTimeout(() => {
    showToast(`👤 ${nombre} | 🪑 Asientos: ${selectedSeats.join(", ")} | 💰 $${total.toFixed(2)}`, "info", 8000)
  }, 1000)

  // Simulate WhatsApp notification
  setTimeout(() => {
    showWhatsAppNotification(telefono, nombre, reservaId, selectedSeats, total, paymentMethod.value)
  }, 2000)

  hideReservaForm()
  combiSystem.loadReservasList()
  combiSystem.loadDashboardData()
}

function filterReservas(filter) {
  combiSystem.loadReservasList(filter)
}

function printTicket(reservaId) {
  showToast(`🖨️ Imprimiendo boleto para reserva #${reservaId}`, "info")
}

function sendWhatsApp(reservaId) {
  showToast(`📱 Enviando mensaje WhatsApp para reserva #${reservaId}`, "info")
}

function confirmPayment(reservaId) {
  combiSystem.confirmPayment(reservaId)
}

function cancelReservation(reservaId) {
  combiSystem.cancelReservation(reservaId)
}

// Custom Toast Notification System
function showToast(message, type = "success", duration = 4000) {
  const toastContainer = document.getElementById("toast-container")
  const toastId = "toast-" + Date.now()

  const toastTypes = {
    success: {
      bgColor: "bg-green-100 dark:bg-green-800",
      textColor: "text-green-500 dark:text-green-200",
      borderColor: "border-green-500",
      icon: "fas fa-check-circle",
    },
    error: {
      bgColor: "bg-red-100 dark:bg-red-800",
      textColor: "text-red-500 dark:text-red-200",
      borderColor: "border-red-500",
      icon: "fas fa-exclamation-circle",
    },
    warning: {
      bgColor: "bg-yellow-100 dark:bg-yellow-800",
      textColor: "text-yellow-500 dark:text-yellow-200",
      borderColor: "border-yellow-500",
      icon: "fas fa-exclamation-triangle",
    },
    info: {
      bgColor: "bg-blue-100 dark:bg-blue-800",
      textColor: "text-blue-500 dark:text-blue-200",
      borderColor: "border-blue-500",
      icon: "fas fa-info-circle",
    },
  }

  const toast = toastTypes[type] || toastTypes.info

  const toastHTML = `
        <div id="${toastId}" class="flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 ${toast.bgColor} rounded-lg shadow dark:text-gray-400 dark:bg-gray-800 border-l-4 ${toast.borderColor} transform transition-all duration-300 ease-in-out translate-x-full opacity-0" role="alert">
            <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${toast.textColor} rounded-lg">
                <i class="${toast.icon}"></i>
            </div>
            <div class="ml-3 text-sm font-normal text-gray-900 dark:text-white">${message}</div>
            <button type="button" class="ml-auto -mx-1.5 -my-1.5 ${toast.bgColor} text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" onclick="closeToast('${toastId}')" aria-label="Close">
                <span class="sr-only">Close</span>
                <i class="fas fa-times text-sm"></i>
            </button>
        </div>
    `

  toastContainer.insertAdjacentHTML("beforeend", toastHTML)

  // Animate in
  setTimeout(() => {
    const toastElement = document.getElementById(toastId)
    if (toastElement) {
      toastElement.classList.remove("translate-x-full", "opacity-0")
      toastElement.classList.add("translate-x-0", "opacity-100")
    }
  }, 100)

  // Auto remove
  setTimeout(() => {
    closeToast(toastId)
  }, duration)
}

function closeToast(toastId) {
  const toastElement = document.getElementById(toastId)
  if (toastElement) {
    toastElement.classList.add("translate-x-full", "opacity-0")
    setTimeout(() => {
      toastElement.remove()
    }, 300)
  }
}

// WhatsApp notification system
function showWhatsAppNotification(telefono, nombre, reservaId, asientos, total, paymentMethod) {
  const whatsappMessage = `¡Hola ${nombre}! Tu reserva #${reservaId} ha sido creada. Asientos: ${asientos.join(", ")}. Total: $${total.toFixed(2)}. ${paymentMethod === "efectivo" ? "Tienes 24 horas para completar el pago." : "Te enviaremos el link de pago."}`

  showToast(`📱 WhatsApp enviado a ${telefono}`, "info", 5000)

  // Simulate actual WhatsApp API call
  setTimeout(() => {
    console.log("WhatsApp message sent:", whatsappMessage)
  }, 1000)
}

// Initialize system when page loads
document.addEventListener("DOMContentLoaded", () => {
  combiSystem.init()
  showSection("dashboard")
})