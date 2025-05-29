const soap = require("soap");
const http = require("http");

const service = {
  CertificacionService: {
    CertificacionPort: {
      RegistrarCertificacion(args) {
        console.log("SOAP recibido:", args);

        const estados = ["procesado", "en revisión", "rechazado"];
        const estadoRandom =
          estados[Math.floor(Math.random() * estados.length)];

        return {
          estado: estadoRandom,
        };
      },
    },
  },
};

const xml = `
<definitions name="CertificacionService"
  targetNamespace="http://www.example.org/certificacion/"
  xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:tns="http://www.example.org/certificacion/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  
  <types>
    <xsd:schema targetNamespace="http://www.example.org/certificacion/">
      <xsd:element name="RegistrarCertificacion">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="estudianteId" type="xsd:string" />
            <xsd:element name="tipoCertificado" type="xsd:string" />
            <xsd:element name="fechaSolicitud" type="xsd:string" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="RegistrarCertificacionResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="estado" type="xsd:string" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </types>

  <message name="RegistrarCertificacionRequest">
    <part name="parameters" element="tns:RegistrarCertificacion" />
  </message>
  <message name="RegistrarCertificacionResponse">
    <part name="parameters" element="tns:RegistrarCertificacionResponse" />
  </message>

  <portType name="CertificacionPortType">
    <operation name="RegistrarCertificacion">
      <input message="tns:RegistrarCertificacionRequest" />
      <output message="tns:RegistrarCertificacionResponse" />
    </operation>
  </portType>

  <binding name="CertificacionBinding" type="tns:CertificacionPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http" />
    <operation name="RegistrarCertificacion">
      <soap:operation soapAction="http://www.example.org/certificacion/RegistrarCertificacion" />
      <input>
        <soap:body use="literal" />
      </input>
      <output>
        <soap:body use="literal" />
      </output>
    </operation>
  </binding>

  <service name="CertificacionService">
    <documentation>Servicio SOAP mock para certificación</documentation>
    <port name="CertificacionPort" binding="tns:CertificacionBinding">
      <soap:address location="http://localhost:5000/wsdl" />
    </port>
  </service>
</definitions>
`;

const server = http.createServer(function (request, response) {
  response.end("OK");
});

server.listen(5000, function () {
  console.log("Mock SOAP server escuchando en puerto 5000");
});

soap.listen(server, "/wsdl", service, xml);
