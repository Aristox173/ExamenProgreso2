require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const soap = require("soap");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET =
  process.env.JWT_SECRET || "miclave_supersecreta_muy_segura_1234567890";
const SOAP_URL = process.env.SOAP_URL || "http://localhost:5000/wsdl?wsdl";

const solicitudesDB = {};

function validarJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Token requerido" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token malformado" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

app.post("/solicitudes", validarJWT, async (req, res) => {
  const { estudianteId, tipoCertificado } = req.body;

  if (!estudianteId || !tipoCertificado) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const client = await soap.createClientAsync(SOAP_URL);
    const [result] = await client.RegistrarCertificacionAsync({
      estudianteId,
      tipoCertificado,
      fechaSolicitud: new Date().toISOString(),
    });

    const estado = result.estado || "procesado";

    const idSolicitud = Date.now().toString();
    solicitudesDB[idSolicitud] = {
      id: idSolicitud,
      estudianteId,
      tipoCertificado,
      estado,
      fecha: new Date().toISOString(),
    };

    res.status(201).json({ id: idSolicitud, estado });
  } catch (error) {
    console.error("Error SOAP:", error);
    res.status(500).json({ error: "Error al llamar al sistema SOAP externo" });
  }
});

app.get("/solicitudes/:id", validarJWT, (req, res) => {
  const id = req.params.id;
  const solicitud = solicitudesDB[id];
  if (!solicitud)
    return res.status(404).json({ error: "Solicitud no encontrada" });

  res.json(solicitud);
});

app.listen(PORT, () => {
  console.log(`SolicitudService escuchando en puerto ${PORT}`);
});
