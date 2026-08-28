## 1. Problem Statement

Restaurants, cafeterias, hotels, and institutional kitchens frequently prepare or purchase more food than they actually need. Traditional systems mainly record food waste **after it has already happened**, using manual logs or spreadsheets.

This creates three major problems:

- **Overproduction:** More food is prepared than customers consume.
- **Over-purchasing:** Ingredients are purchased based on rough estimates rather than actual consumption patterns.
- **Spoilage:** Ingredients remain unused until they expire.

Although kitchens may have sales, inventory, and waste data, these datasets are usually disconnected. Managers therefore lack a system that can answer:

> **"What food is likely to become waste, why will it happen, and what should I change before it happens?"**
> 

### Core problem QULIN solves

> **QULIN predicts potential food waste using operational data and provides actionable recommendations to prevent it.**
> 

---

# 2. Abstract

### **QULIN Organization — AI-Powered Food Waste Prevention System**

Food waste is a significant operational, economic, and environmental challenge for restaurants and commercial kitchens. Existing waste-management systems primarily focus on recording and analyzing waste after it occurs, providing limited support for preventing future waste.

**QULIN Organization** is an AI-powered food waste prevention platform designed for restaurants, cafeterias, hotels, and institutional kitchens. The system combines **food preparation, sales/consumption, inventory, purchasing, and historical waste data** to identify patterns and predict potential food waste.

The system generates a **Waste Risk Score** for food items and operational activities. Based on factors such as historical demand, preparation quantity, consumption patterns, inventory levels, and expiry information, QULIN predicts whether a food item is likely to be wasted.

Instead of merely reporting waste, QULIN provides **actionable recommendations**, such as reducing preparation quantities, adjusting future purchases, prioritizing ingredients nearing expiry, or modifying production based on predicted demand.

The system also records the outcome of each recommendation, allowing the platform to compare **predicted waste with actual waste** and progressively improve its recommendations.

Thus, QULIN follows a closed-loop approach:

> **Measure → Predict → Recommend → Act → Measure Impact**
> 

The ultimate objective is to reduce avoidable food waste while simultaneously reducing operational costs and improving kitchen efficiency.

---

# 3. Solution

QULIN works as an **AI decision-support system** for kitchen managers.

Instead of:

```
Food prepared
      ↓
Food wasted
      ↓
Manager records waste
      ↓
Report
```

QULIN changes the workflow to:

```
Historical data
      ↓
AI analyzes patterns
      ↓
Predict future waste
      ↓
Identify probable cause
      ↓
Recommend preventive action
      ↓
Manager acts
      ↓
Actual result recorded
      ↓
Measure waste reduction
```

### Example

Suppose a cafeteria normally prepares:

**500 portions of rice**

Historical data shows:

```
Average Friday demand = 430 portions
Average Friday waste = 65 portions
```

QULIN detects this pattern.

It predicts:

> 🔴 **High waste risk**
> 

And recommends:

> **Prepare approximately 450 portions for the next Friday lunch.**
> 

After the meal:

```
Prepared = 450
Consumed = 435
Waste = 15
```

QULIN can then measure the improvement.

That's the central intelligence of the system.

---

# 4. Core Features

## A. Food & Inventory Management

The organization can manage:

- Ingredients
- Quantity
- Purchase date
- Expiry date
- Cost
- Current stock

Example:

```
Rice
Current stock: 80 kg
Cost: ₹55/kg
```

---

## B. Production Tracking

Record how much food was prepared.

```
Date: 28-Aug
Meal: Lunch

Rice       50 kg
Chicken    30 kg
Vegetables 20 kg
```

---

## C. Consumption/Sales Tracking

Record how much was actually consumed/sold.

```
Rice       44 kg
Chicken    27 kg
Vegetables 18 kg
```

QULIN calculates:

```
Waste = Prepared - Consumed
```

---

## D. Waste Tracking

Record the amount and reason for waste.

```
Food: Rice
Quantity: 6 kg

Reason:
• Overproduction
• Spoilage
• Preparation waste
• Plate waste
• Damaged
```

This allows QULIN to identify **why waste is occurring**.

---

# 5. AI Features

This is where QULIN becomes different from a normal inventory application.

## ① Demand Prediction

Predict how much food will be required.

Inputs:

```
Historical sales
Day of week
Meal
Previous consumption
Customer count
Menu
Holiday/event
```

Output:

