const express = require('express')
const app = express()
const port = 3000
const http = require("http");
const https = require('https');
const axios = require('axios');
const csv = require('csv');
const parse = require('csv-parse/lib/sync')
var fs = require('fs');

var siteIndex = "Default";

fs.readFile('cms-sites-live.csv', 'utf8', function(err, data) {
    if (err) throw err;
    console.log(data);
    siteIndex = parse(data, {
        columns: true,
        skip_empty_lines: true
    });
});

app.use(express.static('static',));

app.get('/sites', (req, res) => {
  res.send(JSON.stringify(siteIndex));

})

function evalHTML(body) {
    var passSiteId = false;
    var passDataLayer = false;
    var passNoScript = false;
    var passRemoveUTM = false;

    if(body.indexOf('id="siteId"/>')>0)
    {
        passSiteId = true;
    }

    if(body.indexOf("cms': 'cascade'")>0)
    {
        passDataLayer = true;
    }

    if(body.indexOf('<noscript><iframe height="0" src="https://www.googletagmanager.com/ns.html?id=GTM-5Q36JQ"')>0)
    {
        passNoScript = true;
    }

    if(body.indexOf('__utm.js') <= 0)
    {
        passRemoveUTM = true;
    }
    console.log("out!"+ JSON.stringify({'passSiteId':passSiteId, 'passNoScript': passNoScript, 'passDataLayer': passDataLayer, 'passRemoveUTM': passRemoveUTM}));
    return({'passSiteId':passSiteId, 'passNoScript': passNoScript, 'passDataLayer': passDataLayer, 'passRemoveUTM': passRemoveUTM});

}


function evalUrl(url) {

    https.get(url, (resp) => {
        let data = '';
        // a data chunk has been received.
        resp.on('data', (chunk) => {
          data += chunk;
        });

        // complete response has been received.
        resp.on('end', () => {

            var body = data;

        });

      }).on("error", (err) => {
        console.log("Error: " + err.message);
      });

}

app.get('/eval', (req,res)=>{

  siteIndex.forEach(element => {
      console.log(element.name);
      console.log(evalUrl(element.url));
  });

});

app.get('/eval/:code', (req,res)=>{

    var match  = siteIndex.find(item => item.cms.replace('.','') == req.params.code );
    if(match) {
            //res.send("MATCH" + match.name + match.cms);
            axios.get(match.url)
                .then(response => {
                   // console.log(match.url);
                    console.log(match.url + " " + evalHTML(response.data));
                    res.send(JSON.stringify(evalHTML(response.data)));
                });
    } else {
        res.send("No Match");
    }

});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})