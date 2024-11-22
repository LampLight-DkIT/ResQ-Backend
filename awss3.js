const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path"); // Import the path module
const mime = require("mime-types");
require("dotenv").config();

const regionName = "eu-west-1";
const bucketName = "resqdkit";

const filePath = "uploads/text.txt"; 
const uploadDirectory = "uploads";

const client = new S3Client({
  region: regionName,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadFile = async (filePath, fileName) => {
  console.log(`Starting upload for ${fileName}...`);
  
  const fileContent = fs.readFileSync(filePath);
  const contentType = mime.lookup(filePath) || "application/octet-stream";

  const params = {
    Bucket: bucketName,
    Key: `uploads/${fileName}`,
    Body: fileContent,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
  };

  try {
    const command = new PutObjectCommand(params);
    const response = await client.send(command);
    console.log(`File uploaded successfully: ${fileName}`);
  } catch (error) {
    console.error(`Error uploading file (${fileName}):`, error);
  }
};

const uploadAllFilesInDirectory = async (directory) => {
  try {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);

      // Ensure the path is a file (not a directory)
      if (fs.lstatSync(filePath).isFile()) {
        await uploadFile(filePath, file); 
      }
    }

    console.log("All files uploaded successfully.");
  } catch (error) {
    console.error("Error reading directory or uploading files:", error);
  }
};

const downloadFile = async () => {
  const downloadFileName = "video.mp4"; 
  const localFilePath = path.join(__dirname, `downloaded-${downloadFileName}`); 

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

// uploadFile("./uploads/text.txt", "text2.txt");
// uploadAllFilesInDirectory(uploadDirectory);
// downloadFile();
