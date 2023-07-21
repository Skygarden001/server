SELECT ST_AsGeoJSON(skymed) AS geojson
FROM skymed
WHERE name_sat = 'SKYMED 1';