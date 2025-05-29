# SolicitudService - Microservicio REST para gestión de solicitudes de certificación
## Descripción
Este proyecto implementa un microservicio REST llamado SolicitudService que expone dos endpoints principales para gestionar solicitudes de certificación estudiantil:
* POST /solicitudes: Recibe datos para registrar una solicitud de certificado.
* GET /solicitudes/{id}: Recupera información de una solicitud específica por su ID.
El servicio realiza validación de tokens JWT, integra un sistema SOAP externo (mockeado) para el registro real de la certificación, y retorna el estado final de la solicitud (procesado, en revisión, rechazado).
Se integra con Istio Service Mesh para aplicar políticas de Circuit Breaking y Retry automático en la comunicación con el servicio SOAP.
## Características principales
* Validación JWT en cabecera Authorization: Bearer <token>
* Integración con sistema SOAP externo mock para registrar certificación
* Almacenamiento temporal en memoria de solicitudes con estado y fecha
* Circuit Breaking y Retry configurados a nivel de Istio para resiliencia
* Política de rate limiting y seguridad JWT configurables en API Gateway

## Requisitos previos
* Node.js y npm instalados
* Docker (para correr el mock SOAP si se desea)
* Istio instalado y configurado en el cluster Kubernetes (para Circuit Breaking y Retry)
* Variables de entorno definidas en .env o exportadas en entorno:
```
PORT=4000
JWT_SECRET=miclave_supersecreta_muy_segura_1234567890
SOAP_URL=http://localhost:5000/wsdl?wsdl
```

## Instalación y ejecución
1. Clonar el repositorio:
```
git clone <url-del-repositorio>
cd <nombre-del-repositorio>
```
2. Instalar dependencias:
```
npm install
```
3. Ejecutar el mock SOAP server (puerto 5000):
```
node mock-soap.js
```
7. Ejecutar el microservicio REST (SolicitudService):
```
node index.js
```

## Endpoints
### POST /solicitudes
* Headers: Authorization: Bearer <JWT>
* Body (JSON):
```
{
  "estudianteId": "string",
  "tipoCertificado": "string"
}
```
* Respuesta exitosa (201):
```
{
  "id": "string",           // ID generado de la solicitud
  "estado": "procesado"     // Estado retornado por el sistema SOAP
}
```
### GET /solicitudes/{id}
* Headers: Authorization: Bearer <JWT>
* Parámetro: id (string) — ID de la solicitud
* Respuesta exitosa (200):
```
{
  "id": "string",
  "estudianteId": "string",
  "tipoCertificado": "string",
  "estado": "string",
  "fecha": "ISO8601 datetime string"
}
```

## Arquitectura de resiliencia con Istio
Se ha configurado un DestinationRule para el servicio SOAP con:
* Circuit Breaker que deshabilita el host tras 3 errores HTTP 5xx consecutivos dentro de 60 segundos.
* Retry automático con máximo 2 intentos y timeout de 2 segundos por intento.
Ejemplo de configuración (DestinationRule + VirtualService):
```
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: soap-service-destination
spec:
  host: soap-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 100
        maxRequestsPerConnection: 100
    outlierDetection:
      consecutive5xxErrors: 3
      interval: 60s
      baseEjectionTime: 30s
      maxEjectionPercent: 100

---

apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: soap-service-vs
spec:
  hosts:
    - soap-service
  http:
    - route:
        - destination:
            host: soap-service
            port:
              number: 80
      retries:
        attempts: 2
        perTryTimeout: 2s
        retryOn: gateway-error,connect-failure,refused-stream
```
## Seguridad y autenticación
* JWT verificado usando la clave secreta (JWT_SECRET) configurada.
* Se espera que el token JWT se envíe en la cabecera Authorization con formato Bearer <token>.
* El microservicio valida el token antes de procesar cualquier solicitud.
