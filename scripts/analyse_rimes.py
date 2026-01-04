#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
from collections import Counter, defaultdict
from typing import List, Tuple

def normalize_word(word: str) -> str:
    """Normalise un mot en retirant la ponctuation et en minusculisant."""
    word = word.lower().strip()
    word = re.sub(r'[^\w\s-]', '', word)
    return word

def get_rhyme_sound(word: str, length: int = 3) -> str:
    """
    Extrait le son de rime d'un mot (simplifié : dernières lettres).
    En français, on peut améliorer avec une phonétisation plus complexe.
    """
    normalized = normalize_word(word)
    if not normalized:
        return ""

    # Retirer les 'e' muets finaux
    if normalized.endswith('e') and len(normalized) > 1:
        normalized = normalized[:-1]

    # Retirer les 's' du pluriel
    if normalized.endswith('s') and len(normalized) > 1:
        normalized = normalized[:-1]

    # Prendre les dernières lettres
    return normalized[-length:] if len(normalized) >= length else normalized

def extract_verses(poem: str) -> List[str]:
    """Extrait les vers d'un poème."""
    # Retirer les métadonnées (date, titre, notes, etc.)
    poem = re.sub(r'^---.*?---', '', poem, flags=re.DOTALL)
    poem = re.sub(r'^\d{4}-\d{2}-\d{2}', '', poem, flags=re.MULTILINE)
    poem = re.sub(r'^lang: [a-z]{2}', '', poem, flags=re.MULTILINE)
    poem = re.sub(r'^## .*$', '', poem, flags=re.MULTILINE)

    # Extraire les vers non vides
    verses = [line.strip() for line in poem.split('\n') if line.strip()]
    return verses

def get_last_word(verse: str) -> str:
    """Récupère le dernier mot significatif d'un vers."""
    words = verse.strip().split()
    if not words:
        return ""

    # Prendre le dernier mot
    last_word = words[-1]
    return normalize_word(last_word)

def analyze_rhymes(filename: str) -> List[Tuple[str, str, int]]:
    """Analyse les rimes dans un fichier de poèmes."""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Séparer les poèmes
    poems = content.split('===')

    # Compter les couples de mots qui riment
    rhyme_pairs = Counter()

    for poem in poems:
        verses = extract_verses(poem)

        if len(verses) < 2:
            continue

        # Pour chaque poème, grouper les vers par son de rime
        verse_rhymes = []
        for verse in verses:
            last_word = get_last_word(verse)
            if last_word:
                rhyme_sound = get_rhyme_sound(last_word)
                verse_rhymes.append((last_word, rhyme_sound))
            else:
                verse_rhymes.append((None, None))

        # Détecter les rimes consécutives (AA) et alternées (ABAB)
        # Rimes consécutives
        for i in range(len(verse_rhymes) - 1):
            word1, sound1 = verse_rhymes[i]
            word2, sound2 = verse_rhymes[i + 1]

            if word1 and word2 and sound1 == sound2 and word1 != word2:
                pair = tuple(sorted([word1, word2]))
                rhyme_pairs[pair] += 1

        # Rimes alternées (ABAB - vers i rime avec vers i+2)
        for i in range(len(verse_rhymes) - 2):
            word1, sound1 = verse_rhymes[i]
            word2, sound2 = verse_rhymes[i + 2]

            if word1 and word2 and sound1 == sound2 and word1 != word2:
                pair = tuple(sorted([word1, word2]))
                rhyme_pairs[pair] += 1

    # Trier par fréquence
    return [(word1, word2, count) for (word1, word2), count in rhyme_pairs.most_common()]

def main():
    filename = '../poemes.txt'

    print("Analyse des rimes dans les poèmes...\n")

    rhyme_pairs = analyze_rhymes(filename)

    print(f"Top 30 des couples de rimes les plus fréquents:\n")
    print(f"{'Mot 1':<20} {'Mot 2':<20} {'Occurrences':>12}")
    print("-" * 54)

    for i, (word1, word2, count) in enumerate(rhyme_pairs[:30], 1):
        print(f"{word1:<20} {word2:<20} {count:>12}")

    print(f"\nTotal de couples de rimes différents: {len(rhyme_pairs)}")

if __name__ == '__main__':
    main()
