-- Epic Achievements for Cybersecurity Tracker
-- This script adds challenging, long-term achievements to the badges table

-- 1. Cybersecurity Legend
INSERT INTO public.badges (name, description, icon, requirement, xp_reward)
VALUES (
  'Cybersecurity Legend',
  'Reached the pinnacle of cybersecurity expertise',
  '🏆',
  'Reach Level 50',
  1000
);

-- 2. Iron Will
INSERT INTO public.badges (name, description, icon, requirement, xp_reward)
VALUES (
  'Iron Will',
  'Demonstrated extraordinary consistency in your cybersecurity journey',
  '⚡',
  'Maintain a 100-day streak without breaking',
  500
);

-- 3. Polyglot Grandmaster
INSERT INTO public.badges (name, description, icon, requirement, xp_reward)
VALUES (
  'Polyglot Grandmaster',
  'Mastered multiple programming languages for cybersecurity applications',
  '🧠',
  'Master 10 programming languages (proficiency 8+)',
  750
);

-- 4. Reflection Philosopher
INSERT INTO public.badges (name, description, icon, requirement, xp_reward)
VALUES (
  'Reflection Philosopher',
  'Demonstrated deep commitment to learning through extensive reflection',
  '📝',
  'Write 100 reflections with at least 500 words each',
  600
);

-- 5. Time Lord
INSERT INTO public.badges (name, description, icon, requirement, xp_reward)
VALUES (
  'Time Lord',
  'Invested significant time in mastering cybersecurity skills',
  '⏱️',
  'Log 1000 hours of study time',
  800
);

-- 6. Task Conqueror
INSERT INTO public.badges (name, description, icon, requirement, xp_reward)
VALUES (
  'Task Conqueror',
  'Completed an extraordinary number of cybersecurity learning tasks',
  '✅',
  'Complete 500 tasks',
  700
);

-- 7. Hack the Planet
INSERT INTO public.badges (name, description, icon, requirement, xp_reward)
VALUES (
  'Hack the Planet',
  'Demonstrated practical skills by completing numerous cybersecurity challenges',
  '🌐',
  'Complete 50 cybersecurity challenges',
  900
);

-- 8. Knowledge Network
INSERT INTO public.badges (name, description, icon, requirement, xp_reward)
VALUES (
  'Knowledge Network',
  'Built connections between different cybersecurity skill areas',
  '🔗',
  'Connect 5 different learning areas (languages, frameworks, security concepts)',
  650
);

-- 9. Cyberpunk Elite
INSERT INTO public.badges (name, description, icon, requirement, xp_reward)
VALUES (
  'Cyberpunk Elite',
  'Achieved mastery in all aspects of the cybersecurity tracker',
  '🔥',
  'Earn all other achievements',
  2000
);

-- 10. Digital Fortress
INSERT INTO public.badges (name, description, icon, requirement, xp_reward)
VALUES (
  'Digital Fortress',
  'Applied cybersecurity skills to build a complete security project',
  '🏰',
  'Build and document a complete cybersecurity project',
  1200
);
