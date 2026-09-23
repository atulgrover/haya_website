# Chapter 22: Algorithmic Scoring & Multi-Vector Normalization

> *“saṅkhyānaṁ sarva-vidyānāṁ mukham |*  
> *gaṇitaṁ ca vinā na kiñcid api siddhyati ||”*  
> — **Aryabhatiya Commentary**  
> *(Mathematical computation is the crown of all sciences; without rigorous calculation, no systematic knowledge reaches perfection.)*

---

## 1. Introduction: The Mathematical Engine of HPTI

In the HPTI evaluation pipeline, qualitative responses to situational judgment questions are not simply summed into crude binary buckets. Human consciousness operates as a **continuous, multidimensional vector field**.

When a user completes an assessment, their choices are passed through a multi-stage scoring algorithm that:
1. Accumulates raw dimensional weights into four distinct sub-vectors.
2. Normalizes each sub-vector into percentage distributions summing to $100\%$.
3. Computes the **Euclidean Distance** between the user's normalized vector and the **144 ideal archetypal centroids**.
4. Outputs the dominant **4-token ECCP Code**, calculates a **Confidence Index**, and renders live vector distribution meters.

In this chapter, we formally document the mathematical formulas, weighting matrices, and normalization algorithms that power the HPTI scoring engine.

---

## 2. Mathematical Formalization of the ECCP Vector Space

Let the total psychological profile of an individual be represented as a composite vector $\mathbf{\Psi} \in \mathbb{R}^{14}$, composed of four orthogonal sub-spaces:

$$\mathbf{\Psi} = \left[ \mathbf{v}_{\text{Energy}} \,\|\, \mathbf{v}_{\text{Cognition}} \,\|\, \mathbf{v}_{\text{Competency}} \,\|\, \mathbf{v}_{\text{Purpose}} \right]$$

```
1. Energy Sub-Space (Triguna):      v_E = [ S,  R,  T ]         (3 Dimensions)
2. Cognition Sub-Space (Antahkarana):v_C = [ BM, MM, AM ]       (3 Dimensions)
3. Competency Sub-Space (Varna):    v_V = [ B,  K,  V,  S ]     (4 Dimensions)
4. Purpose Sub-Space (Purushartha): v_P = [ D,  A,  K,  M ]     (4 Dimensions)
──────────────────────────────────────────────────────────────────────────────
Total Feature Dimensions: 3 + 3 + 4 + 4 = 14 Dimensions
```

---

## 3. Vector Accumulation & Normalization Equations

### 3.1 Raw Score Accumulation
Every option $k$ in scenario $i$ carries a defined multidimensional weight vector $\mathbf{w}_{i,k}$. As the user selects options, raw dimensional points accumulate:

$$\mathbf{S}_{\text{raw}} = \sum_{i=1}^{N} \mathbf{w}_{i, \text{selected}}$$

### 3.2 Sub-Vector Normalization
To render results comparable regardless of the number of answered scenarios (e.g., 9 questions vs. 54 questions), each sub-vector is independently normalized to a unit simplex ($\sum = 100\%$):

#### 1. Triguna Energy Normalization
$$P_S = \frac{S}{S + R + T} \times 100\%, \quad P_R = \frac{R}{S + R + T} \times 100\%, \quad P_T = 100\% - (P_S + P_R)$$

#### 2. Antahkarana Cognition Normalization
$$P_{BM} = \frac{BM}{BM + MM + AM} \times 100\%, \quad P_{MM} = \frac{MM}{BM + MM + AM} \times 100\%, \quad P_{AM} = 100\% - (P_{BM} + P_{MM})$$

#### 3. Varna-Swabhava Competency Normalization
$$\text{Total}_V = B + K + V + S$$
$$P_B = \frac{B}{\text{Total}_V} \times 100\%, \quad P_K = \frac{K}{\text{Total}_V} \times 100\%, \quad P_V = \frac{V}{\text{Total}_V} \times 100\%, \quad P_S = 100\% - (P_B + P_K + P_V)$$

#### 4. Purushartha Purpose Normalization
$$\text{Total}_P = D + A + K + M$$
$$P_D = \frac{D}{\text{Total}_P} \times 100\%, \quad P_A = \frac{A}{\text{Total}_P} \times 100\%, \quad P_K = \frac{K}{\text{Total}_P} \times 100\%, \quad P_M = 100\% - (P_D + P_A + P_K)$$

---

## 4. Nearest-Centroid Archetype Resolution

To match the user’s continuous normalized vector $\mathbf{\Psi}_{\text{user}}$ to the most resonant archetype among the 144 pre-calibrated Epic reference centroids $\{\mathbf{A}_1, \mathbf{A}_2, \dots, \mathbf{A}_{144}\}$, the algorithm computes the **Weighted Euclidean Distance ($d_j$)**:

$$d_j = \sqrt{ \sum_{k=1}^{14} \omega_k \left( \psi_k^{\text{user}} - A_{j,k} \right)^2 }$$

where $\omega_k$ represents the dimensional importance weights:
- $\omega_{\text{Energy}} = 1.0$
- $\omega_{\text{Cognition}} = 1.2$
- $\omega_{\text{Competency}} = 1.5$ *(Highest vocational weighting)*
- $\omega_{\text{Purpose}} = 1.3$

The matched archetype $\mathbf{A}^*$ is the centroid that minimizes distance:
$$\mathbf{A}^* = \arg\min_{j \in \{1 \dots 144\}} d_j$$

---

## 5. Confidence Index & Ambiguity Detection

When an individual has an evenly split profile (e.g., $P_B = 26\%, P_K = 25\%, P_V = 25\%, P_S = 24\%$), declaring a definitive type without a confidence qualification is irresponsible.

The HPTI engine calculates a **Marginal Confidence Score ($C$)**:

$$C = \frac{d_{(2)} - d_{(1)}}{d_{(2)}} \times 100\%$$

where $d_{(1)}$ is the distance to the closest centroid and $d_{(2)}$ is the distance to the second-closest centroid:
- **$C \ge 25\%$**: High Confidence (Crisp, definitive archetype match).
- **$12\% \le C < 25\%$**: Moderate Confidence (Balanced profile with strong secondary resonance).
- **$C < 12\%$**: Transitional / High Ambiguity. The engine triggers an optional **3-Scenario Tiebreaker Battery** to resolve the boundary.

---

## 6. Live Rendering Engine for Portal Gauges

On the client side (`personalities.html`), the normalized percentages update dynamically in real time as the user clicks each radio button. 

The DOM manipulation algorithm binds directly to the normalized vector:

```javascript
function updateLiveMeters() {
  const gTot = s + r + t;
  const sPct = Math.round((s / gTot) * 100);
  const rPct = Math.round((r / gTot) * 100);
  const tPct = 100 - sPct - rPct;

  document.getElementById('barSattva').style.width = `${sPct}%`;
  document.getElementById('barRajas').style.width = `${rPct}%`;
  document.getElementById('barTamas').style.width = `${tPct}%`;
  document.getElementById('meterGunaText').innerText = `S: ${sPct}% | R: ${rPct}% | T: ${tPct}%`;
}
```

This live feedback loop provides immediate visual confirmation of how each choice shifts the energetic and cognitive equilibrium of the user's mind.

In the next chapter, we inspect the client-server architecture: **Chapter 23: Sovereign Local-First Software Architecture**.
