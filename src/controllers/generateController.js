const { OpenAI } = require("openai");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const s3 = require("../config/aws");

// OpenAI configuration
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
    console.error("Generate Back Error:", err);
    res.status(500).json({ message: "Failed to generate back text" });
  }
}

// Generate Image and upload to S3
async function generateImage(req, res) {
  // Extract cardID if it exists (for updating existing cards)
  const { front, cardID } = req.body;

  if (!front) {
    return res.status(400).json({ message: "Missing front text" });
  }

  try {
    // 1. Generate image with Base64 response
    const imageResponse = await openai.images.generate({
      model: "dall-e-3", // Use a valid model
      prompt: `Create a simple illustrative image for: "${front}"`,
      size: "1024x1024",
      response_format: "b64_json", // REQUIRED: Get image data, not just a URL
    });

    // 2. Get Base64 string
    const b64_json = imageResponse.data[0].b64_json;
    if (!b64_json) throw new Error("No image data returned from OpenAI");

    // 3. Convert to Buffer
    const buffer = Buffer.from(b64_json, "base64");

    // 4. Create unique key
    const key = `${uuidv4()}.png`;

    // 5. Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: "image/png",
      })
    );

    // 6. Construct public URL
    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // 7. Save to Database if cardID is provided
    if (cardID) {
      const updatedCard = await Card.findByIdAndUpdate(
        cardID,
        { image: s3Url },
        { new: true }
      );
      if (!updatedCard) {
        console.warn(
          `Card with ID ${cardID} not found, image not saved to DB.`
        );
      }
    }

    res.json({ image: s3Url });
  } catch (err) {
    console.error("Generate Image Error:", err);
    res.status(500).json({ message: "Failed to generate or upload image" });
  }
}

module.exports = { generateBack, generateImage };
