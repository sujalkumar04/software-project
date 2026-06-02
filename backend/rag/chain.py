from langchain_groq import ChatGroq
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from vectorstore.embedder import get_retriever
import os
from dotenv import load_dotenv
load_dotenv()

from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

_chain = None

def get_chain() -> ConversationalRetrievalChain:
    global _chain
    if _chain is not None:
        return _chain

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        output_key="answer"
    )

    system_template = (
        "You are an expert social media content analyst AI assistant.\n"
        "You have access to transcripts, metadata, and engagement data for two videos: Video A and Video B.\n"
        "When answering:\n"
        "- Always cite which video (A or B) and which chunk you are drawing from.\n"
        "- If comparing videos, structure your answer with clear sections for A and B.\n"
        "- Include specific engagement metrics (engagement rate, views, likes, comments) when relevant.\n"
        "- Be concise but complete. No filler sentences.\n"
        "- If the user asks about follower count or creator info, pull it from metadata.\n"
        "- If transcript data is missing, acknowledge it and answer based on metadata only.\n\n"
        "Here is the context to answer the user's question:\n"
        "{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_template),
        HumanMessagePromptTemplate.from_template("{question}")
    ])

    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=get_retriever(),
        memory=memory,
        return_source_documents=True,
        verbose=False,
        combine_docs_chain_kwargs={"prompt": prompt}
    )

    _chain = chain
    return _chain

def ask(question: str, chain) -> dict:
    result = chain({"question": question})
    source_docs = result.get("source_documents", [])
    
    return {
        "answer": result["answer"],
        "sources": [
            {
                "video_id": doc.metadata.get("video_id", ""),
                "chunk_index": doc.metadata.get("chunk_index", 0),
                "title": doc.metadata.get("title", ""),
                "creator": doc.metadata.get("creator", ""),
                "text_snippet": doc.page_content[:150]
            }
            for doc in source_docs
        ]
    }

def reset_chain():
    global _chain
    _chain = None