```
Expected demand: 435 portions
```

---

## ② Waste Risk Prediction

Calculate the probability that food will become waste.

Example:

```
Rice

Waste Risk: 82% 🔴
```

Possible contributing factors:

```
High preparation quantity
+
Low historical demand
+
High previous waste
```

---

## ③ Root Cause Identification

Instead of just:

> "Rice waste is high."
> 

QULIN tries to identify:

> **"Why?"**
> 

Example:

```
Rice waste increased by 31%.

Likely cause:
Overproduction

Evidence:
Friday preparation remained constant
while customer demand decreased.
```

---

## ④ AI Recommendation

The system converts prediction into an action.

Example:

> **Recommendation**
> 
> 
> Reduce Friday rice preparation by approximately 10%.
> 

Other recommendations could include:

- Reduce preparation quantity
- Delay purchasing
- Reduce purchase quantity
- Prioritize ingredients nearing expiry
- Use existing inventory before purchasing more

---

# 6. Impact Measurement

This feature is **very important**.

QULIN should not simply claim:

> "AI reduced food waste."
> 

It should actually measure it.

### Before intervention

```
Prepared: 500
Consumed: 430
Waste: 70
```

### After recommendation

```
Prepared: 450
Consumed: 435
Waste: 15
```

Then:

```
Waste reduction =
(70 - 15) / 70 × 100

= 78.6%
```

The system can track:

### Organization Impact Dashboard

```
Food waste ↓ 18%
Food waste cost ↓ 15%
Overproduction ↓ 21%
Food diverted from waste ↑ 12%
```

**Actual values will come from your pilot data; don't promise a specific reduction beforehand.**

---

# 7. Feedback / Learning

This is what I would make one of QULIN's strongest features.

After making a recommendation:

```
QULIN:
"Prepare 450 portions tomorrow."

        ↓

Manager accepts recommendation

        ↓

Actual preparation = 450
Actual consumption = 435
Actual waste = 15
```

QULIN records:

```
Prediction
Recommendation
Actual result
```

Over time:

```
Historical data
      ↓
Prediction
      ↓
Recommendation
      ↓
Actual outcome
      ↓
New training data
      ↓
Improved prediction
```

So QULIN becomes **adaptive to each organization** rather than relying entirely on generic assumptions.

---

# 8. What exactly are we implementing?

For your actual project, I recommend implementing these **8 components**:

### 1. Organization Management

```
Restaurant/Cafeteria
    ↓
Branches
    ↓
Kitchen
    ↓
Users/Managers
```

### 2. Inventory Management

```
Ingredients
Purchases
Current stock
Expiry
Cost
```

### 3. Production Management

```
Food prepared
Date
Meal
Quantity
```

### 4. Consumption/Sales

```
Food consumed/sold
Customer count
Date
Meal
```

### 5. Waste Management

```
Food wasted
Quantity
Reason
Cost
```

### 6. AI Prediction Engine

```
Demand prediction
Waste-risk prediction
Expiry-risk prediction
```

### 7. Recommendation Engine

```
Prediction
   ↓
Cause
   ↓
Recommended action
```

### 8. Impact Dashboard

```
Waste reduction
Cost savings
Waste trends
Prediction accuracy
Recommendations followed
Waste prevented
```

---

# 9. Complete Workflow

This is the workflow I would put directly into your project documentation.

```
             ┌─────────────────────┐
             │   Kitchen Manager   │
             └──────────┬──────────┘
                        ↓
             Enter operational data
                        ↓
        ┌───────────────┼────────────────┐
        ↓               ↓                ↓
    Inventory       Production       Consumption
        │               │                │
        └───────────────┼────────────────┘
                        ↓
                 Historical Data
                        ↓
                 ┌─────────────┐
                 │  AI Engine  │
                 └──────┬──────┘
                        ↓
              ┌─────────┴─────────┐
              ↓                   ↓
       Demand Prediction      Waste Risk
              ↓                   ↓
              └─────────┬─────────┘
                        ↓
                  Root Cause
                    Analysis
                        ↓
               Recommendation
                        ↓
                 Manager Action
                        ↓
                 Actual Outcome
                        ↓
                Impact Measurement
                        ↓
                Feedback / Learning
```

---

# 10. Technology Stack

Since you're already comfortable with MERN and Python, don't change your stack unnecessarily.

