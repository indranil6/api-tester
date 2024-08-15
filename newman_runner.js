const newman = require("newman");

const postmanCollectionFile = "postman_collection.json";
const outputCsvFile = "output.csv";
const outputHtmlFile = "output.html";

async function runNewmanCollection() {
  return new Promise((resolve, reject) => {
    newman.run(
      {
        collection: require(`./${postmanCollectionFile}`),
        reporters: ["cli", "csv", "html", "htmlextra", "json"],
        reporter: {
          csv: {
            export: outputCsvFile,
          },
          html: {
            export: outputHtmlFile,
          },
        },
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

async function main() {
  try {
    let response = await runNewmanCollection();

    console.log(response);
    console.log(
      `Reports have been generated: ${outputCsvFile}, ${outputHtmlFile}`
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
