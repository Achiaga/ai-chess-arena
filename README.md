# AI Chess Arena — ELO Estimation System

## Overview

This module estimates the ELO rating of an AI chess engine (LLM or custom agent) by simulating games against Stockfish at different difficulty levels. The goal is to automatically determine the AI’s skill level (with a confidence interval) and optionally produce a Bayesian confidence curve showing the most likely ELO values.

The system evolved in three phases:

1. Naive sequential estimation
2. Binary search with early stopping
3. Bayesian ELO estimation with confidence curves

---

## 1. Initial Approach: Sequential Estimation

The first implementation was a linear scan:

- Play a fixed number of games (`gamesPerLevel`) against Stockfish at each level in `STOCKFISH_ELO_LEVELS`.
- Record wins, losses, and draws for the AI.
- Compute the score per level:

\[
\text{score}=\frac{\text{wins}+0.5\cdot \text{draws}}{\text{total games}}\times 100
\]

- Select the level where performance is closest to 50%.
- Interpolate between levels if necessary.

### Problems

- Inefficient — every level was tested sequentially
- No principled confidence estimate
- No statistical uncertainty model

---

## 2. Selected Approach: Binary Search + Bayesian Refinement

The final system combines binary search for efficiency with a Bayesian logistic model for accurate ELO estimation and uncertainty quantification.

### Step 1: Binary Search Across Stockfish Levels

- Initialize  
  \[
  \text{low}=0,\quad \text{high}=n-1
  \]
- Repeat  
  \[
  \text{mid}=\left\lfloor\frac{\text{low}+\text{high}}{2}\right\rfloor
  \]

- Play games at level **mid** and compute score as before.

Decision rules:

- If score > 55% → AI stronger → search higher (`low = mid + 1`)
- If score < 45% → AI weaker → search lower (`high = mid - 1`)
- Stop if score ∈ [45%, 55%] or confidence threshold reached

This reduces required levels from all 8 to roughly:

\[
\log_2(8)\approx 3\text{–}4
\]

---

## Step 2: Bayesian ELO Estimation

### Model

For Stockfish level \(i\) with ELO \(L_i\), the probability the AI wins at ELO \(E\) is:

\[
p_i(E)=\frac{1}{1+10^{(L_i-E)/400}}
\]

For observed score \( \text{score}\_i \in [0,1]\):

\[
L_i(E)=p_i(E)^{\text{score}\_i}\,\bigl(1-p_i(E)\bigr)^{(1-\text{score}\_i)}
\]

**Log-likelihood over all tested levels:**

\[
\log L(E)=\sum_i \log L_i(E)
\]

---

## Step 3: Maximum Likelihood Estimate (MLE)

Evaluate \(\log L(E)\) over a grid (e.g., 800–2600, step 10):

\[
\hat{E}=\arg\max_E \log L(E)
\]

---

## Step 4: Confidence Curve

Compute likelihood over a broad ELO range and apply a likelihood-drop rule:

\[
\{E : \log L(E)\ge \log L\_{\max}-2\}
\]

- Peak → most probable ELO
- Width → confidence interval

**Confidence curve (insert image here):**

> _![Confidence curve placeholder](image-here)_

---

## Step 5: Parallelization & Early Stopping

- Multiple levels tested in parallel (`maxParallel`)
- Early stopping when confidence is high (based on variance or likelihood width)

---

## Step 6: Integration in Arena

The UI displays:

- Progress bar with `currentLevel` and % progress
- Scores per level
- Final ELO estimate + confidence interval
- Bayesian confidence curve visualization

---

## Mathematical Summary

| Concept                         | Formula                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| **Win probability (logistic)**  | \(\displaystyle p_i(E)=\frac{1}{1+10^{(L_i-E)/400}}\)                                    |
| **Score per level**             | \(\displaystyle \text{score}\_i=\frac{\text{wins}+0.5\cdot \text{draws}}{\text{games}}\) |
| **Likelihood per level**        | \(\displaystyle L_i(E)=p_i(E)^{\text{score}\_i}(1-p_i(E))^{(1-\text{score}\_i)}\)        |
| **Log-likelihood**              | \(\displaystyle \log L(E)=\sum_i \log L_i(E)\)                                           |
| **Maximum likelihood ELO**      | \(\displaystyle \hat{E}=\arg\max_E \log L(E)\)                                           |
| **Plausible ELO range**         | \(\displaystyle \{E:\log L(E)\ge \log L\_{\max}-2\}\)                                    |
| **Confidence (score variance)** | \(\displaystyle \sigma=\frac{1}{N}\sum_i(\text{score}\_i-\bar{\text{score}})^2\)         |

---

## Advantages

- **Efficient** — binary search + parallelization minimizes games
- **Principled** — logistic probability model
- **Bayesian** — produces confidence curves & uncertainty intervals
- **Flexible** — supports LLM agents, Stockfish, configurable games
- **User-friendly** — live match previews & estimation dashboard

---

## References

- Elo, A. E. (1978). _The Rating of Chessplayers, Past and Present_.
- Glickman, M. E. (1995). _A Comprehensive Guide to Chess Ratings_.
- Logistic ELO model:  
  \[
  P(\text{win})=\frac{1}{1+10^{\Delta E/400}}
  \]
