
import { GoogleGenAI, Type } from "@google/genai";
import { DocumentKnowledge, DocumentMetadata } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utility to retry API calls that fail due to transient network or proxy errors.
 */
const callWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error?.message?.includes('500') || 
                        error?.message?.includes('UNKNOWN') || 
                        error?.message?.includes('Rpc failed');
    
    if (retries > 0 && isRetryable) {
      console.warn(`Gemini API call failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const extractDocumentMetadata = async (base64Image: string): Promise<DocumentMetadata> => {
  return callWithRetry(async () => {
    const model = "gemini-3-flash-preview";
    const prompt = `This is the first page of an enterprise document. 
    Please extract high-level document information:
    1. The official title of the document.
    2. A concise executive summary (3-4 sentences).
    3. A BRIEF summary (exactly one sentence, max 120 characters) that describes the document's core purpose.
    4. The author or issuing organization (if visible).
    5. The publication or revision date (if visible).
    6. A logical category (e.g., Policy, Technical Manual, Financial Report, Research Paper).
    7. 3-5 key points or objectives mentioned in the document intro.`;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            briefSummary: { type: Type.STRING },
            author: { type: Type.STRING },
            date: { type: Type.STRING },
            category: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "summary", "briefSummary", "category", "keyPoints"]
        }
      }
    });

    return JSON.parse(response.text);
  });
};

export const extractKnowledgeFromPage = async (base64Image: string, pageNumber: number) => {
  return callWithRetry(async () => {
    const model = "gemini-3-flash-preview";
    const prompt = `Analyze this PDF page (Page ${pageNumber}) and extract structured knowledge. 

    1. **Sections**: Identify meaningful sections or chapters.
    
    2. **Tables**: Extract tables into a precise grid format. 
       - **Complex Tables**: For tables with merged cells (rowspan/colspan) or multi-level headers, flatten the structure logically. 
       - **Merged Cell Strategy**: Ensure that data from a merged cell is repeated or logically included in every relevant sub-row or sub-column.
       - **Data Integrity**: Preserve the original text precisely.
       - **Summary**: Provide a detailed summary of the table's contents.

    3. **Visuals**: Detect images, charts, or diagrams. For each one:
       - Provide a clear description of what it shows.
       - CRITICAL: Perform OCR on any text found within the image/chart. 
       - Include this transcribed text in the description field.

    4. **TOC**: Note any Table of Contents items if present on this page.
    
    Be precise and preserve the semantic hierarchy.`;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  chapter: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            tables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
                  summary: { type: Type.STRING }
                },
                required: ["headers", "rows", "summary"]
              }
            },
            images: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  type: { type: Type.STRING }
                },
                required: ["description", "type"]
              }
            },
            toc: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["sections", "tables", "images"]
        }
      }
    });

    return JSON.parse(response.text);
  });
};

export const semanticSearch = async (query: string, knowledgeBase: DocumentKnowledge[]) => {
  return callWithRetry(async () => {
    const model = "gemini-3-flash-preview";
    const context = knowledgeBase.map(doc => ({
      id: doc.id,
      name: doc.fileName,
      metadata: doc.metadata,
      sections: doc.sections.map(s => ({ title: s.title, content: s.content.substring(0, 300) })),
      tables: doc.tables.map(t => ({ summary: t.summary })),
      images: doc.images.map(i => ({ description: i.description }))
    }));

    const prompt = `Given the query "${query}", find the most relevant pieces of information from this knowledge base. 
    Return a list of results with docId, title, a brief snippet, and a confidence score (0-1).
    Context: ${JSON.stringify(context)}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              docId: { type: Type.STRING },
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              snippet: { type: Type.STRING },
              score: { type: Type.NUMBER },
              pageNumber: { type: Type.NUMBER }
            },
            required: ["docId", "title", "snippet", "score"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  });
};
