function parsePolygonGeometry(geometry) {
  
  const geometryData = geometry.slice(16);

 
  const byteArray = new Uint8Array(geometryData.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  
  const numRings = byteArray[1];

  const numPoints = byteArray[5];
  const coordinates = [];
  for (let i = 0; i < numPoints; i++) {
    const offset = 9 + (16 * i);
    const longitude = new DataView(byteArray.buffer, offset, 8).getFloat64(0, true);
    const latitude = new DataView(byteArray.buffer, offset + 8, 8).getFloat64(0, true);
    coordinates.push([longitude, latitude]);
  }

  return coordinates;
}


const geom = "0103000020E61000000100000005000000DFCEC15D338163C0E81F71FB81C94F402C25DFE2557B63C028C8C387CEC44F4038F0CFFDE97D63C054FB75DE4CBB4F40178A915FC48363C05AD8DBFAFCBF4F40DFCEC15D338163C0E81F71FB81C94F40";
const a = parsePolygonGeometry(geom)
console.log(a)