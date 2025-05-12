"use server"

import { createServerClient } from "@/lib/supabase"

export async function seedDatabase() {
  const supabase = createServerClient()

  // Seed badges
  const badges = [
    {
      name: "First Steps",
      description: "Complete your first task",
      icon: "🔰",
      requirement: "Complete 1 task",
      xp_reward: 50,
    },
    {
      name: "Reflection Master",
      description: "Write 5 daily reflections",
      icon: "📝",
      requirement: "Write 5 reflections",
      xp_reward: 100,
    },
    {
      name: "Streak Warrior",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      requirement: "7-day streak",
      xp_reward: 150,
    },
    {
      name: "Polyglot",
      description: "Practice 3 different programming languages",
      icon: "💻",
      requirement: "Practice 3 languages",
      xp_reward: 200,
    },
    {
      name: "Cyber Ninja",
      description: "Complete 10 hacking challenges",
      icon: "🥷",
      requirement: "Complete 10 hacking challenges",
      xp_reward: 300,
    },
  ]

  const { error: badgesError } = await supabase.from("badges").upsert(badges, { onConflict: "name" })

  if (badgesError) {
    console.error("Error seeding badges:", badgesError)
    return { success: false, error: "Failed to seed badges" }
  }

  // Seed languages
  const languages = [
    { name: "Python", icon: "🐍" },
    { name: "JavaScript", icon: "🟨" },
    { name: "Bash", icon: "🐚" },
    { name: "SQL", icon: "🗃️" },
    { name: "C", icon: "©️" },
    { name: "C++", icon: "➕" },
    { name: "Go", icon: "🔵" },
    { name: "Rust", icon: "🦀" },
    { name: "Java", icon: "☕" },
    { name: "PowerShell", icon: "💙" },
  ]

  const { error: languagesError } = await supabase.from("languages").upsert(languages, { onConflict: "name" })

  if (languagesError) {
    console.error("Error seeding languages:", languagesError)
    return { success: false, error: "Failed to seed languages" }
  }

  // Seed mood suggestions
  const moodSuggestions = [
    // Productive mood
    {
      mood_type: "productive",
      suggestion: "Hack: Launch an Nmap scan on your local network (document ports and vulnerabilities).",
    },
    {
      mood_type: "productive",
      suggestion: "Code: Build a Bash script to sort your downloads by file type.",
    },
    {
      mood_type: "productive",
      suggestion: "Reflect: Write down the hardest concept you've learned. Now break it into 3 parts.",
    },
    {
      mood_type: "productive",
      suggestion: "Challenge: Set up a virtual machine and practice penetration testing techniques.",
    },
    {
      mood_type: "productive",
      suggestion: "Build: Create a simple port scanner using Python from scratch.",
    },
    {
      mood_type: "productive",
      suggestion: "Practice: Implement a basic encryption algorithm in your favorite language.",
    },

    // Curious mood
    {
      mood_type: "curious",
      suggestion: "Explore: Use NameCheckr to OSINT your own username.",
    },
    {
      mood_type: "curious",
      suggestion: "Challenge: Write a Python script to rename 100 files in a folder.",
    },
    {
      mood_type: "curious",
      suggestion: "Question: What does 'least privilege' really mean? Write it in your own words.",
    },
    {
      mood_type: "curious",
      suggestion: "Research: Look up a recent CVE and understand how the vulnerability works.",
    },
    {
      mood_type: "curious",
      suggestion: "Investigate: Try a basic steganography challenge online.",
    },
    {
      mood_type: "curious",
      suggestion: "Discover: Find and read about a cybersecurity incident from the last month.",
    },

    // Tired mood
    {
      mood_type: "tired",
      suggestion: "Watch: Who Am I: Kein System ist sicher (Netflix) — a fast-paced hacker thriller.",
    },
    {
      mood_type: "tired",
      suggestion: "Read: The Cult of the Dead Cow — book summary or article excerpt.",
    },
    {
      mood_type: "tired",
      suggestion: "Reflect: Skim notes from Week 2 and write 2 lines about what surprised you.",
    },
    {
      mood_type: "tired",
      suggestion: "Listen: Put on a cybersecurity podcast while you relax.",
    },
    {
      mood_type: "tired",
      suggestion: "Browse: Look through infosec memes for a light mental break.",
    },
    {
      mood_type: "tired",
      suggestion: "Watch: Check out a short YouTube tutorial on a basic security concept.",
    },

    // Burnout mood
    {
      mood_type: "burnout",
      suggestion: "Do: A 3-minute guided breathing timer.",
    },
    {
      mood_type: "burnout",
      suggestion: 'Listen: Darknet Diaries, Episode 32: "The Beirut Hacker".',
    },
    {
      mood_type: "burnout",
      suggestion: "Prompt: If you built your own hacking lab in a van, what would be inside?",
    },
    {
      mood_type: "burnout",
      suggestion: "Rest: Take a complete break from screens for at least an hour.",
    },
    {
      mood_type: "burnout",
      suggestion: "Imagine: Write a short fictional scenario about a day in the life of a security analyst.",
    },
    {
      mood_type: "burnout",
      suggestion: "Play: Try a hacking-themed game like Hacknet or Uplink.",
    },
  ]

  const { error: moodSuggestionsError } = await supabase
    .from("mood_suggestions")
    .upsert(moodSuggestionsError, { onConflict: "mood_type, suggestion" })

  if (moodSuggestionsError) {
    console.error("Error seeding mood suggestions:", moodSuggestionsError)
    return { success: false, error: "Failed to seed mood suggestions" }
  }

  // Seed hack challenges
  const hackChallenges = [
    {
      title: "Port Scanning Challenge",
      description:
        "Use Nmap to scan your local network and identify all devices. Document any open ports and potential vulnerabilities.",
      code_snippet: "sudo nmap -sS -O 192.168.1.0/24",
      xp_reward: 50,
    },
    {
      title: "Password Cracking",
      description:
        "Use John the Ripper to crack the provided password hash. Learn about dictionary attacks and brute force methods.",
      code_snippet: "john --wordlist=rockyou.txt hash.txt",
      xp_reward: 75,
    },
    {
      title: "SQL Injection",
      description:
        "Practice SQL injection on a vulnerable test site. Learn how to protect against this common attack vector.",
      code_snippet: "' OR 1=1 --",
      xp_reward: 100,
    },
    {
      title: "Network Packet Analysis",
      description:
        "Use Wireshark to capture and analyze network traffic. Identify protocols and potential security issues.",
      code_snippet: 'wireshark -i eth0 -f "port 80"',
      xp_reward: 125,
    },
    {
      title: "Cryptography Challenge",
      description: "Decrypt the provided message using the Caesar cipher. Learn about basic encryption techniques.",
      code_snippet: "python -c \"print(''.join([chr((ord(c) - ord('A') - 3) % 26 + ord('A')) for c in 'DWWDFN']))\"",
      xp_reward: 150,
    },
  ]

  const { error: hackChallengesError } = await supabase
    .from("hack_challenges")
    .upsert(hackChallenges, { onConflict: "title" })

  if (hackChallengesError) {
    console.error("Error seeding hack challenges:", hackChallengesError)
    return { success: false, error: "Failed to seed hack challenges" }
  }

  return { success: true, message: "Database seeded successfully" }
}
