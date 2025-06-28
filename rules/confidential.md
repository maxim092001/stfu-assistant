# Confidential Information Transfer Rule

## Trigger Conditions
Transfer conversation to the confidential agent immediately when any of the following are detected or about to be mentioned:

### High-Risk Identifiers (Immediate Transfer)
- **Client/Company Names**: Any mention of specific client names, company partners, or business relationships
- **Financial Data**: Revenue figures, budgets, pricing strategies, financial projections, or internal metrics
- **Unreleased Features**: Product roadmaps, upcoming launches, beta features, or development timelines
- **Employee Information**: Names, roles, salaries, performance reviews, or internal personnel details
- **Legal Content**: Contracts, agreements, legal strategies, or confidential legal discussions

### Technical Confidential Data (Immediate Transfer)
- **API Keys/Credentials**: Any alphanumeric strings that could be authentication tokens
- **Internal URLs**: Company-specific domains, internal tool links, or private system references
- **Code/Architecture**: Proprietary algorithms, system designs, or technical specifications
- **Internal Communications**: References to Slack channels, Notion pages, or private documents

### Contextual Risk Indicators (Preemptive Transfer)
- Phrases like "don't share this", "between us", "confidential", "internal only"
- Discussion of competitors with specific strategic details
- Mention of internal processes, workflows, or proprietary methodologies
- References to unreleased partnerships, deals, or business strategies

## Transfer Logic
- **Preemptive**: Transfer before full disclosure, even on partial mentions
- **Inclusive**: When in doubt, always transfer (false positives preferred over missed risks)
- **Context-Aware**: Consider conversation flow and intent, not just keywords

## Exceptions (No Transfer Required)
- General industry discussions without specific details
- Public information already available
- Common greetings, pleasantries, or general conversation
- Abstract concepts without proprietary specifics

## Agent Behavior Post-Transfer
Once transferred to the confidential agent, the conversation will be monitored in real-time with immediate JSON notifications for any detected risks.  The focus will be to prevent speaker from sharing confidential information.
