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

- Play a fixed number of games (`gamesPerLevel`) against Stockfish at each level.  
- Record wins, losses, and draws for the AI.  
- Compute the score per level:

$$
\text{score} = \frac{wins + 0.5 \cdot draws}{total\_games} \times 100
$$

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

- Initialize:  

$$
low = 0, \quad high = n - 1
$$

- Repeat:  

$$
mid = \left\lfloor \frac{low + high}{2} \right\rfloor
$$

- Play games at level `mid` and compute score as above.  

Decision rules:

- If score > 0.55 → AI stronger → `low = mid + 1`  
- If score < 0.45 → AI weaker → `high = mid - 1`  
- Stop if score ∈ [0.45, 0.55] or confidence threshold reached  

This reduces required levels from all 8 to roughly:

$$
\log_2 8 \approx 3\text{–}4
$$

---

## Step 2: Bayesian ELO Estimation

### Model

For Stockfish level $i$ with ELO $L_i$, the probability the AI wins at ELO $E$ is:

$$
p_i(E) = \frac{1}{1 + 10^{(L_i - E)/400}}
$$

Observed score at level $i$:

$$
score_i = \frac{wins + 0.5 \cdot draws}{games}
$$

Likelihood contribution:

$$
L_i(E) = p_i(E)^{score_i} \cdot (1 - p_i(E))^{1 - score_i}
$$

Log-likelihood over all levels:

$$
\log L(E) = \sum_i \log L_i(E)
$$

---

## Step 3: Maximum Likelihood Estimate (MLE)

Evaluate log-likelihood over a grid (e.g., 800–2600):

$$
\hat{E} = \arg\max_E \log L(E)
$$

---

## Step 4: Confidence Curve

Plausible ELO values satisfy:

$$
\{ E : \log L(E) \ge \log L_{max} - 2 \}
$$

- Peak → most probable ELO  
- Width → confidence interval  

**Confidence curve (insert image here):**

> _![Confidence curve placeholder](image-here)_

---

## Step 5: Parallelization & Early Stopping

- Multiple levels tested in parallel (`maxParallel`)  
- Early stopping triggered when confidence is high (based on variance or likelihood width)  

---

## Step 6: Integration in Arena

The UI displays:

- Progress bar with `currentLevel` and % progress  
- Scores per level  
- Final ELO estimate + confidence interval  
- Bayesian confidence curve visualization  

---

## Mathematical Summary

| Concept | Formula |
|--------|--------|
| Win probability (logistic) | $$p_i(E) = \frac{1}{1 + 10^{(L_i - E)/400}}$$ |
| Score per level | $$score_i = \frac{wins + 0.5 \cdot draws}{games}$$ |
| Likelihood per level | $$L_i(E) = p_i(E)^{score_i} \cdot (1 - p_i(E))^{1 - score_i}$$ |
| Log-likelihood | $$\log L(E) = \sum_i \log L_i(E)$$ |
| Maximum likelihood ELO | $$\hat{E} = \arg\max_E \log L(E)$$ |
| Plausible ELO range | $$\{ E : \log L(E) \ge \log L_{max} - 2 \}$$ |
| Confidence (variance) | $$\sigma = \frac{1}{N} \sum_i (score_i - \bar{score})^2$$ |

---

## Advantages

- **Efficient** — binary search + parallelization reduces games  
- **Principled** — logistic probability model  
- **Bayesian** — produces confidence curves & uncertainty intervals  
- **Flexible** — supports LLM agents, Stockfish, configurable games  
- **User-friendly** — live match previews & estimation dashboard  

---

## References

- Elo, A. E. (1978). *The Rating of Chessplayers, Past and Present*  
- Glickman, M. E. (1995). *A Comprehensive Guide to Chess Ratings*  
- Logistic ELO model:  

$$
P(win) = \frac{1}{1 + 10^{\Delta E / 400}}
$$
