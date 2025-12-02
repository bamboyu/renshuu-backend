const { OpenAI } = require("openai");
const axios = require("axios");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const s3 = require("../config/aws");

// openAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate Back text
async function generateBack(req, res) {
  const { front } = req.body;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Generate a concise answer/back side for the flashcard: "${front}"`,
        },
      ],
    });

    const backText = completion.choices[0].message.content.trim();
    res.json({ back: backText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate back" });
  }
}

// Generate Image and upload to S3
async function generateImage(req, res) {
  const { front } = req.body;

  try {
    // Generate image
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `Create a simple illustrative image for: "${front}"`,
      size: "1024x1024",
    });

    // Get Base64 string
    const b64_json = imageResponse.data[0].b64_json;
    if (!b64_json) throw new Error("No image data returned");

    const buffer = Buffer.from(b64_json, "base64");

    // Upload to S3
    const key = `${uuidv4()}.png`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: "image/png",
      })
    );

    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    res.json({ image: s3Url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate/upload image" });
  }
}

module.exports = { generateBack, generateImage };
