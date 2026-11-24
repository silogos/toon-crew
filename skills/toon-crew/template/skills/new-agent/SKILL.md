---
name: new-agent
description: Add a specialist to the crew of this series, change one, or remove one. Use when the Director wants someone who checks or advises on something this series must get right (accuracy of facts or sources, a subject that needs expert care, a style or rule of the series, suitability for an audience), or asks for "an agent", "a reviewer", "a checker" or "an expert" for the series. Also use it when the Director wants a certain job set apart and handled by its own crew member. Also read it when the Director's story, formula or script includes quotations from real texts, factual claims, or the rules of a field or faith, or when their words set a job apart: it says when to offer a specialist.
---

# New crew member (Assistant Director)

The studio comes with two subagents, Quality Control and the Voice Director. A series may need more: someone who knows a subject, guards a rule, or owns one job of this series. An extra crew member is a **subagent of this series**: a file in `agents/`, listed in `series/crew.json`, consulted at the stages the Director chooses.

What the specialist is for comes from the Director's words, never from the crew's own idea of what a series "might" need.

**Three kinds.** A specialist either **checks** (verifies the work against sources and reports), **advises** (gives an opinion on the work and reports), or **does** (owns one defined job and produces its result). The first two never change a file. The third writes only the files of its own job.

**When to offer one.** The crew does not think up specialists, but it does notice when the Director's own words call for one. Offer a specialist when what the Director has asked for includes something that must match the world outside the series, and a mistake in it would matter:

- words quoted from a real text or a real person,
- claims of fact that viewers will take as true (history, science, health, law, religion, money),
- the rules or practice of a field, a faith, a craft or a profession,
- a real person, organisation, place or event shown as itself.

Also offer one when the Director's own words **set a job apart**:

- they ask that a certain job be handled separately, by someone dedicated to it, or always by the same hand,
- they describe a job that returns in every episode with rules of its own,
- they give a standing instruction about how one kind of work must always be done,
- they correct the same kind of thing for the third time (the lessons file shows it).

That is an offer of a specialist who **does** or **advises**, not one who checks. Do not offer one merely because a job is large or could run in parallel: splitting work for speed is the crew's own business and needs no new crew member.

Offer it once, in one or two lines, at the moment it comes up: quote the Director's words that prompted it, say what the specialist would check or do, and, for one that checks, say that it needs sources the Director trusts. Then go on with the work; it is an offer, not a condition. If the Director declines, do not offer the same specialist again for that series, and mark such content as not verified wherever you show it. Never offer one for what the crew merely finds difficult, and never create one without the Director's okay.

## 1. Brief — ask, then stop

Ask only what the Director has not said, in one round:

- **Which kind?** Checks, advises, or does. Take it from what the Director asked for; ask only if it is unclear.
- **What must this person get right, or what is their job?** In the Director's words: the subject and what counts as a mistake, or the job and what a good result is.
- **What do they check against?** A specialist verifies against something it can actually read: files the Director puts in `series/references/`, or pages on the web if this session can read the web. Ask which sources the Director trusts. If there is no source it can read, say plainly that the specialist can only flag doubts, not confirm anything.
- **When are they consulted?** One or more stages: `brief`, `script`, `storyboard`, `production`, `render`.
- **For one that does a job:** what exactly they produce, which files that means, and what they must never touch. Their result is reviewed like anyone's work: Quality Control reads it when it is writing (a script, lines), and the Director approves it.
- **Can they stop the work?** If yes, a stage is not shown to the Director as ready while the specialist has an open objection; it is shown with the objection instead.

Propose in a few lines: the job title, the kind, what they check or do, their sources or the files they write, the stages, and whether they can stop the work. **Wait for okay.**

## 2. Write the agent

Create `agents/<name>.md` (`<name>` in lower case with hyphens). Use this shape and fill every part from the Director's brief:

```markdown
---
name: <name>
description: <Job title> for this series. Use at <stages> to check <what>, before the result is shown to the Director. Reports findings; never edits the work.
tools: Read, Glob, Grep<, WebSearch, WebFetch only if the Director approved web sources>
---

You are the **<Job title>** of this animated series. The studio rules are in `CLAUDE.md` and the rules of this series in `series/story/00-bible.md`. Write your report in the language of the brief you are given.

## What you check
<the subject, and what counts as a mistake, in the Director's terms>

## What you check against
<the sources, in order of trust: files under series/references/, named sites>

## Rules
- Check every claim, quotation, name, number and reference in the work you are given that falls in your subject. Do not check anything else.
- Verify only against a source you have opened in this session. Never confirm from memory. Give the source for each item: file and place in it, or address.
- Three verdicts only: **confirmed** (matches the source, with the reference), **wrong** (differs from the source: show both), **not verified** (no source found or readable). "Probably right" is "not verified".
- A quotation must match its source word for word, in the language and wording the series uses. A paraphrase presented as a quotation is **wrong**.
- You do not change any file. You report.

## Report
A table: item, where it appears (file and line id), verdict, source. Then one line: can this stage go to the Director as it is, or what must change first.
```

Keep it to what this specialist needs; remove a rule that does not apply and add the series' own. A specialist that advises rather than verifies still reports and never edits: replace the three verdicts with what the Director wants its opinion on, and keep "You do not change any file".

For a specialist that **does** a job, the file has the same top and these sections instead:

```markdown
---
name: <name>
description: <Job title> for this series. Use at <stages> to <the job>. Writes only <its files>; everything else it leaves alone.
tools: Read, Glob, Grep, Write, Edit<, Bash only if the job needs a studio command>
---

You are the **<Job title>** of this animated series. The studio rules are in `CLAUDE.md` and the rules of this series in `series/story/00-bible.md`; read both before you start. Write your report in the language of the brief you are given.

## Your job
<what you produce, and what a good result is, in the Director's terms>

## What you may write
<the exact files or folders of this job>

## Rules
- Do your job and nothing else. Do not touch any file outside the list above; if your job needs a change elsewhere, say so in your report instead of making it.
- Work from what is approved: the bible, the approved script and storyboard. Do not add a character, a place, a line or an idea of your own; where something is missing, ask in your report.
- <the Director's own rules for this job>

## Report
What you made (files), what you were unsure of, and what you need from the Director or the crew.
```

## 3. Put them on the crew

1. Add an entry to `series/crew.json`: `{"agent": "<name>", "job": "<Job title>", "kind": "checks", "stages": ["script"], "blocks": true}` (`kind` is `checks`, `advises` or `does`).
2. Add a line to the bible under `## Extra crew`: the job, what they check, their sources, in the Director's words.
3. If they check against files, make `series/references/` and tell the Director to put the sources there. The crew does not download reference texts on its own: the Director chooses which edition, translation or authority counts.
4. `npm run check` confirms the entry and the file match. `npm run status` lists the extra crew.
5. Tell the Director the specialist is on the crew, when it will be consulted, and what it cannot do: it checks against the sources it was given and is not a substitute for a person who knows the subject. For anything where a mistake would matter outside the video, the Director or someone they trust has the last word.

A subagent file added during a conversation may not be available as a subagent until a new session starts. Until then, do the specialist's check yourself by following its file exactly, and say in your report that you did.

## Using the extra crew

Before any stage listed for a specialist is shown to the Director, hand that stage's work to the specialist and read the report:

- **Wrong:** fix it if the fix is certain and within what the Director approved; otherwise bring it to the Director. Never fix a quotation by guessing.
- **Not verified:** never present it as checked. Show it to the Director marked as not verified, and ask for the exact text and source, or for leave to drop it.
- Include the specialist's one-line verdict in what you show the Director.

For a specialist that **does** a job: at its stage, hand it the job with what is approved so far, then read its report and look at what it made. Its work goes through the same checks and the same okay as the rest of that stage. If it wrote outside its files, undo that and say so.

## Changing or removing one

Changing what a specialist checks, its sources or its stages is the Director's decision: propose, wait for okay, edit the file and `series/crew.json`. To remove one, delete its entry and its file after the Director's okay; say which finished episodes it had checked.