```
Frontend
React + TypeScript
        ↓
Backend
Node.js + Express
        ↓
Database
MongoDB
        ↓
AI Service
Python + FastAPI
        ↓
ML
Scikit-learn / XGBoost
```

For visualization:

```
Chart.js / Recharts
```

Authentication:

```
JWT
```

---

# 11. What the final QULIN Organization dashboard should answer

When a manager opens QULIN, they should immediately see:

### **1. What is being wasted?**

```
Rice        18 kg
Vegetables  12 kg
Bread        8 kg
```

### **2. Why is it being wasted?**

```
Overproduction     45%
Spoilage            25%
Preparation         15%
Plate waste         15%
```

### **3. What will probably be wasted next?**

```
Rice       🔴 82%
Spinach    🔴 76%
Bread      🟠 61%
Chicken    🟢 18%
```

### **4. What should I do?**

```
1. Reduce Friday rice preparation by 10%.
2. Use 8 kg spinach before purchasing more.
3. Delay bread purchase by 2 days.
```

### **5. Did QULIN actually help?**

```
Waste ↓ 17%
Waste cost ↓ 14%
Overproduction ↓ 22%
```

That's the entire product in one screen.

---

# 12. What we are NOT implementing

To keep this project **narrow and achievable**, don't include these in the first version:

❌ Hardware

❌ Smart bins

❌ Computer vision

❌ IoT

❌ Nutrition analysis

❌ Allergen detection

❌ General-purpose chatbot

❌ Complex food-delivery system

❌ Social features

❌ Huge recipe marketplace

You can integrate your existing donation functionality later, but it should **not distract from the core AI problem**.

---

# 13. The final project architecture

```
                         QULIN
                    ORGANIZATION
                          │
          ┌───────────────┴───────────────┐
          │                               │
     DATA COLLECTION                  USER ACTION
          │                               ↑
          ↓                               │
 ┌────────────────────┐                   │
 │ Inventory          │                   │
 │ Production         │                   │
 │ Consumption/Sales  │                   │
 │ Waste              │                   │
 │ Purchases          │                   │
 └─────────┬──────────┘                   │
           ↓                              │
     ┌─────────────┐                      │
     │  AI ENGINE  │                      │
     └──────┬──────┘                      │
            │                             │
     ┌──────┼─────────┐                   │
     ↓      ↓         ↓                   │
  Demand  Waste     Expiry                │
  Model   Model      Risk                 │
     │      │         │                   │
     └──────┼─────────┘                   │
            ↓                             │
      Root Cause Analysis                 │
            ↓                             │
      Recommendation Engine ──────────────┘
            │
            ↓
       Actual Outcome
            │
            ↓
      Impact Measurement
            │
            ↓
       Model Feedback
```

## The one-line identity of QULIN Organization

> **QULIN Organization is an AI-powered food waste prevention platform that uses restaurant operational data to predict waste, identify its causes, and recommend actions that prevent it before it occurs.**
> 

That is the version I would **start developing now**. It is narrow enough to finish, but the **prediction → intervention → outcome → learning** loop gives it enough depth to be a serious AI project rather than another CRUD inventory application.




I want to implement the project described above 

I have a **2-member development team**. Create a complete, practical implementation roadmap from **absolute scratch to final working implementation**, including model training, integration, testing, and deployment.

we are using VS Code 

## 1. First: Analyze the Project

Before giving the implementation plan:

* Carefully analyze the provided PDF(s)/project documentation.
* Understand the complete proposed architecture.
* Identify:

  * Problem statement
  * Objectives
  * Functional requirements
  * Non-functional requirements
  * System architecture
  * Hardware components
  * Software components
  * Dataset requirements
  * Machine-learning/deep-learning models required
  * APIs/interfaces
  * Communication protocols
  * Input/output flow
  * Expected final outcome
* Do **not** assume technologies or components that are not mentioned in the project documentation unless they are genuinely required for implementation.

First provide a concise **"Project Understanding"** section so I can verify that you understood the project correctly.

---

# 2. Strict Technology Stack

The project documentation specifies a particular technical stack.

### Important rule:

**STRICTLY use the technologies, frameworks, programming languages, hardware, models, protocols, and tools mentioned in the project documentation.**

Do NOT replace a specified technology with an alternative just because another technology is easier or more modern.

For every technology in the implementation, classify it as:

| Technology | Purpose | Mentioned in Project? | Required/Optional |
| ---------- | ------- | --------------------- | ----------------- |

