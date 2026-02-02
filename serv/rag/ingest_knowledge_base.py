"""
Knowledge Base Ingestion Script

Loads markdown files from knowledge_base/ and ingests them into Qdrant vector store.

Usage:
    cd serv
    python -m rag.ingest_knowledge_base
"""

import asyncio
import os
import re
from pathlib import Path
from typing import List, Dict, Any
import logging
import yaml

from rag.embeddings.sentence_transformer_embedder import SentenceTransformerEmbedder
from rag.vector_store.qdrant_store import QdrantVectorStore
from rag.vector_store.base_store import Document


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class KnowledgeBaseIngester:
    """Handles ingestion of markdown files into vector store."""
    
    def __init__(self, knowledge_base_dir: str, collection_name: str = "focusguard_knowledge"):
        self.knowledge_base_dir = Path(knowledge_base_dir)
        self.collection_name = collection_name
        self.embedder = SentenceTransformerEmbedder()
        self.vector_store = None
        
    async def initialize(self):
        """Initialize embedder and vector store."""
        logger.info("Initializing embedder...")
        # SentenceTransformerEmbedder initializes in __init__, no async needed
        
        logger.info("Initializing Qdrant vector store...")
        self.vector_store = QdrantVectorStore(
            url="http://localhost:6333",
            collection_name=self.collection_name,
            vector_size=self.embedder.dimension
        )
        await self.vector_store.initialize()
        
    def parse_markdown_file(self, file_path: Path) -> Dict[str, Any]:
        """
        Parse markdown file with YAML frontmatter.
        
        Returns:
            Dict with 'frontmatter' and 'content' keys
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract YAML frontmatter
        frontmatter = {}
        body = content
        
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                try:
                    frontmatter = yaml.safe_load(parts[1]) or {}
                    body = parts[2].strip()
                except yaml.YAMLError as e:
                    logger.warning(f"Failed to parse YAML in {file_path.name}: {e}")
        
        return {
            'frontmatter': frontmatter,
            'content': body,
            'filename': file_path.name
        }
    
    def chunk_by_sections(self, content: str, filename: str) -> List[str]:
        """
        Split markdown content by ## headers (sections).
        
        Each chunk includes the section header and content.
        """
        # Split by ## headers (but not # main header)
        sections = re.split(r'\n## ', content)
        
        chunks = []
        main_title = ""
        
        # First section might be main title
        if sections[0].startswith('# '):
            main_title = sections[0].split('\n', 1)[0].replace('# ', '').strip()
            if '\n' in sections[0]:
                first_section_content = sections[0].split('\n', 1)[1].strip()
                if first_section_content:
                    chunks.append(f"# {main_title}\n\n{first_section_content}")
            sections = sections[1:]
        
        # Process remaining sections
        for section in sections:
            if not section.strip():
                continue
            
            # Add back the ## prefix
            section_text = f"## {section}".strip()
            
            # Include main title as context
            if main_title:
                chunk = f"# {main_title}\n\n{section_text}"
            else:
                chunk = section_text
            
            # Only add non-empty chunks
            if len(chunk.strip()) > 20:  # Minimum chunk size
                chunks.append(chunk)
        
        logger.debug(f"{filename}: Split into {len(chunks)} chunks")
        return chunks
    
    async def ingest_file(self, file_path: Path):
        """Ingest a single markdown file into vector store."""
        logger.info(f"Processing {file_path.name}...")
        
        # Parse file
        parsed = self.parse_markdown_file(file_path)
        frontmatter = parsed['frontmatter']
        content = parsed['content']
        
        # Chunk content by sections
        chunks = self.chunk_by_sections(content, file_path.name)
        
        if not chunks:
            logger.warning(f"No chunks generated from {file_path.name}")
            return
        
        # Create documents
        documents = []
        for i, chunk in enumerate(chunks):
            # Extract section title for better metadata
            section_title = chunk.split('\n')[0].replace('#', '').strip()
            
            metadata = {
                'source': file_path.name,
                'chunk_index': i,
                'section_title': section_title,
                **frontmatter  # Include category, difficulty, tags
            }
            
            # Generate unique ID from source + chunk_index
            doc_id = f"{file_path.stem}_{i}"
            
            doc = Document(
                id=doc_id,
                content=chunk,
                metadata=metadata
            )
            documents.append(doc)
        
        # Add to vector store
        # Generate embeddings for all chunks
        logger.debug(f"Generating embeddings for {len(documents)} chunks...")
        texts = [doc.content for doc in documents]
        embeddings = await self.embedder.embed_batch(texts)
        
        await self.vector_store.add_documents(documents, embeddings)
        logger.info(f"✅ Ingested {file_path.name}: {len(chunks)} chunks")
    
    async def ingest_all(self):
        """Ingest all markdown files from knowledge base directory."""
        # Find all .md files (exclude README and CLEANUP_SUMMARY)
        md_files = [
            f for f in self.knowledge_base_dir.glob('*.md')
            if f.name not in ['README.md', 'CLEANUP_SUMMARY.md']
        ]
        
        if not md_files:
            logger.error(f"No markdown files found in {self.knowledge_base_dir}")
            return
        
        logger.info(f"Found {len(md_files)} markdown files to ingest")
        
        # Ingest each file
        for file_path in sorted(md_files):
            await self.ingest_file(file_path)
        
        # Get collection stats
        info = await self.vector_store.get_collection_info()
        count = info.get('points_count', 0)
        logger.info(f"\n{'='*60}")
        logger.info(f"✅ INGESTION COMPLETE")
        logger.info(f"Total documents in vector store: {count}")
        logger.info(f"Collection: {self.collection_name}")
        logger.info(f"{'='*60}\n")


async def main():
    """Main ingestion workflow."""
    # Determine knowledge base path
    script_dir = Path(__file__).parent
    knowledge_base_dir = script_dir / 'knowledge_base'
    
    if not knowledge_base_dir.exists():
        logger.error(f"Knowledge base directory not found: {knowledge_base_dir}")
        return
    
    logger.info(f"Starting knowledge base ingestion from: {knowledge_base_dir}")
    
    # Create ingester
    ingester = KnowledgeBaseIngester(
        knowledge_base_dir=str(knowledge_base_dir),
        collection_name="focusguard_knowledge"
    )
    
    # Initialize
    await ingester.initialize()
    
    # Ingest all files
    await ingester.ingest_all()
    
    logger.info("Ingestion complete! You can now query the RAG endpoint.")


if __name__ == "__main__":
    asyncio.run(main())
