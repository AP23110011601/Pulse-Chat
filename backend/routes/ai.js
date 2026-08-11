const express = require("express");
const auth = require("../middleware/auth");
const aiService = require("../services/aiService");
const { aiLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// POST /api/ai/smart-reply
router.post("/smart-reply", auth, aiLimiter, async (req, res) => {
  try {
    const { text, conversationHistory } = req.body;
    const suggestions = await aiService.generateSmartReply(req.user.id, text, conversationHistory);
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/translate
router.post("/translate", auth, aiLimiter, async (req, res) => {
  try {
    const { text, targetLang = "es" } = req.body;
    const result = await aiService.translateMessage(text, targetLang);
    
    if (result.error) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/spam-check
router.post("/spam-check", auth, aiLimiter, async (req, res) => {
  try {
    const { text } = req.body;
    const result = await aiService.detectSpam(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/summary", auth, aiLimiter, async (req,res)=>{
  try{

    const {messages=[]}=req.body;

    if(!Array.isArray(messages)){
      return res.status(400).json({
        error:"Messages must be an array"
      });
    }


    const result =
      await aiService.generateConversationSummary(messages);


    res.json(result);


  }catch(error){

    console.error(error);

    res.status(500).json({
      error:error.message
    });

  }
});

// POST /api/ai/grammar-check
router.post("/grammar-check", auth, aiLimiter, async (req, res) => {
  try {
    const { text } = req.body;
    const result = await aiService.generateGrammarSuggestions(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/sentiment
router.post("/sentiment", auth, aiLimiter, async (req, res) => {
  try {
    const { text } = req.body;
    const result = await aiService.analyzeSentiment(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
