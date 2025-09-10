Raport szybkiej analizy balansu gry
Data: 2025-09-10

Zakres: jedynie statyczna analiza kart zawartych w `src/game/cards.ts` oraz `BASE_DECK`. Żadne symulacje nie zostały uruchomione — tylko zapis obserwacji.

1) Zestawienie szybkich metryk
- Rozmiar `BASE_DECK`: 21 kart.
- Typy: 10 unikalnych minionów (w sumie 17 minionów w decku), 2 zaklęcia (4 karty spell).
- Suma many w decku: ~41; średnia mana ≈ 1.95.
- Liczba kart koszt ≤ 1: ~8 (≈38% talii) — mocna wczesna krzywa.
- Średni ATK miniona ≈ 1.94; średnie HP ≈ 2.82.

2) Istotne keywordy i efekty
- Poisonous: `c_minion_haunted_wailer` (2 kopie) — silne wczesne removaly.
- Shield / Taunt / Rush: obecne w kilku kopiach (moderate presence), nie dominują.
- Deathrattle: tylko `c_minion_exploding_goblin` (1 kopia) — obecnie zadaje 1 dmg do wszystkich wrogów.

3) Wnioski
- Talia jest low‑curve i nastawiona na wczesne tempo (dużo 1‑costów). To uprzywilejowuje agresywny styl gry.
- Poisonous w dwóch kopiach może generować znaczące „swingi” w early; warto obserwować podczas playtestów.
- Brak silnych/powtarzalnych AoE (jedna kopia giełdowego deathrattle o wartości 1) — niskie ryzyko AoE‑dominacji.

4) Rekomendacje bez uruchamiania symulacji
- Jeśli chcesz zachować szybkie tempo, zostawić krzywą. Jeśli balans ma być bardziej kontrolny, rozważyć zmniejszenie liczby tanich kart lub redukcję Poisonous do 1 kopii.
- Dodać telemetryczny logger hitów (liczniki: Deathrattle triggers, Poison triggers, Shield consumes) i uruchomić krótkie symulacje Monte‑Carlo w późniejszym kroku, aby zebrać empiryczne statystyki bez ręcznego playtestu.

5) Następne kroki (opcjonalne)
- a) Dodać prosty logger i uruchomić 1k symulacji losowych (pomiar triggerów i win‑rate).
- b) Przeprowadzić ręczne playtesty UI (dev server) i obserwować swingów early.
- c) Nic więcej — raport zapisany.

Status: raport zapisany do `docs/balance_report.md`. Nie uruchamiałem żadnych symulacji ani testów.
