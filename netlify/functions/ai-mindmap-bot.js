"""
text_to_mindmap.py
Pipeline: Văn bản dài -> Tóm tắt extractive (TextRank) -> Mindmap graph -> JSON + PNG
"""

import re
import json
import math
from collections import defaultdict

import nltk
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import networkx as nx
import matplotlib.pyplot as plt

# Nếu lần đầu dùng NLTK
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords

STOPWORDS = set(stopwords.words('english'))  # nếu văn bản tiếng Việt đổi bộ stopwords

def clean_sentence(sent):
    sent = sent.strip()
    sent = re.sub(r'\s+', ' ', sent)
    return sent

def sentence_similarity(sent1, sent2, vectorizer=None):
    # TF-IDF cosine similarity
    if vectorizer is None:
        vectorizer = TfidfVectorizer().fit([sent1, sent2])
    tfidf = vectorizer.transform([sent1, sent2])
    v1 = tfidf.toarray()[0]
    v2 = tfidf.toarray()[1]
    denom = (np.linalg.norm(v1) * np.linalg.norm(v2))
    if denom == 0:
        return 0.0
    return float(np.dot(v1, v2) / denom)

def build_similarity_matrix(sentences):
    n = len(sentences)
    vectorizer = TfidfVectorizer(stop_words='english')  # change language if needed
    vectorizer.fit(sentences)
    tfidf = vectorizer.transform(sentences).toarray()
    sim_matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i == j:
                sim_matrix[i][j] = 0
            else:
                v1 = tfidf[i]
                v2 = tfidf[j]
                denom = (np.linalg.norm(v1) * np.linalg.norm(v2))
                sim_matrix[i][j] = 0.0 if denom == 0 else float(np.dot(v1, v2) / denom)
    return sim_matrix

def textrank_sentences(sentences, top_k=5, d=0.85, max_iter=100, tol=1e-6):
    """
    Simple TextRank implementation using similarity matrix + PageRank
    Returns indices of top_k sentences (by rank) in original order.
    """
    sim_matrix = build_similarity_matrix(sentences)
    nx_graph = nx.from_numpy_array(sim_matrix)
    scores = nx.pagerank(nx_graph, alpha=d, max_iter=max_iter, tol=tol)
    ranked = sorted(((scores[i], i) for i in scores), reverse=True)
    top_indices = [idx for (_, idx) in ranked[:top_k]]
    # Return in original order for readability
    top_indices_sorted = sorted(top_indices)
    return top_indices_sorted

def extract_keyphrases_by_tfidf(sentences, top_n=10):
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1,2))
    X = vectorizer.fit_transform(sentences)
    scores = np.asarray(X.sum(axis=0)).ravel()
    terms = vectorizer.get_feature_names_out()
    idx_sorted = np.argsort(scores)[::-1]
    keyphrases = [terms[i] for i in idx_sorted[:top_n]]
    return keyphrases

def summarize_text(text, summary_sent_count=5):
    # Tokenize sentences
    sents = sent_tokenize(text)
    sents = [clean_sentence(s) for s in sents if len(s.strip()) > 0]
    if len(sents) <= summary_sent_count:
        return sents
    top_idx = textrank_sentences(sents, top_k=summary_sent_count)
    summary = [sents[i] for i in top_idx]
    return summary

def build_mindmap_graph(summary_sentences, keyphrases=None):
    """
    Create a graph: root -> main idea nodes -> sub-nodes
    Heuristic:
    - Root node is "Central Idea"
    - Each summary sentence becomes a main node (shortened)
    - Keyphrases link as subnodes if they appear in sentence
    """
    G = nx.DiGraph()
    root = "Central Idea"
    G.add_node(root, type='root')

    # Create main nodes from sentences (truncate to 12 words)
    def short_label(sent, max_words=12):
        words = sent.split()
        if len(words) <= max_words:
            return sent
        return ' '.join(words[:max_words]) + '...'

    for i, s in enumerate(summary_sentences):
        label = f"Main {i+1}: {short_label(s)}"
        G.add_node(label, type='main', sentence=s)
        G.add_edge(root, label)

    # Add keyphrase nodes and connect to mains where phrase appears
    if keyphrases:
        for kp in keyphrases:
            kp_node = f"KP: {kp}"
            G.add_node(kp_node, type='keyphrase')
            # connect to any main node that contains the phrase tokens
            kp_tokens = set(kp.lower().split())
            connected = False
            for main in [n for n,d in G.nodes(data=True) if d.get('type')=='main']:
                sent = G.nodes[main]['sentence'].lower()
                # simple match
                if all(t in sent for t in kp_tokens):
                    G.add_edge(main, kp_node)
                    connected = True
            if not connected:
                # attach to root if not matched
                G.add_edge(root, kp_node)

    return G

def save_graph_png(G, path='mindmap.png', figsize=(10,8)):
    plt.figure(figsize=figsize)
    pos = nx.spring_layout(G, k=0.8, seed=42)  # force-directed layout
    node_types = nx.get_node_attributes(G, 'type')
    # draw nodes (colors chosen automatically by matplotlib defaults)
    nx.draw_networkx_nodes(G, pos, node_size=1200)
    nx.draw_networkx_edges(G, pos, arrows=True)
    labels = {n: n for n in G.nodes()}
    nx.draw_networkx_labels(G, pos, labels=labels, font_size=8)
    plt.axis('off')
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()
    return path

def graph_to_json(G):
    nodes = []
    edges = []
    for n,d in G.nodes(data=True):
        nodes.append({'id': n, 'type': d.get('type','')})
    for u,v in G.edges():
        edges.append({'source': u, 'target': v})
    return {'nodes': nodes, 'edges': edges}

# ---- Example usage ----
if __name__ == "__main__":
    sample_text = """
    (Thay sample này bằng văn bản dài của bạn.)
    Natural language processing (NLP) is a subfield of linguistics, computer science,
    and artificial intelligence concerned with the interactions between computers and human language,
    in particular how to program computers to process and analyze large amounts of natural language data.
    The result is a computer capable of "understanding" the contents of documents, including the contextual
    nuances of the language within them. The technology can then accurately extract information and insights
    contained in the documents as well as categorize and organize the documents themselves.
    """
    # 1) Summarize (extractive)
    summary = summarize_text(sample_text, summary_sent_count=3)
    print("=== Summary Sentences ===")
    for s in summary:
        print("-", s)

    # 2) Extract keyphrases
    keyphrases = extract_keyphrases_by_tfidf(summary, top_n=8)
    print("\n=== Keyphrases ===")
    print(keyphrases)

    # 3) Build mindmap graph
    G = build_mindmap_graph(summary, keyphrases=keyphrases)

    # 4) Save PNG and JSON
    png_path = save_graph_png(G, path='mindmap.png')
    graph_json = graph_to_json(G)
    with open('mindmap.json', 'w', encoding='utf-8') as f:
        json.dump(graph_json, f, ensure_ascii=False, indent=2)

    print(f"\nSaved graph image: {png_path}")
    print("Saved graph JSON: mindmap.json")
