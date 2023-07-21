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



export default parsePolygonGeometry;

// const geom = "0101000020E6100000E30EB9059D3963C04B106EF3FDCA4F40";
// const a = parsePolygonGeometry(geom)
// console.log(a)