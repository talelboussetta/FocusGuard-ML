import logging
from typing import List, Dict, Any, Optional
from supabase import create_client, Client

from api.config import settings
from .base_store import BaseVectorStore, Document, SearchResult


logger = logging.getLogger(__name__)


class SupabaseVectorStore(BaseVectorStore):
    def __init__(
        self,
        url: str,
        key: str,
        collection_name: str = "documents",
        query_function: str = "match_documents"
    ):
        self.url = url
        self.key = key
        self.collection_name = collection_name
        self.query_function = query_function
        self.client: Optional[Client] = None
        
    async def initialize(self):
        if not self.url or not self.key:
            raise ValueError("Supabase URL and Key are required")
            
        try:
            self.client = create_client(self.url, self.key)
            logger.info(f"Connected to Supabase project: {self.url}")
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {e}")
            raise

    async def add_documents(
        self,
        documents: List[Document],
        embeddings: List[List[float]]
    ) -> None:
        if not self.client:
            await self.initialize()
            
        data = []
        for doc, emb in zip(documents, embeddings):
            row = {
                "content": doc.content,
                "metadata": doc.metadata,
                "embedding": emb
            }
            if doc.id:
                row["id"] = doc.id
                
            data.append(row)
            
        try:
            self.client.table(self.collection_name).insert(data).execute()
            logger.info(f"Added {len(documents)} documents to {self.collection_name}")
        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            raise

    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        if not self.client:
            await self.initialize()
            
        params = {
            "query_embedding": query_embedding,
            "match_threshold": settings.rag_score_threshold,
            "match_count": top_k,
            "filter": filter_metadata or {}
        }
        
        try:
            response = self.client.rpc(self.query_function, params).execute()
            
            results = []
            for i, item in enumerate(response.data):
                doc = Document(
                    id=str(item.get("id")),
                    content=item.get("content"),
                    metadata=item.get("metadata", {}),
                    embedding=None
                )
                
                results.append(SearchResult(
                    document=doc,
                    score=item.get("similarity", 0.0),
                    rank=i
                ))
                
            return results
            
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            if "function" in str(e) and "does not exist" in str(e):
                logger.error(f"RPC function '{self.query_function}' not found. Did you run the migration?")
            raise

    async def delete_by_id(self, document_id: str) -> bool:
        if not self.client:
            await self.initialize()
            
        try:
            self.client.table(self.collection_name).delete().eq("id", document_id).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e}")
            return False

    async def clear(self) -> None:
        pass
    
    async def get_collection_info(self) -> Dict[str, Any]:
        if not self.client:
            await self.initialize()
            
        try:
            count_response = self.client.table(self.collection_name).select("id", count="exact").execute()
            return {"points_count": count_response.count}
        except Exception as e:
            logger.warning(f"Failed to get collection info: {e}")
            return {"points_count": 0}