If you introduce any additional technology that is **not explicitly mentioned**, clearly mark it as:

> **ADDITIONAL TECHNOLOGY**

and explain:

1. Why it is required
2. Where exactly it will be used
3. Why the original stack alone is insufficient
4. Whether it is mandatory or optional

Keep additional technologies to the absolute minimum.

---

# 3. Divide the Project Between 2 Team Members

Create a **non-overlapping responsibility structure** for exactly two members:

* **Member 1**
* **Member 2**

The responsibilities must be divided so that both members can work **in parallel wherever possible** without modifying the same files/modules.

The division must prevent:

* Code conflicts
* Duplicate implementation
* Unclear ownership
* Both members editing the same module
* Git merge conflicts
* Dependency confusion
* Integration problems

For every module, clearly specify its owner.

Use a table like:

| Module | Member | Files/Folders Owned | Dependencies | Deliverable |
| ------ | ------ | ------------------- | ------------ | ----------- |

---

# 4. Start From ABSOLUTE SCRATCH

Do not start from coding the main project.

Start from:

### Phase 0 — Project Setup

Explain step-by-step:

* Create GitHub repository
* Repository name recommendation
* README setup
* `.gitignore`
* License if required
* Project folder structure
* Branch strategy
* Development branches
* Main/development branch policy
* Pull request policy
* Commit message convention
* Issue tracking
* GitHub Projects / Kanban setup
* Milestones
* Labels
* Task assignment
* Code review process
* Merge strategy
* Versioning
* Documentation structure

Give the **exact Git commands** required for both members.

For example:

```bash
git clone ...
git checkout -b ...
git add .
git commit ...
git push ...
```

Also explain exactly when each member should:

* Pull
* Create a branch
* Commit
* Push
* Create a Pull Request
* Merge
* Rebase or merge from main/develop

---

# 5. Recommended Repository Structure

Design a complete folder structure suitable for this project.

For example:

```text
project-root/
│
├── README.md
├── .gitignore
├── requirements.txt
├── docs/
├── hardware/
├── firmware/
├── backend/
├── frontend/
├── ml/
│   ├── data/
│   ├── preprocessing/
│   ├── training/
│   ├── models/
│   └── inference/
├── tests/
├── scripts/
└── config/
```

However, **do not blindly use this example**.

Create the folder structure based specifically on the actual project architecture.

For every folder explain:

* Purpose
* Owner
* What files will be inside
* Which member is allowed to modify it

---

# 6. Phase-Wise Implementation Plan

Divide the entire project into logical phases.

For example:

### Phase 0 — Project & GitHub Setup

### Phase 1 — Environment Setup

### Phase 2 — Hardware Setup

### Phase 3 — Dataset Preparation

### Phase 4 — Data Preprocessing

### Phase 5 — ML/DL Model Development

### Phase 6 — Firmware Development

### Phase 7 — Backend Development

### Phase 8 — Frontend/UI Development

### Phase 9 — Communication & Integration

### Phase 10 — Testing

### Phase 11 — Optimization

### Phase 12 — Final Deployment

### Phase 13 — Documentation & Demonstration

Modify these phases according to the actual project.

For **EVERY phase**, provide:

1. Objective
2. Prerequisites
3. Member 1 tasks
4. Member 2 tasks
5. Exact deliverables
6. Files/modules created
7. Dependencies
8. Expected output
9. Testing required
10. Git branch to use
11. GitHub issue/task structure
12. Definition of Done

---

# 7. Member-Wise Detailed Work

After the phase-wise plan, create two separate roadmaps.

## MEMBER 1 ROADMAP

For each phase:

* Task
* Subtask
* File/module to work on
* Technology used
* Input
* Output
* Dependency
* Git branch
* Commit milestone
* Testing

## MEMBER 2 ROADMAP

Use the same structure.

Ensure that **Member 1 and Member 2 do not unnecessarily work on the same files.**

---

# 8. Machine Learning / Deep Learning Implementation

If the project requires an ML/DL model, give a complete implementation pipeline.

Cover:

### Dataset

* Required dataset
* Dataset source
* Dataset structure
* Required classes/features
* Data collection if necessary
* Train/validation/test split
* Data labeling

### Preprocessing

Explain:

* Cleaning
* Normalization
* Resizing
* Feature extraction
* Augmentation
* Encoding
* Handling missing/noisy data

