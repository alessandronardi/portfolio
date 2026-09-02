#!/usr/bin/env python3
"""
Test Suite di Validazione Automatizzata per Portfolio Alessandro Nardi
Conformità: AGENTS.md (Goal-Driven Execution, exit code 0)
"""

import os
import re
import sys
from html.parser import HTMLParser

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(BASE_DIR, "index.html")
STYLE_PATH = os.path.join(BASE_DIR, "style.css")
SCRIPT_PATH = os.path.join(BASE_DIR, "script.js")
CONFIG_EX_PATH = os.path.join(BASE_DIR, "config.example.js")
GITIGNORE_PATH = os.path.join(BASE_DIR, ".gitignore")
PROFILE_IMG_PATH = os.path.join(BASE_DIR, "profile-ai.png")


class HTMLValidator(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.classes = set()
        self.headings = []
        self.current_tag = None
        self.current_heading_text = ""
        self.meta_properties = {}
        self.meta_names = {}
        self.errors = []

    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        attr_dict = dict(attrs)
        
        if "id" in attr_dict:
            self.ids.add(attr_dict["id"])
            
        if "class" in attr_dict:
            for cls in attr_dict["class"].split():
                self.classes.add(cls)
                
        if tag == "meta":
            if "property" in attr_dict and "content" in attr_dict:
                self.meta_properties[attr_dict["property"]] = attr_dict["content"]
            if "name" in attr_dict and "content" in attr_dict:
                self.meta_names[attr_dict["name"]] = attr_dict["content"]
                
        if tag in ["h1", "h2", "h3"]:
            self.current_heading_text = ""

    def handle_data(self, data):
        if self.current_tag in ["h1", "h2", "h3"]:
            self.current_heading_text += data

    def handle_endtag(self, tag):
        if tag in ["h1", "h2", "h3"]:
            clean_text = self.current_heading_text.strip()
            if clean_text:
                self.headings.append((tag, clean_text))
            self.current_heading_text = ""
        self.current_tag = None


def test_files_exist():
    required_files = [INDEX_PATH, STYLE_PATH, SCRIPT_PATH, CONFIG_EX_PATH, PROFILE_IMG_PATH]
    for fp in required_files:
        assert os.path.exists(fp), f"File mancante: {fp}"
    print("[PASS] Tutti i file richiesti esistono.")


def test_gitignore():
    with open(GITIGNORE_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    assert "config.js" in content, "config.js deve essere presente in .gitignore"
    print("[PASS] .gitignore include 'config.js'.")


def test_html_and_dom_ids():
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        html_content = f.read()

    parser = HTMLValidator()
    parser.feed(html_content)

    # Verifica ID DOM referenziati in script.js
    required_ids = [
        "scrollProgress",
        "typingText",
        "roi",
        "qrCode",
        "chatToggle",
        "chatWindow",
        "chatClose",
        "chatInput",
        "chatSend",
        "chatMessages",
    ]

    for req_id in required_ids:
        assert req_id in parser.ids, f"ID mancante nel DOM: #{req_id}"
    print(f"[PASS] Tutti i {len(required_ids)} selettori DOM per script.js sono presenti in index.html.")

    # Verifica meta Open Graph
    assert "og:title" in parser.meta_properties, "Meta og:title mancante"
    assert "og:description" in parser.meta_properties, "Meta og:description mancante"
    assert "og:image" in parser.meta_properties, "Meta og:image mancante"
    assert "viewport" in parser.meta_names, "Meta viewport mancante"
    print("[PASS] Meta tag SEO e Open Graph presenti e validi.")

    # Verifica foglio di stile e script inclusi
    assert 'href="style.css"' in html_content, "style.css non linkato in index.html"
    assert 'src="script.js"' in html_content, "script.js non linkato in index.html"
    print("[PASS] style.css e script.js correttamente inclusi nel markup.")

    # Verifica Sentence Case sui titoli principali
    # Regola: all'interno del titolo, non devono esserci più parole consecutive con la maiuscola
    # tranne se sono acronimi (AI, HR, LLM) o nomi propri (Alessandro, Nardi).
    print("\nVerifica Sentence Case sulle intestazioni:")
    allowed_uppercased = {"AI", "LLM", "HR", "Alessandro", "Nardi", "Claude,", "ChatGPT", "Gemini", "Gemini).", "Marco,", "Lucia,"}
    for tag, text in parser.headings:
        words = [w for w in text.split() if w]
        # Salta la prima parola (che deve essere maiuscola in sentence case)
        title_cased_words = []
        for w in words[1:]:
            clean_w = re.sub(r'[^a-zA-Z]', '', w)
            if clean_w and clean_w[0].isupper() and clean_w not in allowed_uppercased and not clean_w.isupper():
                title_cased_words.append(clean_w)
        
        assert len(title_cased_words) == 0, f"Violazione Sentence Case in <{tag}> '{text}': parole impropriamente capitalizzate: {title_cased_words}"
        print(f"  [OK] <{tag}>: {text}")
    print("[PASS] Tutte le intestazioni rispettano il vincolo Sentence Case.")


def test_css_classes():
    with open(STYLE_PATH, "r", encoding="utf-8") as f:
        css_content = f.read()

    # Verifica presenza token critici e assenza AI slop (gradienti fucsia/viola generici)
    assert "--bg-base" in css_content, "Token CSS --bg-base mancante"
    assert "--accent-primary" in css_content, "Token CSS --accent-primary mancante"
    assert "#9c7cf4" not in css_content, "Trovato residuo di gradiente viola clichè (#9c7cf4)"
    assert "glitch" not in css_content, "Trovato residuo di animazione glitch datata"
    print("[PASS] style.css è conforme alle direttive anti-slop di AGENTS.md.")


def test_script_logic():
    with open(SCRIPT_PATH, "r", encoding="utf-8") as f:
        js_content = f.read()

    # Verifica fix listener chatClose
    assert "chatClose.addEventListener" in js_content, "Listener click su chatClose assente in script.js"
    assert "IntersectionObserver" in js_content, "IntersectionObserver assente per il calcolo contatori"
    assert "Escape" in js_content, "Gestione chiusura con tasto Escape assente"
    print("[PASS] script.js include il fix di chatClose, IntersectionObserver e chiusura accessibile.")


if __name__ == "__main__":
    try:
        print("=== ESECUZIONE SUITE DI VALIDAZIONE PORTFOLIO ===")
        test_files_exist()
        test_gitignore()
        test_html_and_dom_ids()
        test_css_classes()
        test_script_logic()
        print("\n>>> TUTTI I TEST SONO STATI SUPERATI CON SUCCESSO (EXIT 0) <<<")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAIL] Errore di validazione: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n[FAIL] Eccezione imprevista: {e}", file=sys.stderr)
        sys.exit(1)
