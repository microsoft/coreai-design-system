---
id: content
title: Content
summary: 'Write clear, useful product content and get the right level of design support.'
resources: []
reference:
  renderer: content
  route: foundations/Content
  aliases:
    - /content/
  migratedFrom:
    - apps/docsite/src/pages/Content.tsx
---

## Write clear, useful content

Good product content helps people understand, decide, and act without guessing.

Use these guidelines when writing or reviewing UI content for Microsoft Foundry experiences. They help teams create content that is clear, useful, consistent, and trustworthy.

These guidelines support everyday design work. They do not replace review from content design, legal, privacy, security, accessibility, or responsible AI specialists when that expertise is required.

Identify where people may struggle. Use the relevant guidance to help them understand, make informed decisions, take action, anticipate what will happen, and know what to do if something goes wrong.

### Write for the reader

Start with what the reader needs to know, do, or decide. Help them accomplish a goal.

**Bad:** Microsoft offers a variety of privacy compliance solutions.

**Better:** Manage privacy requirements with tools designed to help you meet compliance obligations.

- Focus on the customer's goal, not your organization's capabilities.
- Answer the reader's next question before they need to ask it.
- Choose usefulness over sounding impressive.
- Start with the user journey. Before writing the page, understand how it fits into the user's journey. Help users recognize where they are, continue toward their goal, and avoid dead ends.
- Who is the user? Make the experience clear and usable across roles, skill levels, experience, and language needs.
- Where did the user come from? Make the destination match the entry point and set the right context.
- What is the user trying to accomplish? Prioritize the information and actions needed to complete that goal.
- What does the user need to know or do next? Make the next step clear and keep required guidance in the experience.
- What could block the user? Provide a useful path forward instead of ending the journey.
- Check: Can users enter from the expected places, understand where they are, and complete their goal without reaching a dead end?

### Lead with the action

Put the most important information first and make the next step clear.

**Bad:** Before beginning the process of creating a workspace, there are several important considerations that should be reviewed.

**Better:** Create your workspace first. Then review these requirements.

**Bad:** No results found.

**Better:** No results match these filters. Clear the filters to see all traces.

- Lead with the key takeaway.
- Use active voice so readers know who acts and what to do.
- Keep one idea in each sentence.
- Make the next step clear. Tell people what happened and what they can do next, especially in errors, empty states, permission messages, and blocked workflows.
- The filters example explains what happened and gives the user an immediate next step in the experience.
- Check: Can the user tell what happened and what to do next?

### Write like a person

Use familiar words, a natural tone, and only the words needed to communicate the idea.

**Bad:** Utilize the platform to facilitate collaboration.

**Better:** Use the platform to work together.

**Bad:** To select a repository, first connect your GitHub account.

**Better:** Connect GitHub to select a repository.

- Use common words instead of jargon.
- Read the content aloud. Rewrite anything that sounds unnatural.
- Remove weak phrases and unnecessary introductions.
- Be concise and purposeful. Include the information people need to continue. Remove introductions, instructions, and descriptions that repeat the title, nearby controls, or information already visible in the interface.
- The GitHub example says the same thing with fewer words.
- Check: If this sentence is removed, does the user lose information they need to succeed?

### Make it easy to scan and use

Organize content so people can find the main point quickly and use it with any input method.

**Bad:** Click the blue button on the right.

**Better:** Select Save.

- Use headings, bullets, short paragraphs, white space, and lists.
- Use descriptive headings and meaningful link text.
- Do not rely on color, direction, or one input method to explain an action.
- Put information where people need it. The importance of information should determine where it appears. Do not hide information required to understand a choice, complete a task, or avoid an unwanted consequence.
- Main experience: Information required to understand the page, make a decision, or complete the current task. Avoid hiding essential requirements or consequences behind an interaction.
- Tooltip or info button: Brief supplementary information that supports the task but is not required by every user. Avoid moving critical instructions, warnings, or decision criteria out of view.
- Documentation link: Detailed concepts, prerequisites, or procedures that cannot be covered clearly in the product experience. Do not use documentation to compensate for unclear or incomplete UI content.
- Check: Does the user need this information now, and can they find it without guessing?

### Explain consequences before commitment

Surface important consequences at the decision point, before the user takes an action.

**Bad:** Delete this project?

**Better:** Deleting this project also deletes its agents and connections.

- Include costs, permissions, dependencies, irreversible choices, commitments, and possible data loss when they are relevant.
- The stronger version explains an important consequence before the user confirms the action.
- Check: Does the user have the information needed to make an informed decision?

### Be specific

Use concrete language, requirements, and outcomes.

**Bad:** Enter a valid name.

