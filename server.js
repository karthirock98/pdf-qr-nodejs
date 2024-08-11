import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';
import https from 'https';
import multer from 'multer';
import path from 'path';
import { PDF_QR_JS } from 'pdf-qr';
dotenv.config();

const app = express();

let data1 = JSON.stringify({
  "id": "wMYBq9fe6W11NVRmjT1MXQ=="
});
const agent = new https.Agent({ rejectUnauthorized: false });


const config_settings = {
  "scale": {
    "once": false,
    "value": 1,
    "start": 0.2,
    "step": 0.2,
    "stop": 2
  },
  "resultOpts": {
    "singleCodeInPage": true,
    "multiCodesInPage": false,
    "maxCodesInPage": 1
  },
  "improve": true,
  "jsQR": {
    "inversionAttempts": "dontInvert"
  }
}

const data_config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://dc.crsorgi.gov.in/crs/0.0.1//certificate/validate',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJ4NXQiOiJNRGc1WlRNeU5XTmpaREppWVRZMll6YzBPR1ZrWW1WaU5UTXhNR0UwWmpCak1qVmxPR05sWmciLCJraWQiOiJNemxpWmpGa1lURTFOelUzTmpneFkyRmhNVEpsT1dNMk9XSmhNRFJqTVRrM09EZGpOREJtT0dSak1XRXhaV1ZoTURaalpqZGlORFJtT0RnNFlXVTNNQV9SUzI1NiIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJhZG1pbiIsImF1dCI6IkFQUExJQ0FUSU9OIiwiYXVkIjoidExoWnB5ZnpMM20yeTJwTEpQeVBJN1hwNGVzYSIsIm5iZiI6MTcyMzM5MTI4MiwiYXpwIjoidExoWnB5ZnpMM20yeTJwTEpQeVBJN1hwNGVzYSIsInNjb3BlIjoiZGVmYXVsdCIsImlzcyI6Imh0dHBzOlwvXC9hcGkuY3Jzb3JnaS5nb3YuaW46NDQzXC9vYXV0aDJcL3Rva2VuIiwiZXhwIjoxNzU5MzkxMjgyLCJpYXQiOjE3MjMzOTEyODIsImp0aSI6IjRlYmE1M2JmLTc4YTktNDhlMS05NDFiLWFlZDM1MDVmNGE0MSJ9.JSB3rf_5eDZ9m4dH2FpADNnwzzlAmHEf7t80AbrWQgWnhbTm_bqDKmiO_1E69IfARsew46yVViyACY_dyGEyf2UWouhlVSqPok18cSvQw5_rJEt1StBB4HvpMl86brXQRBUmv5YGC8Y3X16TYuv7-a4dy3aVEQCOQplth_GhHP8MJgHI-aXJw0w1RrnTvV4O1DjV7fpI1ZE5bSlCOTFdsb5hyIkpxSdW__IvncjconGBoejeTte1cN8uSMMlZz868DpyPPNGW7-qqxgI8kxADtMVZ1t21ZZdligOJP2fFCKIk9-5B6kcIll-pXO0tFS0ld3TjuMKb3PRG0dmtT_GQA',
    'Cookie': 'TS01ba0a42=01e3182d3542d36e644b92efaaabefa13788ad6a39336e91de9e96373b6590e391231a99e2364d5d8ae60f293ab1cc3bf7fba8635f'
  },
  data: data1,
  httpsAgent: agent
};

const upload = multer({ storage: multer.memoryStorage() })
// Function to extract images from PDF and look for QR code
const extractQRCodeFromPDF = async (pdfBuffer) => {
  /**
   * Load sample file when are testing
   */
  // var input_file = fs.readFileSync('./public/assets/file-samples/sample_qr_code_1.pdf');
  var returnResponse = async function (result) {
    

    if (result.success) {
      console.log(result.codes);
      if( result.codes.length > 0 ){
        const qrUrl = result.codes[0];
        const resu = await getFinalUrlAndId(qrUrl);
        if(resu){
          // data_config.data = JSON.stringify({"id": resu})
          axios.request(data_config)
            .then((response) => {
              console.log(JSON.stringify(response.data));
            })
            .catch((error) => {
              console.log(error);
            });
        }
      }

    } else{
      console.log(result.message);
    }
      
  }
  /**
   * PDF Buffer Data
   * Config settings like (zoom, invert Doc, improvisation)
   * Callback after process done
   */
  PDF_QR_JS.decodeDocument(pdfBuffer, config_settings, returnResponse);
};

// Route to handle PDF upload and QR code extraction
app.post('/upload-pdf', upload.single('file'), async (req, res) => {
  try {
    const qrCodeContent = await extractQRCodeFromPDF(req.file.buffer);

    if (qrCodeContent) {
      res.send(`QR Code Content: ${qrCodeContent}`);
    } else {
      res.send('No QR code found in the PDF.');
    }
  } catch (error) {
    res.status(500).send(`Error processing PDF: ${error.message}`);
  }
});





async function getFinalUrlAndId(initialUrl) {
  try {
      // Perform the request with `maxRedirects` set to 0 to catch the redirect response
      const response = await axios.get(initialUrl, { maxRedirects: 0 });

      // Extract the final URL from the `Location` header
      const finalUrl = response.headers.location;
      console.log('Redirected URL:', finalUrl);

      // Extract query parameters from the final URL
      const url = new URL(finalUrl);
      const id = url.searchParams.get('id');
      console.log('ID:', id);
  } catch (error) {
      if (error.response && error.response.status === 302) {
          // Handle the redirect
          const finalUrl = error.response.headers.location;
          console.log('Redirected URL:', finalUrl);

          // Extract query parameters from the final URL
          const url = new URL(finalUrl);
          const id = url.searchParams.get('id');
          console.log('ID:', id);
          return id;
      } else {
        
          console.error('Error:', error.message);
          return false;
      }
  }
}












app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const PORT = process.env.port || 3000

app.listen(PORT, () => {
  console.log(`Server Started and Running on PORT ${PORT}`)
})

