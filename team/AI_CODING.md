# AI Experiment Documentation

---

## Moiez

I used Claude Sonnet 4.5 in Copilot off browser to help format documentation for our standup meetings. During standups I quickly jot down rough notes about what was completed, what was in progress, and any blockers. Instead of manually organizing everything, I asked Claude to structure the notes into clean, well-formatted Markdown.

It helped convert messy bullet points into clearly organized sections with consistent headings, sub-bullets, and spacing, which made the updates much easier for the team to read.

While the AI saved time and improved clarity, I still had to provide specific instructions about the format I wanted (for example, separating updates by team member or grouping tasks by status).

More general prompts would organize the notes, but not always in the exact structure our team preferred, so I refined my prompts to a format that suited our team's needs. I also carefully reviewed the formatted output to ensure accuracy and that no details were lost or misrepresented.

To ensure fair use, I reviewed and edited the generated Markdown rather than copying it directly. I verified that all updates accurately reflected what was discussed during the meeting and adjusted formatting to match our documentation standards. By combining clear prompting, manual review, and consistency checks, I effectively used the tool to streamline our standup documentation process.

---

## Wyatt

- **AI Tool:** Claude
- **Outcomes I Produced:** Feature edit for chat.js to add names above people's message bubbles on the messaging page
- **How useful for future:** It was extremely useful! I fed in the file so Claude had an idea of what I'm working with. Context is important for prompt engineering. It was able to communicate when it needed extra information (It wanted to see what the firebase headers looked like)
- **Steps to ensure correct, understandable, and fair use:** I explained my goal, which I chose to be a very bite-sized feature that wouldn't be difficult to implement. This was to ensure that it actually had the ability to complete the feature I wanted. If I told it to build a whole new aspect of the app (like duo mobile 2-factor auth) there's no way I could trust it's code. And it would be too much to test on. I then made sure to create a ride, have some duplicate accounts join the ride, and text in the messaging chat, so I can see the feature with my own eyes. It worked perfectly.

---

## Tanvi

I used ChatGPT as an AI-assisted development and documentation tool to help analyze MVP user feedback, generate structured feature specifications, and create planning documentation for the UCSB Rideshare App. Using the tool, I was able to:

- Group and rank qualitative feedback into major feature themes (trust and safety, payments, maps, authentication, notifications, profiles)
- Generate a technical feature specification Markdown file with user behavior descriptions and possible implementation approaches
- Create a roadmap-style README that connected feedback to response actions and subsequently next steps
- Map upcoming and in-progress user stories to planned feature areas to ensure alignment between feedback and development work

I handled several parts manually to ensure accuracy and relevance. I provided the AI with our MVP feedback PDF, screenshots of our in-progress and to-do user stories, and context about our tech stack (React Native, Expo, Firebase) and current MVP scope. I manually validated that feature groupings matched real feedback, filtered technical suggestions to match our team's skill level and sprint scope, and edited documentation to match our actual roadmap and terminology. I also removed features that the team discussed as unnecessary for our current timeline. I used AI to summarize and structure information rather than copy original content, and reviewed all generated documentation before using it in project materials. By giving it our current user stories, it was able to categorize the features by subtasks to help us with planning as we continue developing our app, taking into consideration what we were currently working on as I provided it with our team's priorities. Additionally, for each feature we wanted to add, I had it summarize what it would look like for the user as well as what the technical implementation would look like (summarized). In the future, this can be used to assist vibe coding efforts by using the technical explanations to help create prompts.

---

## Kenisha

I used Claude Sonnet 4.5 to help implement a ride capacity feature in our app. I added a total_seats field so each ride stores both the original capacity and the remaining seats, made it so joining a ride only decreases the remaining seats, and updated the UI to show remaining/total seats. The AI was helpful for suggesting how to structure the logic and data, which saved me some time, but its first answers did not fully match my existing code so I had to tweak things to make it fit. I tested joining rides to make sure the numbers updated correctly and checked that older rides without total_seats did not break. I did not just paste the code in because sometimes it did not work right away, so I had to read it, adjust it, and debug a bit. Overall it was useful for getting started and moving faster, but I still had to figure out how to integrate it properly into our app.

---

## Joel

I used Claude Sonnet 4.5 on their AI web interface to help implement a profile viewing feature accessible from the chat screen. I wanted users to be able to tap on the chat header to view someone's profile in 1-on-1 conversations, and in group chats, see a list of all participants that they could tap into. I provided Claude with my existing chat screen and account page files and described the behavior I was looking for. Claude generated the initial tappable header logic, the participants' modal, and a read-only version of my account page as a new profile view screen. From there, I worked through several rounds of testing and revision. When I tested in Expo, I noticed the back button on the profile page was invisible because it was the same color as the background. I simply changed the color to white. I also ran into a problem where router.back() wasn't returning to the chat reliably since the profile page lives under the account tab, while the chat is under the messages tab. I brought this issue up to Claude and worked to solve it by passing the conversationId as a route param so the profile page could navigate back to the exact chat explicitly. I also had to correct the file path Claude initially used for the route to match my actual project structure. Throughout the process, I reviewed the generated code to make sure I understood the patterns being used, tested each change in Expo after every adjustment, and made edits where needed to fit my project. Claude was most helpful for scaffolding boilerplate-heavy work like modals and styled components, but catching visual bugs, diagnosing navigation edge cases, and ensuring everything fit together properly required hands-on involvement.

---

## Hien

I used Anthropic Claude Opus 4.6 like a pair-programmer to help me build and debug the backend logic for canceling and leaving rides in our campus rideshare app. It helped me figure out how to safely remove a user from a ride, automatically add one seat back when they leave, and write Firebase rules so regular users (not just admins) could leave rides without breaking security. I also used it to troubleshoot permission errors and clean up my TypeScript and Firestore logic. It saved me a lot of time and helped me think through edge cases, but I still reviewed everything myself, tested it in the emulator, and made sure the code was secure and correct before shipping. Overall, it felt less like auto-coding and more like having a smart teammate to bounce ideas off of.

---

## Anna

I used Claude Sonnet 4.5 in Copilot within VS Code to create the "Leave Ride" button that takes users to a leave confirmation page. It saved time by generating button components and navigation logic. However, to get results in the style I wanted, I had to learn how to write very specific prompts. General prompts worked, but the output often needed changes because it wouldn't match the rest of the UI. I also ran into a nested modals bug that required manual debugging. To make sure the AI output was correct and understandable, I tested my app in Expo after every adjustment. This helped me catch errors and confirm that the UI worked properly. To ensure fair use, I made sure I understood and modified the generated code instead of copying it blindly. I also reviewed and edited the code to match my project's standards. By combining careful prompting, frequent testing, and manual review, I was able to use the tool effectively.

---

## Ruben

*(To be filled out)*