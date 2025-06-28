# Overselling Prevention Transfer Rule

## Trigger Conditions
Transfer conversation to the overselling agent immediately when any of the following patterns are detected:

### Promise & Commitment Language (Immediate Transfer)
- **Delivery Commitments**: Specific timelines, deadlines, or delivery promises ("We'll have this done by...", "You'll see results within...")
- **Feature Promises**: Guaranteeing specific features or capabilities that may not be finalized ("This will definitely include...", "We can build...")
- **Capacity Claims**: Overstating team abilities or resources ("We can handle any scale", "No problem, we do this all the time")
- **Outcome Guarantees**: Promising specific results or ROI ("You'll see a 50% increase", "This will solve all your problems")

### High-Risk Sales Language (Immediate Transfer)
- **Absolute Statements**: Words like "definitely", "guaranteed", "no problem", "absolutely", "for sure"
- **Unrealistic Timelines**: Promising quick turnarounds without consulting team ("We can get this done next week")
- **Capability Exaggeration**: Claiming expertise or experience that may be overstated
- **Competitive Overreach**: Making claims about beating competitors without substantiation

### Agreement Under Pressure (Preemptive Transfer)
- **Eager Acceptance**: Quickly agreeing to demands without consideration ("Yes, we can do that", "Sure, no problem")
- **Scope Creep Agreement**: Accepting additional requirements without proper evaluation
- **Budget Constraints Ignored**: Agreeing to work within unrealistic budgets
- **Resource Allocation Promises**: Committing specific team members or resources without confirmation

### Emotional Overselling Indicators (Context-Aware Transfer)
- High-pressure closing language ("We need to decide today", "This offer won't last")
- Desperation signals (overly accommodating, saying yes to everything)
- Feature stacking without clear value proposition
- Making promises to save a deal or relationship

## Transfer Logic
- **Preventive**: Transfer before commitments are fully made
- **Reality-Check Focused**: Prioritize honesty and realistic expectations over closing
- **Collaborative**: Encourage exploratory language over definitive promises

## Exceptions (No Transfer Required)
- Exploratory language ("We're exploring", "Let's discuss", "We could potentially")
- Honest capability statements backed by evidence
- Appropriate hedging and qualification of statements
- General conversation without commitment implications
- Questions and discovery discussions

## Agent Behavior Post-Transfer
Once transferred to the overselling agent, the conversation will be monitored in real-time with immediate JSON notifications for any risky promises or commitments. The focus will be on promoting realism over persuasion and clarity over hype.
