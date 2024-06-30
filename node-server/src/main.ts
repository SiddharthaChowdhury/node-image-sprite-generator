import fs from "fs";
import path from "path";
import sharp from "sharp";
import { glob } from "glob";

// Define the folder containing the images
const imagesFolder = "./images"; // Change to your images folder

// Output file
const outputImage = "./sprite/sprite.webp";
// const outputJSON = "./sprite/sprite.json";
const outputCSS = "./sprite/sprite.css";

// Function to create image sprite
const createImageSprite = async () => {
	try {
		// Get all image files in the folder
		const imageFiles = await glob(`${imagesFolder}/*.{png,jpg,jpeg,webp}`);

		// Get metadata of each image
		const imagesMetadata = await Promise.all(
			imageFiles.map(async (file: any) => {
				const metadata = await sharp(file).metadata();
				return {
					file,
					width: metadata.width || 0,
					height: metadata.height || 0,
				};
			})
		);

		// Calculate the dimensions of the sprite image
		const spriteWidth = Math.max(...imagesMetadata.map((img) => img.width));
		const spriteHeight = imagesMetadata.reduce(
			(sum, img) => sum + img.height,
			0
		);

		console.log(">>>>>> IMAGES ", imagesMetadata.length);

		// Create an empty canvas with the calculated dimensions
		let sprite = sharp({
			create: {
				width: spriteWidth,
				height: spriteHeight,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			},
		});

		let topOffset = 0;
		const cssRules: string[] = [];
		// const spriteData: {
		// 	[key: string]: { width: number; height: number; x: number; y: number };
		// } = {};

		// Collect composite operations
		const compositeOperations = imagesMetadata.map(
			({ file, width, height }) => {
				const className = path.basename(file, path.extname(file));
				cssRules.push(
					`.${className} { width: ${width}px; height: ${height}px; background: url(${outputImage}) 0 -${topOffset}px; }`
				);
				// spriteData[className] = { width, height, x: 0, y: topOffset };
				const operation = { input: file, top: topOffset, left: 0 };
				topOffset += height;
				return operation;
			}
		);

		// Apply all composite operations in one go
		sprite = sprite.composite(compositeOperations);

		// Save the sprite image as WebP
		await sprite.webp({ quality: 90 }).toFile(outputImage);

		// Save the JS object as JSON
		// fs.writeFileSync(outputJSON, JSON.stringify(spriteData, null, 2));
		// Save the CSS rules
		fs.writeFileSync(outputCSS, cssRules.join("\n"));

		console.log("WebP sprite image and JSON created successfully!");
	} catch (error) {
		console.error("Error creating sprite:", error);
	}
};

createImageSprite();
