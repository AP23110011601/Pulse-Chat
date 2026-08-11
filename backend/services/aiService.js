class AIService {
  constructor() {
    this.contextMemory = new Map(); // Store conversation context
    this.maxContextSize = 10;
  }

  async generateSmartReply(userId, text, conversationHistory = []) {
    // Update context memory
    this.updateContext(userId, text);

    const lower = text.toLowerCase();
    let suggestions = [];

    // Context-aware suggestions based on conversation history
    const recentContext = this.getContext(userId);
    
    if (lower.includes("how are you") || lower.includes("how's it going")) {
      suggestions = [
        "I'm doing great, thanks! 😊",
        "All good here! How about you?",
        "Doing well! Ready to build."
      ];
    } else if (lower.includes("meeting") || lower.includes("call") || lower.includes("time")) {
      suggestions = [
        "Let's meet at 3 PM 🕒",
        "Sure, send me the invite!",
        "Can we push it by 30 mins?"
      ];
    } else if (lower.includes("project") || lower.includes("code") || lower.includes("apk")) {
      suggestions = [
        "Looking sleek and modern! 🚀",
        "I'll review and test it right away.",
        "Awesome progress! 👍"
      ];
    } else if (lower.includes("hello") || lower.includes("hey") || lower.includes("hi")) {
      suggestions = [
        "Hey there! 👋",
        "Hello! How can I help?",
        "Hey! Hope you have a great day! ✨"
      ];
    } else if (lower.includes("thank")) {
      suggestions = [
        "You're welcome! 😊",
        "Happy to help!",
        "Anytime! 👍"
      ];
    } else if (lower.includes("sorry") || lower.includes("apologize")) {
      suggestions = [
        "No worries at all!",
        "It happens, don't stress about it",
        "All good! 😊"
      ];
    } else if (lower.includes("?")) {
      suggestions = [
        "Let me think about that...",
        "Good question! I'll get back to you.",
        "That's interesting - tell me more."
      ];
    } else {
      // Generate contextual suggestions based on conversation flow
      if (recentContext.length > 0) {
        const lastMessage = recentContext[recentContext.length - 1];
        if (lastMessage.includes("?")) {
          suggestions = [
            "Yes, absolutely!",
            "I think so, let me confirm.",
            "That's a great idea!"
          ];
        } else {
          suggestions = [
            "That's great! 🎉",
            "Let me check and get back to you.",
            "Could you tell me more about it?"
          ];
        }
      } else {
        suggestions = [
          "That's great! 🎉",
          "Let me check and get back to you.",
          "Could you tell me more about it?"
        ];
      }
    }

    return suggestions.slice(0, 3);
  }

  async translateMessage(text, targetLang = "es") {
    if (!text) return { error: "Text is required" };

    // Enhanced multi-language dictionary with more phrases
    const dictionary = {
      es: {
        "hello": "¡Hola!",
        "how are you": "¿Cómo estás?",
        "good morning": "Buenos días",
        "meeting tomorrow": "Reunión mañana",
        "project completed": "Proyecto completado",
        "thank you": "Gracias",
        "goodbye": "Adiós",
        "see you later": "Hasta luego",
        "i agree": "Estoy de acuerdo",
        "no problem": "Sin problema",
      },
      fr: {
        "hello": "Bonjour !",
        "how are you": "Comment allez-vous ?",
        "good morning": "Bonjour",
        "meeting tomorrow": "Réunion demain",
        "project completed": "Projet terminé",
        "thank you": "Merci",
        "goodbye": "Au revoir",
        "see you later": "À plus tard",
        "i agree": "Je suis d'accord",
        "no problem": "Pas de problème",
      },
      de: {
        "hello": "Hallo!",
        "how are you": "Wie geht es dir?",
        "good morning": "Guten Morgen",
        "meeting tomorrow": "Treffen morgen",
        "project completed": "Projekt abgeschlossen",
        "thank you": "Danke",
        "goodbye": "Auf Wiedersehen",
        "see you later": "Bis später",
        "i agree": "Ich stimme zu",
        "no problem": "Kein Problem",
      },
      hi: {
        "hello": "नमस्ते!",
        "how are you": "आप कैसे हैं?",
        "good morning": "शुभ प्रभात",
        "meeting tomorrow": "कल बैठक है",
        "project completed": "परियोजना पूर्ण हुई",
        "thank you": "धन्यवाद",
        "goodbye": "अलविदा",
        "see you later": "बाद में मिलेंगे",
        "i agree": "मैं सहमत हूं",
        "no problem": "कोई समस्या नहीं",
      },
      ja: {
        "hello": "こんにちは!",
        "how are you": "お元気ですか?",
        "good morning": "おはようございます",
        "meeting tomorrow": "明日の会議",
        "project completed": "プロジェクト完了",
        "thank you": "ありがとう",
        "goodbye": "さようなら",
        "see you later": "また後で",
        "i agree": "同意します",
        "no problem": "問題ありません",
      },
    };

    const lower = text.trim().toLowerCase();
    const langMap = dictionary[targetLang] || {};
    let translated = langMap[lower];

    if (!translated) {
      const prefixes = {
        es: "[ES] ",
        fr: "[FR] ",
        de: "[DE] ",
        hi: "[HI] ",
        ja: "[JA] ",
      };
      translated = (prefixes[targetLang] || `[${targetLang.toUpperCase()}] `) + text;
    }

    return { original: text, translated, targetLang };
  }

  async detectSpam(text) {
    if (!text) return { isSpam: false, confidence: 0 };

    const spamKeywords = [
      "win free money",
      "claim prize",
      "wire transfer",
      "hacked",
      "password leak",
      "http://suspicious",
      "click here now",
      "urgent action required",
      "you have been selected",
      "limited time offer",
      "act now",
      "congratulations you won",
      "verify your account",
      "suspicious activity"
    ];

    const lower = text.toLowerCase();
    const matchedKeywords = spamKeywords.filter(kw => lower.includes(kw));
    
    // Calculate confidence based on number of spam keywords
    let confidence = 0;
    if (matchedKeywords.length > 0) {
      confidence = Math.min(0.3 + (matchedKeywords.length * 0.15), 0.98);
    }

    // Additional heuristics
    const excessiveCaps = (text.match(/[A-Z]/g) || []).length > text.length * 0.5;
    const excessiveExclamation = (text.match(/!/g) || []).length > 3;
    const suspiciousUrls = text.match(/https?:\/\/[^\s]+/gi) || [];
    
    if (excessiveCaps) confidence += 0.1;
    if (excessiveExclamation) confidence += 0.1;
    if (suspiciousUrls.length > 2) confidence += 0.2;

    confidence = Math.min(confidence, 0.99);

    return {
      isSpam: confidence > 0.5,
      confidence,
      reason: matchedKeywords.length > 0 
        ? `Contains suspicious keywords: ${matchedKeywords.join(", ")}`
        : confidence > 0.5 
          ? "Suspicious pattern detected" 
          : "Clean message",
      matchedKeywords
    };
  }

  async generateConversationSummary(messages) {
    try {
      if (!Array.isArray(messages) || messages.length === 0) {
        return {
          summary: "No messages to summarize.",
          stats: {
            totalMessages: 0,
            participantCount: 0,
            topics: [],
            timeSpanMinutes: 0,
          },
        };
      }

      const sortedMessages = [...messages].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      const senderCounts = {};
      const topics = [];

      const firstCreated = new Date(
        sortedMessages[0]?.createdAt || Date.now()
      );

      const lastCreated = new Date(
        sortedMessages[sortedMessages.length - 1]?.createdAt || Date.now()
      );

      const timeDifference = Math.max(
        0,
        lastCreated - firstCreated
      );

      const timeSpanMinutes = Math.floor(
        timeDifference / 60000
      );

      sortedMessages.forEach((msg) => {
        const sender = msg.senderName || "Unknown";
        senderCounts[sender] =
          (senderCounts[sender] || 0) + 1;

        const text = String(msg.text || "").toLowerCase();

        if (
          text.includes("project") ||
          text.includes("code") ||
          text.includes("app") ||
          text.includes("development")
        ) {
          if (!topics.includes("Project Discussion")) {
            topics.push("Project Discussion");
          }
        }

        if (
          text.includes("meeting") ||
          text.includes("call") ||
          text.includes("schedule") ||
          text.includes("time")
        ) {
          if (!topics.includes("Scheduling")) {
            topics.push("Scheduling");
          }
        }

        if (
          text.includes("hello") ||
          text.includes("hi") ||
          text.includes("hey")
        ) {
          if (!topics.includes("Greetings")) {
            topics.push("Greetings");
          }
        }

        if (
          text.includes("error") ||
          text.includes("problem") ||
          text.includes("issue")
        ) {
          if (!topics.includes("Problem Discussion")) {
            topics.push("Problem Discussion");
          }
        }
      });

      const topSenders = Object.entries(senderCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(
          ([name, count]) =>
          `${name} (${count} messages)`
        );

      const latestMessage =
        sortedMessages[
          sortedMessages.length - 1
        ];

      const latestText =
        latestMessage?.text
          ? latestMessage.text.substring(0, 80)
          : "Media/file shared";

      const summary = [
        "📌 AI Conversation Summary",
        "",
        `• Total messages: ${sortedMessages.length}`,
        `• Conversation duration: ${timeSpanMinutes} minutes`,
        `• Participants: ${Object.keys(senderCounts).length}`,
        `• Most active users: ${topSenders.join(", ") || "None"}`,
        topics.length
          ? `• Topics: ${topics.join(", ")}`
          : "• Topics: General conversation",
        `• Latest activity: ${latestText}`
      ].join("\n");

      return {
        summary,
        stats: {
          totalMessages: sortedMessages.length,
          participantCount:
            Object.keys(senderCounts).length,
          topics,
          timeSpanMinutes,
        },
      };
    } catch (error) {
      console.error(
        "generateConversationSummary error:",
        error
      );

      return {
        summary:
          "Unable to generate conversation summary.",
      };
    }
  }

  async generateGrammarSuggestions(text) {
    if (!text || text.length < 5) {
      return { suggestions: [], original: text };
    }

    const suggestions = [];
    
    // Common grammar checks
    if (text.includes("dont")) {
      suggestions.push({
        type: "grammar",
        original: "dont",
        suggestion: "don't",
        reason: "Missing apostrophe"
      });
    }
    
    if (text.includes("cant")) {
      suggestions.push({
        type: "grammar",
        original: "cant",
        suggestion: "can't",
        reason: "Missing apostrophe"
      });
    }

    if (text.includes("wont")) {
      suggestions.push({
        type: "grammar",
        original: "wont",
        suggestion: "won't",
        reason: "Missing apostrophe"
      });
    }

    if (text.match(/\bi\b/) && text.match(/\bme\b/)) {
      suggestions.push({
        type: "grammar",
        suggestion: "Check subject-verb agreement with 'I' and 'me'",
        reason: "Possible incorrect pronoun usage"
      });
    }

    if (text.includes("  ")) {
      suggestions.push({
        type: "formatting",
        suggestion: "Remove double spaces",
        reason: "Extra spacing detected"
      });
    }

    return {
      suggestions,
      original: text,
      correctedCount: suggestions.length
    };
  }

  async analyzeSentiment(text) {
    if (!text) return { sentiment: "neutral", confidence: 0.5 };

    const positiveWords = [
      "great", "awesome", "excellent", "good", "happy", "love", "thanks",
      "amazing", "wonderful", "fantastic", "perfect", "best", "beautiful",
      "excited", "glad", "pleased", "delighted", "😊", "🎉", "👍", "❤️"
    ];

    const negativeWords = [
      "bad", "terrible", "awful", "hate", "angry", "sad", "disappointed",
      "frustrated", "annoyed", "upset", "worried", "concerned", "sorry",
      "problem", "issue", "error", "fail", "wrong", "😢", "😠", "😞"
    ];

    const lower = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lower.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lower.includes(word)) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { sentiment: "neutral", confidence: 0.5 };
    }

    const positiveRatio = positiveCount / total;
    let sentiment = "neutral";
    let confidence = 0.5 + (Math.abs(positiveRatio - 0.5) * 0.5);

    if (positiveRatio > 0.6) {
      sentiment = "positive";
    } else if (positiveRatio < 0.4) {
      sentiment = "negative";
    }

    return {
      sentiment,
      confidence: Math.min(confidence, 0.95),
      positiveCount,
      negativeCount
    };
  }

  // Context management for better AI responses
  updateContext(userId, message) {
    if (!this.contextMemory.has(userId)) {
      this.contextMemory.set(userId, []);
    }

    const context = this.contextMemory.get(userId);
    context.push(message);

    if (context.length > this.maxContextSize) {
      context.shift();
    }
  }

  getContext(userId) {
    return this.contextMemory.get(userId) || [];
  }

  clearContext(userId) {
    this.contextMemory.delete(userId);
  }
}

module.exports = new AIService();
