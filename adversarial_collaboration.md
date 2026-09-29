# Adversarial Collaboration Reflection — HydroCrop Monitor

**Student:** ZHIKUN ZHU  
**Course:** MGMT 6110 — Human-AI Collaboration  
**Product:** HydroCrop Monitor

---

## 1. What I Predicted Before Peer Evaluation

Before my groupmates tested the product, I tried to predict where they would find usability problems.

My main concern was that the HydroCrop Monitor uses specialised vertical-farming terminology and a workflow that may be unfamiliar to people outside this domain. I therefore expected first-time users to have difficulty understanding where to start and what some of the operational information meant.

My four main predictions were:

1. **Reporting Technician is not editable**  
   I expected this to violate Nielsen Heuristic #3, User Control and Freedom, because the interface did not allow the user to change the technician identity.

2. **The interface may feel cluttered to a first-time user**  
   I expected a Heuristic #8, Aesthetic and Minimalist Design, problem because the dashboard contains many operational cards, statuses and actions.

3. **There is not enough help or onboarding**  
   I expected Heuristic #10, Help and Documentation, to be the weakest area because a new user unfamiliar with vertical-farm operations may not immediately understand the workflow.

4. **Error states may not provide enough explanation or recovery guidance**  
   I expected a Heuristic #9, Help Users Recognize, Diagnose, and Recover from Errors, problem if users triggered an error condition.

My falsifiable prediction was that peers unfamiliar with agricultural operations would struggle primarily with understanding the purpose and terminology of the product.

---

## 2. What My Peers Actually Found

The peer evaluations challenged my original prediction.

My peers generally understood the interface well enough to start interacting with it. Instead of focusing mainly on terminology or onboarding, they discovered problems in the operational logic and state management.

Several findings were especially important.

### Critical bay prioritisation

Two peers independently discovered that BAY-07 was marked **Critical**, but the main inspection shortcut directed the technician to BAY-03, which was only **Warning**.

This was more serious than the navigation problems I had predicted. The interface was understandable, but it was directing the user toward a lower-priority problem.

### Handover status did not always reflect reality

Peers found that the verification checklist could still be incomplete while the Handover Summary suggested that the facility had been verified.

They also found situations where the preview could imply that the handover was already locked or confirmed before the final confirmation action had actually occurred.

This exposed a mismatch between the system's displayed state and its real state.

### Incomplete handover could still be confirmed

A peer found that the shift handover could proceed even when required checklist items or abnormal bays remained unresolved.

This was particularly important because confirming a shift handover is a high-consequence action. The problem was not simply whether the button was easy to understand; the workflow itself did not sufficiently protect the user from confirming incomplete work.

### Locking did not fully behave like locking

The evaluation also showed that parts of the handover could remain editable after the interface represented the shift as locked.

This violated the expectation created by the word "locked" and could make the handover record unreliable.

### Operational severity was mixed with flag status

One peer discovered that resolving the flag for BAY-07 could change its displayed condition from Critical to Warning even though its underlying readings had not changed.

This revealed that two different concepts had become coupled:

- the operational condition of the bay; and
- whether a handover flag had been resolved.

Resolving an administrative handover action should not imply that the physical condition itself has improved.

### Technician input could be lost

Another peer edited diagnostic information, switched to another bay, and then returned. The unfinished input could be lost.

This was a useful adversarial finding because it resulted from realistic navigation behavior rather than simply inspecting the screen visually.

### Required fields could accept meaningless input

A peer also discovered that some required text fields could accept whitespace-only input.

The interface therefore appeared to require meaningful technician information while the underlying validation could still accept an effectively empty value.

### Persistence was weaker than I assumed

The most significant unresolved finding concerned persistence.

A peer demonstrated that refreshing the application could reset important state such as flags, notes, logs or lock status.

For a real shift-handover product, this would be a major reliability issue because the incoming technician cannot depend on information that exists only in the previous browser session.

---

## 3. Where My Predictions Were Right — and Wrong

My original predictions were not completely wrong, but I overestimated presentation and onboarding problems and underestimated workflow-integrity problems.

I expected unfamiliar terminology, limited help and interface complexity to dominate the evaluation. Those were reasonable usability concerns, but they were not the most consequential findings produced by the peer tests.

The more important problems appeared after users started interacting with the workflow:

- Which abnormal bay does the system prioritise?
- Can an incomplete handover still be confirmed?
- Does "Locked" actually mean that the record is locked?
- Does resolving a flag incorrectly change the bay's operational condition?
- Can a technician lose unfinished notes?
- Does the state survive a refresh?

This changed the question I was asking about the product.

Initially, I was asking:

> **Will users unfamiliar with urban farming understand the interface?**

After the adversarial evaluation, the more important question became:

> **Can users trust the system once they understand how to use it?**

That was the biggest surprise from the exercise.

---

## 4. How I Responded to the Feedback

I did not ask the AI to redesign the entire application after receiving the peer reviews.

Instead, I compared the findings, looked for repeated and higher-severity problems, and used focused prompts to constrain the AI to specific corrections.

### Revision 1 — Workflow integrity

The first revision addressed the highest-risk findings.

I asked the AI to:

