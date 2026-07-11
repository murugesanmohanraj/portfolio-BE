const fs = require("fs");
const path = require("path");
const profile = require("./profile.json");
const experience = require("./experience.json");
const projects = require("./projects.json");
const skills = require("./skills.json");
const faqs = require("./faqs.json");
const achievements = require("./achievements.json");
const links = require("./links.json");
const careerFacts = require("./career-facts.json");
const interviewAnswers = require("./interview-answers.json");
const recruiterQuestions = require("./recruiter-questions.json");
const suggestions = require("./suggestions.json");

const systemPrompt = loadMarkdownFile(path.join(__dirname, "system-prompt.md"));
const knowledge = loadMarkdownDirectory(path.join(__dirname, "knowledge"));

module.exports = {
  profile,
  experience,
  projects,
  skills,
  faqs,
  achievements,
  links,
  careerFacts,
  interviewAnswers,
  recruiterQuestions,
  suggestions,
  systemPrompt,
  knowledge,
};

function loadMarkdownFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    return "";
  }
}

function loadMarkdownDirectory(dirPath) {
  const knowledge = {};
  if (!fs.existsSync(dirPath)) return knowledge;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const resolved = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      knowledge[entry.name] = loadMarkdownDirectory(resolved);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const key = path.basename(entry.name, ".md");
      knowledge[key] = loadMarkdownFile(resolved);
    }
  }
  return knowledge;
}
