const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path"); // Import the path module
require("dotenv").config();

const uploadFileName = "video.mp4";
const regionName = "eu-west-1";
const bucketName = "resqdkit";

const client = new S3Client({
  region: regionName,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadFile = async () => {
  console.log("Starting upload...");
  const fileContent = fs.readFileSync(`./${uploadFileName}`); // Test file

  const params = {
    Bucket: bucketName,
    Key: `uploads/${uploadFileName}`, // S3 key for the test file
    Body: fileContent,
    ContentType: "video/mp4", // Correct MIME type for text files
  };

  try {
    const command = new PutObjectCommand(params);
    const response = await client.send(command);
    console.log("File uploaded successfully");
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};

const downloadFile = async () => {
  const downloadFileName = "video.mp4"; // Key of the file in the bucket
  const localFilePath = path.join(__dirname, "downloaded-video.mp4"); // Path to save the file locally

  const params = {
    Bucket: bucketName,
    Key: `uploads/${downloadFileName}`,
  };

  try {
    console.log(`Starting download of ${downloadFileName} from bucket ${bucketName}...`);
    
    const command = new GetObjectCommand(params);
    const response = await client.send(command);

    // Create a writable stream and pipe the response body to it
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

// Uncomment the function you want to test
// uploadFile();
downloadFile();
