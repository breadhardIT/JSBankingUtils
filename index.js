/* ==================================================================================================
   = PROGRAM : AEBC19-GENERATOR
   = VERSION : 1.0.0-SNAPSHOT
   = AUTHOR  : JAVIER RAMOS - BREADHARD IT CONSULTING
   =           MADE WITH LOVE BY AN ANCIENT COBOL DEVELOPER
   = DATE    : 2021-03-15
   = FUNCTION: GENERATE AN AEB CUADERNO 19 SEPA TRANSFERS FILE
   = USAGE:
   =  NEED 3 INPUT FILES:
   =    * PRESENTADOR  -> PRESENTATOR DATA IN JSON FORMAT
   =    * PRESENTACION -> PRESENTATION DATA IN JSON FORMAT
   =   * ORDENES      -> LIST OF PAYMENT ORDERS IN CSV FORMAT
   = NEED 2 TEMPLATES:
   =       * PLANTILLAPRESENTACION -> CSB19 SEPA TEMPLATE FOR ENTIRE FILE
   =                                  WITHOUT PAYMENT ORDERS BLOCK
   =       * PLANTILLAORDEN        -> CSB19 SEPA TEMPLATE FOR ONLY ORDER BLOCK
   =     OUTPUT FILE:
   =       * FICHEROSALIDA         -> CONTAINS AN ENTIRE CSB19 SEPA TRANSFERS FILE
   = HOW TO RUN?
   =   REQUIRED NODE JS -> node index.js 
   =   NO PARAMS REQUIRED
   =   ALL DEPENDENCIES MANAGED IN package.json
   ==================================================================================================== */
