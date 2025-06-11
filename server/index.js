import express from "express"
import morgan from "morgan"
import path from "path"
import { fileURLToPath } from "url"

// Para obtener __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, "../public")))

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// API Routes para futuras integraciones con base de datos
app.get("/api/combis", (req, res) => {
  res.json({ message: "API endpoint for combis - ready for database integration" })
})

app.get("/api/choferes", (req, res) => {
  res.json({ message: "API endpoint for choferes - ready for database integration" })
})

app.get("/api/rutas", (req, res) => {
  res.json({ message: "API endpoint for rutas - ready for database integration" })
})

app.get("/api/reservas", (req, res) => {
  res.json({ message: "API endpoint for reservas - ready for database integration" })
})

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../public", "404.html"))
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚌 Servidor del Sistema de Combis ejecutándose en http://localhost:${PORT}`)
  console.log(`📁 Sirviendo archivos estáticos desde: ${path.join(__dirname, "public")}`)
})