**Better:** Enter a name between 3 and 50 characters.

- Avoid broad terms such as supported, valid, or configured correctly unless the experience also explains what they mean.
- The stronger version states the requirement instead of making the user guess what "valid" means.
- Check: Could two people interpret this content differently?

### Use consistent terminology

Use the same nouns and verbs across titles, descriptions, controls, messages, and documentation.

**Bad:** Start the test to compare results. Button: Run evaluation

**Better:** Run the evaluation to compare results. Button: Run evaluation

- When referring to an element in the interface, use its exact label.
- The stronger version uses the same terminology as the control.
- Check: Can users scan the interface for the term you gave them?

### Help people choose

When the experience presents options, explain the difference that matters to the user.

**Bad:** Choose Playground or deployment.

**Better:** Test in Playground to try prompts. Deploy to use the model from your code.

- Focus on goals, outcomes, requirements, and tradeoffs rather than repeating option names.
- The stronger version gives users a clear reason to choose each option.
- Check: Does the content give the user a meaningful basis for choosing?

### Optional context with info bubbles

Use an info bubble when some users may benefit from extra context, but everyone can complete the task without opening it.

**Bad:** Endpoint: Copy this endpoint to connect your application to the model.

**Better:** Endpoint: The URL your application uses to connect to the deployed model.

- Keep the content brief and directly related to the label or control.
- Put in an info bubble: A brief definition of an unfamiliar term; optional context that helps some users understand a field or setting; an example that clarifies the expected input; or a link to detailed documentation when the summary is enough for the current task.
- Keep in the main experience: Information needed to complete the current task; requirements, warnings, costs, or consequences; instructions or recovery steps users must find to continue; and content that repeats the label or nearby helper text.
- Do not put content that repeats the label or nearby helper text in an info bubble.
- The preferred example defines the term. The other example gives an instruction the user needs to act on, so it should remain visible in the main experience.
- Check: Can the user complete the task without opening the info bubble?

## Process tips

Move from a realistic first draft to reviewed content in four steps.

### Write real content

Use realistic product language instead of placeholder copy. Aim for a first draft that is as close to the final content as possible.

### Refine the draft

Use the Content Design Copilot agent to simplify jargon. Refine the draft so it follows Microsoft voice standards and sounds natural.

### Review it in context

Review the content in a complete flow or mockup. Check UI terminology, errors, and empty states to make sure the words work in context.

### Before you publish

Before you ship, check that users can understand where they are, make informed decisions, take action with predictable results, recover from problems, and trust the experience. Put the main point first and make the next action clear. Cut extra words, read it aloud, and check that everyone can understand and use it.

- Journey: Do the entry points provide the right context, and can users complete their goal without reaching a dead end?
- Understand: Is the meaning clear? Are unfamiliar concepts explained at the right level?
- Decide: Does the user have enough information to compare options and make an informed choice?
- Act: Is the next step clear? Can the user complete the task without guessing?
- Predict: Is it clear what will happen after the user takes the action?
- Recover: If something goes wrong, does the user know how to resolve it or get help?
- Trust: Are important consequences, costs, permissions, and commitments clear before the user proceeds?

## Get help

Start with the lightest support option that fits the work. Reach out earlier rather than later.

### Use the agent

Start here for lower-risk work that needs a strong first draft. Use the Foundry Content Expert for simple UX writing, such as drafting, revising, or evaluating UI text.

[Open the Content Design Copilot](https://m365.cloud.microsoft/chat/?titleId=T_3e60de43-9ea8-499c-1f68-30bd3ff0e720)

- There are no legal, security, or Responsible AI implications.
- You want to simplify basic jargon or create realistic stand-in content.
- The work does not involve new UI.

### Make a content design request

Ask for direct support when the work is sensitive, strategic, or needs expert judgment. Work with a content designer when the experience requires content strategy, affects a large audience, or carries significant user or business risk.

- The work has legal, security, or Responsible AI implications.
- You do not know where to start.
- You need help with a larger content strategy, new or redesigned feature, navigation, AI behavior, or content research.
- The work requires terminology alignment across products or platforms.
- The experience introduces new, high-visibility, or foundational terminology.
- Users must compare complex options or make consequential decisions.
- The experience introduces a new end-to-end flow, onboarding experience, navigation model, or information architecture.
- The page has high traffic or high visibility.
- The experience includes complex errors, empty states, or recovery paths.
- The work has privacy, accessibility, compliance, or policy implications.
- Contact Content Design for complex decisions, terminology, errors and recovery, high-impact content, or a second opinion on how to help users understand and move forward. Content design assistance: Dan Kass and Gloria Wang.

[Open the content design desk](https://aka.ms/c-designdesk)