### Model

Explain:

* Exact model architecture
* Why this model is used
* Input shape
* Output shape
* Loss function
* Optimizer
* Learning rate
* Batch size
* Number of epochs
* Evaluation metrics

### Training

Provide:

* Training workflow
* Experiment tracking
* Checkpointing
* Model saving
* Validation
* Overfitting detection
* Hyperparameter tuning

### Evaluation

Include:

* Accuracy
* Precision
* Recall
* F1-score
* Confusion matrix
* Other project-specific metrics

### Deployment

Explain:

* How the trained model is exported
* Where the model file is stored
* How inference works
* How the hardware/software system consumes the model
* Latency considerations
* Memory/compute requirements

Give the actual implementation steps and code structure where appropriate.

---

# 9. Hardware Implementation

If hardware is involved, provide:

* Complete component list
* Purpose of every component
* Pin configuration
* Wiring
* Power requirements
* Communication interfaces
* Sensor integration
* Actuator integration
* Microcontroller configuration
* Firmware architecture

Provide tables such as:

| Component | Pin | Connected To | Purpose |
| --------- | --- | ------------ | ------- |

Also explain the complete data flow:

```text
Sensor
   ↓
Microcontroller
   ↓
Processing
   ↓
ML Model / Logic
   ↓
Decision
   ↓
Actuator / Communication
```

Modify this according to the actual project.

---

# 10. Software Architecture

Explain the complete software architecture.

Show:

```text
Input
 ↓
Data Acquisition
 ↓
Preprocessing
 ↓
ML / Algorithm
 ↓
Decision Logic
 ↓
Backend / Controller
 ↓
UI / Output
```

Again, adapt it to the actual project.

Clearly identify:

* APIs
* Modules
* Interfaces
* Communication protocols
* Data formats
* Database if required
* Authentication if required
* Error handling

---

# 11. Integration Strategy

This is extremely important because there are only two team members.

Explain exactly how independently developed modules will be integrated.

Create an **Integration Contract** between Member 1 and Member 2.

For example:

| Interface | Owner | Input | Output | Format | Location |
| --------- | ----- | ----- | ------ | ------ | -------- |

Define:

* Function names
* API endpoints
* JSON structures
* Serial communication format
* MQTT topics if applicable
* File formats
* Model input/output
* Sensor data format

The goal is that both members can develop independently and integrate later without rewriting each other's code.

---

# 12. GitHub Workflow to Prevent Conflicts

Design a Git workflow specifically for a 2-member team.

Prefer a structure such as:

```text
main
  │
  └── develop
       ├── feature/member1-...
       ├── feature/member1-...
       ├── feature/member2-...
       └── feature/member2-...
```

Explain:

* Which branch is protected
* Who merges
* Pull request requirements
* Code review
* Commit naming
* Branch naming
* How to sync branches
* How to handle merge conflicts
* How to avoid touching another member's files
* When integration branches should be used

Give practical examples.

---

# 13. Dependency Management

Create a dependency matrix:

| Task | Member | Depends On | Can Start Independently? | Integration Required? |
| ---- | ------ | ---------- | ------------------------ | --------------------- |

Clearly identify:

### Critical Path

Which tasks must happen sequentially?

### Parallel Path

Which tasks can happen simultaneously?

This should maximize development speed for two people.

---

# 14. Testing Strategy

Create a complete testing plan.

Include:

### Unit Testing

### Module Testing

### Hardware Testing

### Sensor Testing

### Model Testing

### API Testing

### Communication Testing

### Integration Testing

### System Testing

### Performance Testing

### Stress Testing

### Failure Testing

### Final Acceptance Testing

For each test specify:

* What is tested
* Who performs it
* Input
* Expected result
* Pass/fail criteria

---

# 15. Debugging Strategy

Give troubleshooting procedures for:

* Hardware failures
* Sensor failures
* Communication failures
* Model prediction failures
* API failures
* Integration failures
* Git conflicts
* Dependency/version issues

Create a simple debugging decision tree where useful.

---

# 16. Final Integration

Explain exactly how the two members should combine their work.

Provide a step-by-step sequence such as:

```text
Member 1 Module Complete
        ↓
Unit Test
        ↓
Pull Request
        ↓
Review
        ↓
Merge

Member 2 Module Complete
        ↓
Unit Test
        ↓
Pull Request
        ↓
Review
        ↓
Merge

        ↓

Integration Branch
        ↓
System Integration
        ↓
Integration Testing
        ↓
Bug Fixes
        ↓
Release Candidate
        ↓
Final Testing
        ↓
main
```

