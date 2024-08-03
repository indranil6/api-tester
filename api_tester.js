const axios = require('axios');
const fs = require('fs');
const { json2csv } = require('json-2-csv');

const inputFilePath = 'postman_collection.json';
const outputFilePath = 'output.csv';

async function readJSONFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
}

async function writeCSVFile(filePath, data) {
  const csv = await json2csv(data);
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, csv, 'utf8', (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

function extractEndpoints(postmanCollection) {
  const endpoints = [];

  postmanCollection.item.forEach(collectionItem => {
    if (collectionItem.item) {
      collectionItem.item.forEach(requestItem => {
        const endpoint = {
          method: requestItem.request.method,
          url: requestItem.request.url.raw,
          headers: requestItem.request.header.reduce((headers, header) => {
            headers[header.key] = header.value;
            return headers;
          }, {}),
          data: requestItem.request.body ? JSON.parse(requestItem.request.body.raw || '{}') : {}
        };
        endpoints.push(endpoint);
      });
    }
  });

  return endpoints;
}

async function makeRequest(endpoint) {
  const { method, url, headers, data } = endpoint;
  const start = Date.now();
  try {
    const response = await axios({
      method: method.trim(),
      url,
      headers,
      data
    });
    const end = Date.now();
    return {
      url,
      method,
      requestBody: data,
      responseBody: response.data,
      responseTime: end - start,
      responseHeaders: response.headers,
      statusCode: response.status
    };
  } catch (error) {
    const end = Date.now();
    return {
      url,
      method,
      requestBody: data,
      responseBody: error.response ? error.response.data : error.message,
      responseTime: end - start,
      responseHeaders: error.response ? error.response.headers : {},
      statusCode: error.response ? error.response.status : 'N/A'
    };
  }
}

async function main() {
  const postmanCollection = await readJSONFile(inputFilePath);
  const endpoints = extractEndpoints(postmanCollection);

  const results = [];
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint);
    results.push(result);
  }

  await writeCSVFile(outputFilePath, results);
  console.log(`Results have been written to ${outputFilePath}`);
}

main().catch((error) => {
  console.error('Error:', error);
});
