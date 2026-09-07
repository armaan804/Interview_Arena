"""
Generates a synthetic labeled dataset of mock-interview answers for training
the Answer Confidence/Quality Scorer.

NOTE ON THIS DATASET: This is a synthetically constructed dataset built by
combining answer templates at three quality tiers (WEAK / AVERAGE / GOOD).
It's designed so that the underlying signal (length, structure, keyword
usage, filler words) correlates with the label by construction -- this
makes it suitable for demonstrating a full ML pipeline (feature extraction,
training, evaluation) for a college project, but it is NOT a substitute for
a real dataset of human-labeled interview answers. This limitation should
be mentioned in the project report.
"""

import csv
import random

random.seed(42)

TOPICS = [
    ("What is the time complexity of binary search?",
     "Binary search runs in O(log n) time because it halves the search space at each step."),
    ("Explain how a hash map works.",
     "A hash map uses a hash function to map keys to array indices, giving average O(1) lookup, insert, and delete."),
    ("What is database normalization?",
     "Normalization organizes data to reduce redundancy by splitting tables and enforcing dependencies, typically up to 3NF."),
    ("Describe the event loop in JavaScript.",
     "The event loop processes the call stack, then microtasks like Promises, then macrotasks like setTimeout, enabling non-blocking async behavior."),
    ("Tell me about a time you disagreed with a teammate.",
     "A strong answer describes a specific situation, the disagreement, the action taken to resolve it collaboratively, and a positive result."),
    ("Why do you want to work in product management?",
     "A strong answer connects personal motivation to specific experience with users, data-driven decisions, and cross-functional collaboration."),
    ("How would you estimate the market size for electric scooters in a city?",
     "A strong answer structures the estimate using population, adoption rate, and usage frequency, stating assumptions clearly."),
    ("Describe a challenging bug you fixed.",
     "A strong answer explains the symptom, the debugging process used to isolate the cause, the fix, and what was learned."),
]

FILLER_PHRASES = [
    "um", "uh", "like", "you know", "basically", "actually", "sort of", "kind of", "I guess", "stuff like that"
]

WEAK_TEMPLATES = [
    "I don't really know, maybe {kw}?",
    "Um, it's like, {kw} I think, not sure.",
    "It's basically {kw} stuff, you know.",
    "I guess it has something to do with {kw}.",
    "Not sure, probably {kw} or something like that.",
]

AVERAGE_TEMPLATES = [
    "I think it's related to {kw}. It works by using {kw2} to get the result, but I'm not 100% sure about the details.",
    "From what I remember, {kw} is involved, and it helps with {kw2}. There might be more to it though.",
    "It basically uses {kw} to solve the problem. I've used it before but don't remember every detail about {kw2}.",
    "So {kw} is the main idea here, and it connects to {kw2} in some way, though I'd want to double check the specifics.",
]

GOOD_TEMPLATES = [
    "This works by using {kw}, which enables {kw2}. For example, in a real scenario, this approach ensures efficiency and correctness, and I've applied a similar approach in a past project where {kw2} mattered significantly.",
    "The key idea is {kw}. Specifically, {kw2} is what drives the behavior here. I'd also mention that trade-offs exist, such as when {kw2} becomes a bottleneck, which is worth considering depending on the situation.",
    "To explain clearly: {kw} is the core mechanism, and it relies on {kw2} to function correctly. In practice, I've seen this applied where {kw2} was critical to the outcome, and understanding this helped me make better decisions.",
    "I'd break this down into steps. First, {kw} sets up the foundation. Then {kw2} builds on that to produce the final result. This structured approach has helped me communicate technical ideas clearly in past interviews and at work.",
]

KEYWORDS_POOL = [
    "hashing", "indexing", "recursion", "the call stack", "normalization",
    "time complexity", "the event loop", "data structures", "structured thinking",
    "clear communication", "root cause analysis", "collaboration", "trade-off analysis",
]


def add_filler(text, count):
    words = text.split()
    for _ in range(count):
        pos = random.randint(0, len(words))
        words.insert(pos, random.choice(FILLER_PHRASES))
    return " ".join(words)


def generate_row(question, ideal_answer, label):
    kw = random.choice(KEYWORDS_POOL)
    kw2 = random.choice(KEYWORDS_POOL)

    if label == "WEAK":
        template = random.choice(WEAK_TEMPLATES)
        answer = template.format(kw=kw, kw2=kw2)
        answer = add_filler(answer, random.randint(1, 3))
    elif label == "AVERAGE":
        template = random.choice(AVERAGE_TEMPLATES)
        answer = template.format(kw=kw, kw2=kw2)
        answer = add_filler(answer, random.randint(0, 1))
    else:  # GOOD
        template = random.choice(GOOD_TEMPLATES)
        answer = template.format(kw=kw, kw2=kw2)

    return {
        "questionText": question,
        "idealAnswer": ideal_answer,
        "answerText": answer,
        "qualityLabel": label,
    }


def main():
    rows = []
    labels = ["WEAK", "AVERAGE", "GOOD"]

    # Generate a balanced dataset: ~50 examples per label per a rotation of topics
    for _ in range(50):
        question, ideal_answer = random.choice(TOPICS)
        label = random.choice(labels)
        rows.append(generate_row(question, ideal_answer, label))

    # Ensure a good minimum count per class by topping up
    from collections import Counter
    counts = Counter(r["qualityLabel"] for r in rows)
    for label in labels:
        while counts[label] < 50:
            question, ideal_answer = random.choice(TOPICS)
            rows.append(generate_row(question, ideal_answer, label))
            counts[label] += 1

    random.shuffle(rows)

    with open("data/labeled_answers.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["questionText", "idealAnswer", "answerText", "qualityLabel"]
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} rows -> data/labeled_answers.csv")
    print(f"Label distribution: {dict(Counter(r['qualityLabel'] for r in rows))}")


if __name__ == "__main__":
    main()