// ====================================================================================================
// Requires e imports
const fs = require('fs');
// Files -> Contiene las rutas relativas de los ficheros a utilizar
class Files { 
  constructor() {
    this.urlPresentador = './files/presentador.json';
    this.urlOrdenes = './files/ordenes.csv';
    this.urlPresentacion = './files/presentacion.json';
    this.urlPlantillaPresentacion = './files/AEB19_PlantillaPresentacion.xml';
    this.urlPlantillaOrden = './files/AEB19_PlantillaOrden.xml';
    this.urlFicheroSalida = './files/PresentacionFinal.xml';
  }
}
// Mainline - (is like PROCEDURE-DIVISION ;) )
const dateTime = new Date();
const files = new Files();
console.log('Mainline - inicio del proceso a las ',dateTime);
// Lee los datos de la presentacion, y pasa a la siguiente subrutina
fs.readFile(files.urlPresentacion, 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err);
        return;
    }
    var presentacion = JSON.parse(jsonString);
    leerPresentador(files,presentacion);
});
// Lee los datos del presentador y pasa a la siguiente subrutina
function leerPresentador(files,presentacion) {
  fs.readFile(files.urlPresentador, 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err);
        return;
    }
    presentacion.presentador = JSON.parse(jsonString);
    leerOrdenes(files,presentacion);
  });
}
// Lee las ordenes a presentar y pasa a la siguiente subrutina
function leerOrdenes(files,presentacion) {
  fs.readFile(files.urlOrdenes, 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err);
        return;
    }
    elaborarPresentacion(files,presentacion,jsonString);
  });
}
// Construye el JSON asociado al documento completo de presentacion y pasa a construir la cadena XML
function elaborarPresentacion(files,presentacion,ordenes) {
  presentacion.ordenes = mapearOrdenes(ordenes);
  presentacion.importeTotal = 0;
  presentacion.numeroOrdenes = 0;
  // Calculo de campos acumulados
  for (const i in presentacion.ordenes) {
    presentacion.importeTotal += (presentacion.ordenes[i].importe * 1);
    presentacion.numeroOrdenes += 1;
  }
  fs.readFile(files.urlPlantillaPresentacion, 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err);
        return;
    }
    plantillaPresentacion(files,presentacion,jsonString);
  }); 
}
// Elabora el XML a partir de la plantilla, la parte de ordenes se realiza en bucle
// en siguiente funcion
function plantillaPresentacion(files,presentacion,plantillaPresentacionText) {
  console.log('Data to parse ->');
  console.log(presentacion);
  console.log('@END@');
  var text = plantillaPresentacionText.replace(/XXpresentacion.fechaCreacionXX/g,presentacion.fechaCreacion)
    .replace(/XXpresentacion.stampCreacionXX/g,presentacion.stampCreacion)
    .replace(/XXpresentacion.idXX/g,presentacion.id)
    .replace(/XXpresentacion.timestampXX/g,new Date())
    .replace(/XXpresentacion.numeroOrdenesXX/g,presentacion.numeroOrdenes)
    .replace(/XXpresentacion.importeTotalXX/g,presentacion.importeTotal)
    .replace(/XXpresentacion.presentador.nombreXX/g,presentacion.presentador.nombre)
    .replace(/XXpresentacion.presentador.idXX/g,presentacion.presentador.id)
    .replace(/XXpresentacion.presentador.nifXX/g,presentacion.presentador.nif)
    .replace(/XXpresentacion.fechaXX/g,presentacion.fecha)
    .replace(/XXpresentacion.tipoOrdenesXX/g,presentacion.tipoOrdenes)
    .replace(/XXpresentacion.presentador.codigoPaisXX/g,'ES')
    .replace(/XXpresentacion.presentador.direccionCompletaXX/g,presentacion.presentador.direccionCompleta)
    .replace(/XXpresentacion.presentador.codigoPostalXX/g,presentacion.presentador.codigoPostal)
    .replace(/XXpresentacion.presentador.localidadXX/g,presentacion.presentador.localidad)
    .replace(/XXpresentacion.ibanDeCobroXX/g,presentacion.ibanDeCobro)
  ;
  fs.readFile(files.urlPlantillaOrden, 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err);
        return;
    }
    plantillaConOrdenes(files,presentacion,text,jsonString);
  }); 
}
// Genera el bloque de ordenes de pago, y lo incorpora en el XML completo, también lo entrega al FS
function plantillaConOrdenes(files,presentacion,textoPresentacion,plantillaOrden) {
  var text = ''
  for (const i in presentacion.ordenes) {
    text += plantillaOrden
      .replace(/XXpresentacion.conceptoXX/g,presentacion.concepto)
      .replace(/XXpresentacion.importeXX/g,presentacion.ordenes[i].importe)
      .replace(/XXpresentacion.ordenes.idXX/g,presentacion.ordenes[i].id)
      .replace(/XXpresentacion.fechaFirmaXX/g,presentacion.fechaFirma)
      .replace(/XXpresentacion.ordenes.nombreCompletoXX/g,presentacion.ordenes[i].nombreCompleto)
      .replace(/XXpresentacion.ordenes.direccionXX/g,presentacion.ordenes[i].direccion)
      .replace(/XXpresentacion.ordenes.codigoPostalXX/g,presentacion.ordenes[i].codigoPostal)
      .replace(/XXpresentacion.ordenes.localidadXX/g,presentacion.ordenes[i].localidad)
      .replace(/XXpresentacion.ordenes.nifXX/g,presentacion.ordenes[i].nif)
      .replace(/XXpresentacion.ordenes.ibanXX/g,presentacion.ordenes[i].iban)
      .replace(/XXpresentacion.descripcionXX/g,presentacion.descripcion)
  }
  var finalText = textoPresentacion.replace(/XXordenesFormateadasXX/g,text);
  console.log('Fichero generado! -> Data:');
  console.log(finalText);
  fs.writeFile(files.urlFicheroSalida,finalText,{flag:'wx'},function(err) {
    if (err) throw err;
    console.log(err);
  })
}
// Mapea las ordenes del fichero CSV al objeto JSON correspondiente (la primera linea incluye los headers del CSV)
function mapearOrdenes(data) {
  var lineas = data.split(/\r\n|\n/);
  var ordenes = [];
  for (const i in lineas) {
    var orden = new Orden();    
    var linea = lineas[i].split(',');
    orden.id=linea[0].replace(/"/g,'');
    orden.nif=linea[1].replace(/"/g,'');
    orden.nombreCompleto=linea[2].replace(/"/g,'');
    orden.fecha=linea[3].replace(/"/g,'');
    orden.importe=linea[4].replace(/"/g,'');
    orden.iban=linea[5].replace(/"/g,'');
    orden.direccion=linea[6].replace(/"/g,'');
    orden.codigoPostal=linea[7].replace(/"/g,'');
    orden.localidad=linea[8].replace(/"/g,'');
    orden.id=orden.nombreCompleto.substr(0,3).toUpperCase()+orden.nif;
    ordenes.push(orden);
  }
  // Aquí es donde se elimina la linea 0 (headers del CSV)
  ordenes.splice(0,1);
  return ordenes;
}
// Entidades de datos (LIKE COPY)
class Presentador {
  constructor() {
    this.id = '';
    this.nombre = '';
    this.nif = '';
    this.pais = '';
    this.direccion = '';
    this.codigoPostal = '';
    this.localidad = '';
    this.codigoPais = 'ES';
  }
}
class Orden {
  constructor() {
    this.id='';
    this.nif='';
    this.nombreCompleto='';
    this.fecha='';
    this.importe=0;
    this.iban='';
  }
}
class Presentacion {
  constructor() {
    this.id='';
    this.fechaCreacion='';
    this.stampCreacion='';
    this.timestamp='';
    this.numeroOrdenes=0;
    this.importeTotal=0;
    this.presentador = new Presentador();
    this.ibanDeCobro = '';
    this.concepto = '';
    this.descripcion = '';
    this.tipoOrdenes = '';
    this.ordenes = [];
    this.fechaFirma = '';
  }
}
//
// 
// 