Adapt this workflow to the actual project.

---

# 17. Final Project Checklist

Create a comprehensive checklist covering:

### Hardware

* [ ] Components
* [ ] Wiring
* [ ] Power
* [ ] Firmware
* [ ] Sensor validation

### Software

* [ ] Environment
* [ ] Dependencies
* [ ] Backend
* [ ] Frontend
* [ ] APIs
* [ ] Communication

### ML/DL

* [ ] Dataset
* [ ] Preprocessing
* [ ] Training
* [ ] Validation
* [ ] Evaluation
* [ ] Model export
* [ ] Inference

### GitHub

* [ ] Repository
* [ ] Branches
* [ ] Issues
* [ ] Project board
* [ ] Pull requests
* [ ] Documentation
* [ ] Releases

### Testing

* [ ] Unit
* [ ] Integration
* [ ] Hardware
* [ ] Software
* [ ] ML
* [ ] System
* [ ] Performance

### Final Deliverables

* [ ] Source code
* [ ] Trained model
* [ ] Hardware prototype
* [ ] Documentation
* [ ] README
* [ ] Architecture diagrams
* [ ] Test results
* [ ] Demo
* [ ] Final report

---

# 18. Exact Order of Implementation

Finally, give me a **numbered master sequence** from:

> **Day 1 → Fully completed project**

For example:

```text
1. Understand requirements
2. Create GitHub repository
3. Configure Git workflow
4. Create project structure
5. Set up development environments
6. ...
N. Train final model
N+1. Integrate hardware
N+2. Integration testing
N+3. Final optimization
N+4. Documentation
N+5. Final demo
```

For every step clearly state:

**Owner: Member 1 / Member 2 / Both**

and whether it can be done **in parallel or sequentially**.

---

# 19. Important Instructions

Follow these rules throughout your answer:

1. **Do not skip foundational setup.**
2. Start from absolute zero.
3. Assume the two members are working on the same GitHub repository.
4. Minimize merge conflicts.
5. Clearly assign ownership of every module/file.
6. Avoid both members editing the same files.
7. Use the project's specified technical stack strictly.
8. Clearly identify every additional technology.
9. Do not unnecessarily introduce new frameworks.
10. Do not replace specified technologies with alternatives.
11. Include ML/DL training if required by the project.
12. Include hardware implementation if required.
13. Include GitHub/project management.
14. Include exact Git workflow.
15. Include testing and debugging.
16. Include integration contracts.
17. Identify dependencies between tasks.
18. Maximize parallel development.
19. Explain **what to do, why it is done, and what the expected output is**.
20. Do not give a vague high-level roadmap; make it **implementation-ready**.

---

# OUTPUT FORMAT

Structure your response exactly in this order:

## 1. Project Understanding

## 2. Technology Stack Analysis

## 3. System Architecture

## 4. Repository & GitHub Setup

## 5. Project Folder Structure

## 6. Team Responsibility Matrix

## 7. Phase-Wise Implementation Plan

## 8. Member 1 Detailed Roadmap

## 9. Member 2 Detailed Roadmap

## 10. ML/DL Training Pipeline

## 11. Hardware Implementation

## 12. Software Implementation

## 13. Integration Contracts

## 14. Git Branch & Collaboration Strategy

## 15. Dependency & Parallelization Matrix

## 16. Testing Strategy

## 17. Debugging Strategy

## 18. Final Integration Procedure

## 19. Final Deployment

## 20. Complete Project Checklist

## 21. Day-by-Day / Step-by-Step Master Execution Plan

## 22. Risks, Bottlenecks & Solutions

---

### Most Important Requirement

I should be able to take your response and **actually start implementing the project immediately**, without needing to ask basic questions such as:

* What should I install?
* Which folder should I create?
* Which member should implement this?
* Which Git branch should I use?
* What should I commit?
* What should the other member wait for?
* How do we integrate our work?
* How do we train the model?
* How do we test it?
* How do we deploy it?

Therefore, make the roadmap **specific, sequential, practical, and implementation-oriented**, while still allowing the two members to work independently wherever possible.

If information is genuinely missing from the provided project documentation, **explicitly identify the missing information instead of inventing it**.