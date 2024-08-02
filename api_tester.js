const axios = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const { json2csv } = require("json-2-csv");

const inputFilePath = "input.csv"; // or 'input.json'
const outputFilePath = "output.csv";

async function readCSVFile(filePath) {
  const records = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on("data", (data) => records.push(data))
      .on("end", () => resolve(records))
      .on("error", (error) => reject(error));
  });
}

async function readJSONFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
}

async function writeCSVFile(filePath, data) {
  const csv = await json2csv(data);
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, csv, "utf8", (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

function parseJSONField(field) {
 if(!field) {
   return {};
 }
  try {
    return JSON.parse(field);
  } catch (error) {
    return field;
  }
}

async function makeRequest(endpoint) {
  const { method, url, params, headers, data } = endpoint;
  const start = Date.now();
  try {
    const response = await axios({
      method: method.trim(),
      url,
      params: parseJSONField(params),
      headers: parseJSONField(headers),
      data: parseJSONField(data),
    });

    const end = Date.now();
    return {
      url,
      method,
      requestBody: parseJSONField(data),
      responseBody: response.data,
      responseTime: end - start,
      responseHeaders: response.headers,
      statusCode: response.status,
    };
  } catch (error) {
    const end = Date.now();
    return {
      url,
      method,
      requestBody: parseJSONField(data),
      responseBody: error.response ? error.response.data : error.message,
      responseTime: end - start,
      responseHeaders: error.response ? error.response.headers : {},
      statusCode: error.response ? error.response.status : "N/A",
    };
  }
}

async function main() {
  let endpoints;
  if (inputFilePath.endsWith(".csv")) {
    endpoints = await readCSVFile(inputFilePath);
  } else if (inputFilePath.endsWith(".json")) {
    endpoints = await readJSONFile(inputFilePath);
  } else {
    throw new Error("Unsupported input file format. Use CSV or JSON.");
  }

  const results = [];
  for (const endpoint of endpoints) {
    // console.log(endpoint);

    const result = await makeRequest(endpoint);
    results.push(result);
  }

  await writeCSVFile(outputFilePath, results);
  console.log(`Results have been written to ${outputFilePath}`);
}

main().catch((error) => {

  console.error("Error:", error);
});
