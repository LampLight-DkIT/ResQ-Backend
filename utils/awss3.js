const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
require("dotenv").config();

const regionName = "eu-west-1";
const bucketName = "resqdkit";

const client = new S3Client({
  region: regionName,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to upload a single file
const uploadFile = async (filePath, fileName) => {
  const fileContent = fs.readFileSync(filePath);
  const contentType = mime.lookup(filePath) || "application/octet-stream";

  const params = {
    Bucket: bucketName,
    Key: `uploads/${fileName}`, // Path in the S3 bucket
    Body: fileContent,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
  };

  try {
    const command = new PutObjectCommand(params);
    await client.send(command);
    console.log(`File uploaded successfully: ${fileName}`);
  } catch (error) {
    console.error(`Error uploading file (${fileName}):`, error);
  }
};

// Function to upload all files in a directory
const uploadAllFilesInDirectory = async (directory) => {
  try {
    const files = fs.readdirSync(directory);
    for (const file of files) {
      const filePath = path.join(directory, file);
      if (fs.lstatSync(filePath).isFile()) {
        await uploadFile(filePath, file); // Reuse the uploadFile function
      }
    }
    console.log("All files uploaded successfully.");
  } catch (error) {
    console.error("Error uploading files:", error);
  }
};

// Function to download a file from the S3 bucket
const downloadFile = async () => {
  const downloadFileName = "text.txt"; 
  const downloadFolder = path.join(__dirname, "../downloads");

  let localFilePath = path.join(__dirname,"../downloads", `downloaded-${downloadFileName}`);
  let counter = 1;
  while (fs.existsSync(localFilePath)) {
    localFilePath = path.join(downloadFolder, `downloaded-${downloadFileName}(${counter})`);
    counter++;
  }

  const params = {
    Bucket: bucketName,
    Key: `uploads/${downloadFileName}`,
  };

  try {
    const command = new GetObjectCommand(params);
    const response = await client.send(command);

    const writableStream = fs.createWriteStream(localFilePath);
    response.Body.pipe(writableStream);

    writableStream.on("finish", () => {
      console.log(`File downloaded successfully to ${localFilePath}`);
    });

    writableStream.on("error", (error) => {
      console.error("Error writing file:", error);
    });
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};

// Export all functions
module.exports = { uploadFile, uploadAllFilesInDirectory, downloadFile };
