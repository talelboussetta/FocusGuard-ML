# Knowledge Base

This directory contains source documents that will be embedded and stored in the vector database.

## Structure

Organize documents by category for easy filtering:

```
knowledge_base/
├── focus_tips/
│   ├── pomodoro_technique.md
│   ├── phone_management.md
│   └── environment_setup.md
├── productivity_research/
│   ├── deep_work_principles.pdf
│   └── attention_science.md
├── user_guides/
│   └── how_to_use_focusguard.md
└── sample_data.md  # Example document
```

## Document Format

**Markdown** (recommended for structure):
```markdown
# Title
## Section
Content here...
```

**Plain text**:
```
Simple text content
```

**PDF**: Supported by most embedding libraries (requires parsing)

## Metadata Tags

Add metadata to documents for better filtering:

```markdown
---
category: focus_tips
difficulty: beginner
tags: [phone, distractions, social_media]
author: FocusGuard Team
---

# How to Manage Phone Distractions
...
```

## Adding New Documents

1. Create a new file in the appropriate category folder
2. Write clear, concise content (500-2000 words per document)
3. Add metadata tags at the top
4. Run the ingestion script to embed and store:
   ```bash
   python -m rag.scripts.ingest_documents
   ```

## Document Best Practices

- **Chunk size**: Keep sections 200-500 words for better retrieval
- **Clear headings**: Help the chunking algorithm split logically
- **Actionable content**: Focus on tips users can implement
- **Avoid repetition**: Each document should cover unique information
- **Update regularly**: Remove outdated advice, add new research

## Example Use Cases

- **Focus tips**: Techniques for maintaining concentration
- **Distraction handling**: How to deal with specific interruptions
- **Session strategies**: When to take breaks, optimal session length
- **Research insights**: Scientific findings on productivity
- **User stories**: Successful focus strategies from community
