import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';
import https from 'https';
import multer from 'multer';
import path from 'path';
import { PDF_QR_JS } from 'pdf-qr';
import fs from 'fs';
import * as cheerio from 'cheerio';
dotenv.config();

const __dirname = import.meta.dirname;

const app = express();

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
};

const data_config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://dc.crsorgi.gov.in/crs/0.0.1//certificate/validate',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': process.env.BEARER_TOKEN,
    'Cookie': 'TS01ba0a42=01e3182d358641ddcc607108751d5a48cb96cc2e94446e314c69e1eaf09775c9ec460a477d9f2b7c3bdef4a7130f3fbb2deb86706a'
  },
  data: JSON.stringify({ "id": "wMYBq9fe6W11NVRmjT1MXQ==" }),
  httpsAgent: agent,
  insecureHTTPParser: true
};

const upload = multer({ storage: multer.memoryStorage() });

const extractQRCodeFromPDF = (pdfBuffer) => {
  return new Promise((resolve, reject) => {
    PDF_QR_JS.decodeDocument(pdfBuffer, config_settings, async (result) => {
      if (result.success) {
        console.log(result.codes);
        if (result.codes.length > 0) {
          const qrUrl = result.codes[0];
          try {
            const resu = await getFinalUrlAndId(qrUrl);
            if (resu) {
              try {
                const response = await axios.request({
                  ...data_config,
                  data: JSON.stringify({ "id": resu.replace(/\s+/g, '+') })
                });
                console.log('Response Data:', JSON.stringify(response.data));
                resolve(response.data);
              } catch (error) {
                console.error('Error in Axios Request:', error.message);
                reject(error);
              }
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          }
        } else {
          resolve(null);
        }
      } else {
        console.log(result.message);
        resolve(null);
      }
    });
  });
};

app.post('/upload-pdf', upload.single('file'), async (req, res) => {
  const resultFilePath = path.join(__dirname, 'public', 'result.html')
  try {
    const qrCodeContent = await extractQRCodeFromPDF(req.file.buffer);
    if (qrCodeContent) {
      // res.send(qrCodeContent.data);
      const resultContent = await fs.promises.readFile(resultFilePath, 'utf8');
      const $ = cheerio.load(resultContent)
      // Function to handle updating or removing elements based on the existence of data from site
      const isEmpty = (value) => {
        return value == null || (typeof value === 'string' && !value.trim());
      };
      
      const updateOrRemoveRow = (dataKey, selector, rowClass) => {
        if (!isEmpty(qrCodeContent.data[dataKey])) {
          $(`td[name="${selector}"]`).text(qrCodeContent.data[dataKey]);
        } else {
          // If empty remove in from html
          $(`.${rowClass}`).remove();
        }
      };
      
      // Applying the function to each field on html data
      updateOrRemoveRow('DOD', 'dod', 'dod-row');
      updateOrRemoveRow('NAME', 'person-name', 'name-row');
      updateOrRemoveRow('RegistrationDate', 'reg-date', 'reg-date-row');
      updateOrRemoveRow('RegistrationNumber', 'reg-num', 'reg-no-row');
      updateOrRemoveRow('NameOfFather', 'father-name', 'f-name-row');
      updateOrRemoveRow('NameOfMother', 'mother-name', 'm-name-row');
      
      
      res.send($.html());
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
    const finalUrl = response.headers.location;
    console.log('Redirected URL:', finalUrl);
    const url = new URL(finalUrl);
    const id = url.searchParams.get('id');
    console.log('ID:', id);
    return id;
  } catch (error) {
    if (error.response && error.response.status === 302) {
      const finalUrl = error.response.headers.location;
      console.log('Redirected URL:', finalUrl);
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

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Started and Running on PORT ${PORT}`);
});
