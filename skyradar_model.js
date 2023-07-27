const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const satellite = require('satellite.js');
const multer = require("multer");
const app = express();
app.use(cors());

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

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Radar_sat',
  password: 'skyradar1234',
  port: 5432,
});

app.use(cors());
app.use(express.json());


app.get('/api/data', async (req, res) => {
  try {
    var geojson = {
      features: [],
      type: "FeatureCollection"
    };
    const table_name = req.query.table_name;
    const name_sat = req.query.name_sat;
    const mode = req.query.mode;
    const time_start = req.query.time_start;
    const time_end  = req.query.time_end;
    let query = `SELECT * FROM ${table_name}`;
   console.log(time_start)
    if(name_sat)
    {
      query += ` WHERE name_sat in ( `;//'${name_sat}'
      name_sat.split(',').forEach(element => {
        query += `'${element}',`;
      }); 
      query = query.slice(0,-1);
      query += `)`; 
    }
     if (mode) {
      query += ` AND mode in (`;
      mode.split(',').forEach(element => {
        query += `'${element}',`;
      }); 
      query = query.slice(0,-1);
      query += `)`; 
    }

    if (time_start)
    {
    query +=`AND start_time >= '${time_start}'`;
    }
    if (time_end)
    {
    query +=`AND start_time <= '${time_end}'`;
    }
   console.log(query)
//WHERE timestamp_column > NOW() - INTERVAL '1 day';
    const result = await pool.query(query);
    result.rows.forEach((data1) => {
      const geometry = data1.geom;
      const polygon_data = parsePolygonGeometry(geometry);
      const dulieu = {
                geometry: {
                  type: "Polygon",
                  coordinates: [polygon_data]
                },
                properties: {
                  id: data1.id,
                  satellite_name: data1.name_sat,
                  mode: data1.mode,
                  start_datetime: data1.start_time,
                  end_datetime: data1.end_time,
                  imaging_time: `${data1.imaging_time.seconds}.${data1.imaging_time.milliseconds} seconds`,
                  resolution: `${data1.resolution}m`
                }  
      };
      geojson.features.push(dulieu)
    })
    res.json(geojson);
  } catch (error) {
    console.error('Error retrieving data from the database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
var path_TLE = 'D:\\SKY\\Module_get_tle\\File_idnorard\\tle01052023.txt'
app.get('/api/satellite',async (req, res) => {
  try {
    const a =tle_czml(path_TLE);
    res.json(a);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
//...........................................
var upload = multer({ dest: "D:/SKY/Module_get_tle/File_idnorard"});
//var upload = multer({ dest: "../public/uploads/" });
  //app.post("/api/tle", upload.single("file"), async (req, res) => {
  app.post("/api/tle", upload.single("file"), async (req, res) => {
  try {    
    if (req.file) {
      res.send({
        status: true,
        message: "File Uploaded!"
      });
      path_TLE = `D:\\SKY\\Module_get_tle\\File_idnorard\\${req.file.filename}`
      console.log(path_TLE)
    } else {
      res.status(400).send({
        status: false,
        data: "File Not Found :(",
      });
    }
  } catch (err) {
    res.status(500).send(err);
  }
});
//............................................
function tle_czml(filePath) {
  const positions = [];
  const startTime = new Date();
  const timeDelta =  24*60*60*1000; // Time increment in milliseconds
  const endTime = new Date(startTime.getTime() +  timeDelta);
  
  const numPoints = 300; 
  const timeIncrement = timeDelta/numPoints
  
  const combinedData = [];
  var czmlDoc = {
    id: "document",
    name: "con cac",
    version: "1.0",
    clock: {
        interval: startTime.toISOString() + "/" + endTime.toISOString(),
        currentTime: startTime,
        multiplier: 60,
        range: "LOOP_STOP",
        step: "SYSTEM_CLOCK_MULTIPLIER"
    }
  };
  
  // const jsonData = JSON.parse(data);
  combinedData.push(czmlDoc);
  // Đọc nội dung tệp tin
    data = fs.readFileSync(filePath, 'utf8');
    const data_tle = data.trim().split('\r\n');
    for(let j =0; j< data_tle.length; j+=3)
    {
      const name = data_tle[j+0].trim();
      const line1 = data_tle[j+1].trim();
      const line2 = data_tle[j+2].trim();

      const satelliteRec = satellite.twoline2satrec(line1, line2);
 
      var satellitePacket = {
        id: name,
        name: name,
        availability: startTime.toISOString() + "/" + endTime.toISOString(),
        billboard: {
          eyeOffset: {
            cartesian: [
              0,
              0,
              0
            ]
          },
          horizontalOrigin: "CENTER",
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADJSURBVDhPnZHRDcMgEEMZjVEYpaNklIzSEfLfD4qNnXAJSFWfhO7w2Zc0Tf9QG2rXrEzSUeZLOGm47WoH95x3Hl3jEgilvDgsOQUTqsNl68ezEwn1vae6lceSEEYvvWNT/Rxc4CXQNGadho1NXoJ+9iaqc2xi2xbt23PJCDIB6TQjOC6Bho/sDy3fBQT8PrVhibU7yBFcEPaRxOoeTwbwByCOYf9VGp1BYI1BA+EeHhmfzKbBoJEQwn1yzUZtyspIQUha85MpkNIXB7GizqDEECsAAAAASUVORK5CYII=",
          pixelOffset: {
            cartesian2: [
              0,
              0
            ]
          }
        }, 
        scale: 1,
        show: true,
        verticalOrigin: "CENTER",
        label: {
          fillColor: {
            rgba: [
              255,
              0,
              255,
              255
            ]
          },
          font: "9pt Lucida Console",
          horizontalOrigin: "LEFT",
          outlineColor: {
            rgba: [
              0,
              0,
              0,
              255
            ]
          },
          outlineWidth: 2,
          pixelOffset: {
            cartesian2: [
              12,
              0
            ]
          },
          show: true,
          style: "FILL_AND_OUTLINE",
          text: name,
          verticalOrigin: "CENTER"
        },
        position: {
          interpolationAlgorithm: "LAGRANGE",
          interpolationDegree: 5,
          referenceFrame: "INERTIAL",
          epoch: startTime,
          cartesian: []
        }
      }; 
      
      for (let i = 0; i < numPoints; i++) {
        _time = timeIncrement*i;
        var positionAndVelocity = satellite.propagate(satelliteRec, new Date(startTime.getTime() + _time));
        //   const gmst = satellite.gstime(time);
        satellitePacket.position.cartesian.push(
          _time/1000.0,
          positionAndVelocity.position.x * 1000,
          positionAndVelocity.position.y * 1000,
          positionAndVelocity.position.z * 1000
    
        );
      }
      combinedData.push(satellitePacket);
    }
    return combinedData;
}