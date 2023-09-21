const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing post data that has json format//

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT, DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); next();
});

const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'lab4',
    password: 'postgres',
    port: '5432'/* the port has to be a number*/
});

app.get('/', (req, res) => {
    pool.query("your_query_goes_here", (err, dbResponse) => {
        if (err) console.log(err); //console.log(dbResponse.rows); 
        // here dbResponse is available, your data processing logic goes here
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send('whatever data you need to send back to your application');
    }
    );
});


// app.post('/', (req, res) => {
//     console.log(req.body); // data you send from your application is available on req.body object, your data processing logic goes here
//     pool.query("your_query_goes_here", (err, dbResponse) => {
//         if (err) console.log(err);
//         res.send("whatever data you need to send back to your application");
//     });
// });


app.get('/lab4', (req, res) => res.sendFile(__dirname + '/lab4.html'))
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// The next step is to get the markers data from the database to your web-browser.
app.get('/api/get_markers', (req, res) => {
    pool.query("select * from tbl_markers;", (err, dbResponse) => {
        if (err) console.log(err); //console.log(dbResponse.rows); // here dbResponse is available, your data processing logic goes here
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(dbResponse.rows);
    }
    );
});

// For ease of utilizing the data in leaflet, we would like to send data from the server in geojson
// format. Add a new app.get function with the route api/get_markers_geojson and use the
// following query to send the markers data in geojson format:
app.get('/api/get_markers_geojson', async (req, res) => {
    try {
        const query = `
            SELECT row_to_json(fc) FROM (
            SELECT 'FeatureCollection' AS type,
                array_to_json(array_agg(f)) AS features
            FROM (
                SELECT 'Feature' AS type,
                ST_AsGeoJSON(lg.geom)::json AS geometry,
                row_to_json((SELECT l FROM (SELECT id, name) AS l)) AS properties
                FROM tbl_markers AS lg
            ) AS f
            ) AS fc;
        `;
        const result = await pool.query(query);
        const geojson = result.rows[0].row_to_json;
        res.json(geojson);
    } catch (error) {
        console.error('Error fetching markers data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////////
app.post('/save_marker/', async (req, res) => {
    try {
        console.log('Data recieved:' + JSON.stringify(req.body));
        var q = "insert into tbl_markers(name,geom) values (" + "'" +
            req.body.name + "',ST_GeomFromText('POINT(" + req.body.lon +
            " " + req.body.lat + ")',4326));";
        pool.query(q, (err, dbResponse) => {
            if (err) console.log(err);
            res.send(dbResponse.rows);
        }
        );
    } catch (error) {
        console.error('Error saving markers data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// We are sending our clicked location to /api/get_closest_marker service with query parameter lat and lon, 
// we need to implement its functionality on the server side. 
// At the server side these parameters are available in rew.query object.
app.get('/api/get_closest_marker', (req, res) => {
    console.log('Request received on the server to send closest marker');
    var lat = req.query.lat;
    var lon = req.query.lon;
    var q = 'with tbl_line_to_closest_point as\n' +
        '(\n' +
        '\twith query_point as\n' +
        '\t(\n' +
        '\t\tselect (ST_GeomFromText(\'POINT(' + lon + ' ' + lat + ')\',4326)) as geom\n' +
        '\t)\n' +
        '\tselect \tid,name,\n' +
        '\t\tst_distance(st_transform(m.geom,32633),st_transform((qp.geom),32633)) as distance,\n' +
        '\t\tST_MakeLine(m.geom,qp.geom) as line_geom\n' +
        '\tfrom \n' +
        '\ttbl_markers m ,query_point qp\n' +
        '\torder by st_distance(st_transform(m.geom,32633),st_transform(qp.geom,32633)) limit 1\n' +
        ') select row_to_json(fc)FROM ( \n' +
        '\tSELECT \'FeatureCollection\' As type, array_to_json(array_agg(f)) As features FROM (\n' +
        '\t\tSELECT \'Feature\' As type\n' +
        '                    , ST_AsGeoJSON(lg.line_geom)::json As geometry\n' +
        '                    , row_to_json((SELECT l FROM (SELECT id,name,distance) As l)) As properties\n' +
        '                   FROM tbl_line_to_closest_point As lg   ) As f )  As fc;\n';
    console.log(q);

    pool.query(q, (err, dbResponse) => {
        if (err) console.log(err);
        res.send(dbResponse.rows);
    }
    );
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Extent your code to draw a buffer on the closest marker from the clicked location.
app.get('/api/get_closest_marker_buffer', (req, res) => {
    console.log('Request received on the server to send the buffer of closest marker');
    var lat = req.query.lat;
    var lon = req.query.lon;
    var q = 'with tbl_line_to_closest_point as\n' +
        '(\n' +
        '\twith query_point as\n' +
        '\t(\n' +
        '\t\tselect (ST_GeomFromText(\'POINT(' + lon + ' ' + lat + ')\',4326)) as geom\n' +
        '\t)\n' +
        '\tselect \tid,name,\n' +
        '\t\tst_distance(st_transform(m.geom,32633),st_transform((qp.geom),32633)) as distance,\n' +
        '\t\tST_buffer (m.geom ,0.005) as buffer_geom\n' +
        '\tfrom \n' +
        '\ttbl_markers m ,query_point qp\n' +
        '\torder by st_distance(st_transform(m.geom,32633),st_transform(qp.geom,32633)) limit 1\n' +
        ') select row_to_json(fc)FROM ( \n' +
        '\tSELECT \'FeatureCollection\' As type, array_to_json(array_agg(f)) As features FROM (\n' +
        '\t\tSELECT \'Feature\' As type\n' +
        '                    , ST_AsGeoJSON(lg.buffer_geom)::json As geometry\n' +
        '                    , row_to_json((SELECT l FROM (SELECT id,name,distance) As l)) As properties\n' +
        '                   FROM tbl_line_to_closest_point As lg   ) As f )  As fc;\n';
    console.log(q);

    pool.query(q, (err, dbResponse) => {
        if (err) console.log(err);
        res.send(dbResponse.rows);
    }
    );
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));