- prioritise unresolved bays by **Critical → Warning → Normal**;
- make BAY-07 the primary inspection target while it remains Critical;
- make the Handover Summary reflect the actual checklist and confirmation state;
- prevent silent confirmation of an incomplete handover;
- require explicit acknowledgement for an incomplete-handover override;
- make locked handovers genuinely non-editable unless explicitly reopened;
- separate operational bay severity from handover flag status.

I then manually tested the revised interface instead of accepting the AI's report as sufficient evidence.

The revised product correctly surfaced:

`Inspect Critical (BAY-07)`

I also tested the handover with all five checklist items incomplete and three abnormal bays still unresolved.

The system displayed an **Incomplete Handover Verification Warning** stating that five checklist items and three abnormal bays were unresolved. It separately identified BAY-07 as Critical and BAY-03 and BAY-10 as Warning.

The override could not proceed until I explicitly acknowledged the unresolved work.

I accepted this revision because my own verification matched the intended behavior.

### Revision 2 — Protecting technician input

The second revision focused on two remaining peer findings.

I asked the AI to preserve unsaved input separately for each bay during the current session and to reject whitespace-only values in required text fields.

The revised application now preserves per-bay drafts while the technician navigates between bays and provides an `Unsaved Draft` indication and an explicit way to discard the draft.

Required text fields also trim input before validation, so spaces alone no longer count as meaningful technician input.

I accepted these changes because they addressed the specific peer-tested failure cases without redesigning unrelated parts of the product.

---

## 5. Conflicting Peer Feedback

Not all peer feedback pointed in the same direction.

One peer considered the **Live External Conditions** panel too visually prominent and suggested that it competed with more important operational information.

Another peer specifically identified this section as something that worked well because it clearly showed:

- current external environmental information;
- observation timing;
- source attribution;
- separation between outside weather and prototype hydro-bay telemetry;
- appropriate retry/error behavior.

I therefore did not mechanically follow either opinion.

I kept the Live External Conditions feature because it provides genuine external operational context and because its data provenance is clearly distinguished from the prototype facility readings.

However, I also accepted that its visual prominence could be reduced in a future iteration.

This was an important part of the adversarial process: peer feedback is evidence to evaluate, not a list of commands that must all be implemented.

---

## 6. What I Did Not Fully Fix

The most important unresolved issue is **true persistence**.

I improved session-level state handling so that unsaved bay drafts survive navigation between bays and screens. However, this does not solve the larger persistence problem identified by the peer evaluation.

A hard browser refresh can still reset in-memory state, and the prototype does not provide a shared persistent database that would allow an incoming technician on another device to recover the same operational handover state reliably.

I chose not to pretend that this problem had been solved.

Adding true cross-session and cross-device persistence would require a larger architectural change involving shared backend storage and appropriate state synchronisation. That was outside the scope of the focused usability corrections I made during this iteration.

For a production shift-handover system, this would be one of the first issues I would address next.

---

## 7. What I Learned About Human-AI Collaboration

This exercise changed how I think about the division of work between humans and AI in product development.

AI was effective at implementing well-bounded corrections once a problem had been clearly identified. For example, after I specified the Critical → Warning → Normal priority rule, the AI could update the relevant workflow consistently. It was also useful for implementing draft preservation, validation and handover-state changes quickly.

However, the most valuable problems were discovered by humans behaving in ways that the original prompts and implementation had not anticipated.

My peers switched bays before saving, entered spaces into required fields, refreshed the application, attempted to confirm incomplete work, resolved flags and compared the displayed state with the underlying readings.

Those actions exposed assumptions that were not obvious from simply looking at whether the interface appeared complete.

I also learned that an AI-generated statement such as "the build passed" or "the requested behavior was implemented" is not the same as evidence that the product behaves correctly. Human verification remained necessary after each meaningful revision.

Earlier iterations of this project benefited from a formal RGOGC-style prompt structure because the AI had to build or extend substantial functionality. During this adversarial revision stage, I used narrower finding-driven prompts instead. The goal was no longer to define the product broadly, but to constrain the AI to specific failures that humans had already demonstrated.

The strongest lesson for me is therefore:

> **I initially focused on whether users would understand the interface. My peers showed me that the more important question was whether the system could be trusted once users understood it.**

The peer feedback shifted my attention from explaining the interface to protecting the integrity of the workflow.

For this type of operational product, that distinction matters. A polished interface can make a prototype convincing, but adversarial human testing is what revealed whether its states, safeguards and records were actually dependable.

---

## 8. Final Reflection

My original self-evaluation concentrated mostly on visible usability issues: control, clutter, documentation and error guidance.

The peer evaluation uncovered a different class of problems: prioritisation, state truthfulness, irreversible actions, validation, data loss and persistence.

That difference was the main value of the adversarial collaboration.

The AI helped me implement the revisions quickly, but the humans determined which assumptions deserved to be challenged. My role was to decide which findings were important, constrain the AI's changes, verify the result myself, and acknowledge what remained unresolved rather than treating every AI-generated fix as complete.

The final prototype is therefore not "finished," but it is more trustworthy than the version that entered peer evaluation—and I have a clearer understanding of what would still be required before a system like this could support a real operational handover.
