# HLD Project Context Bundle

This file combines the text-based context from the extracted HLD repository. Upload this to the ChatGPT Project together with the PDFs and diagrams.

## Included binary files

- `02_presentations_pdf/Mission_Control_Architecture_compressed.pdf`
- `02_presentations_pdf/Operational_Command_Center_Blueprint_compressed.pdf`
- `04_diagram_images/Async_System_Sequence_Architecture_Diagram.png`
- `04_diagram_images/Enterprise_Operational_Orchestration_Architecture.png`
- `04_diagram_images/User_Action_Execution_Command_Flow.png`

## Extracted text files


---

## File: `01_flow_slide_markdown/00_overview.md`

```text
# System Architecture Overview

Project: Modern GUI for existing Python Core system

Stack:
- Frontend: React + Vite
- BFF: FastAPI
- Messaging: RabbitMQ
- Backend: Existing Python Core

Flows:
Command Flow:
Browser -> REST -> FastAPI -> RabbitMQ -> Python Core

Event Flow:
Python Core -> RabbitMQ -> FastAPI -> SSE -> Browser

Principles:
- Frontend = UI only
- Business logic remains in backend
- BFF is translation layer
- Minimal backend changes
```

---

## File: `01_flow_slide_markdown/01_presentation_prompt.md`

```text
Create a professional High Level Design presentation.

Audience:
Engineering Managers, Architects, Technical Leads.

Requirements:
- 12–15 slides
- Enterprise modern design
- Minimal text, strong diagrams
- Speaker notes included

Structure:
1. Business problem
2. Existing architecture
3. Requirements
4. Proposed architecture
5. Components breakdown
6. Command flow (REST)
7. Event flow (SSE)
8. React + Vite decision
9. FastAPI decision
10. REST vs SSE vs WebSocket
11. Network flexibility via RabbitMQ
12. Tradeoffs
13. Final architecture
14. Benefits
15. Summary

Each decision must include:
Problem → Alternatives → Pros → Cons → Final decision
```

---

## File: `01_flow_slide_markdown/02_uml_flow_prompts.md`

```text
# UML & Diagram Prompt Pack

## System Architecture Diagram Prompt
Draw a clean enterprise architecture diagram:

Components:
- React + Vite frontend
- FastAPI BFF
- RabbitMQ message broker
- Python Core backend

Show:
- REST command path
- SSE event stream path
- Separation of UI, BFF, Core

## Command Flow UML Prompt
Sequence diagram:

User -> React UI -> FastAPI (REST)
FastAPI -> RabbitMQ -> Python Core
Python Core -> RabbitMQ -> FastAPI
FastAPI -> SSE -> UI

Label as:
Run Command Flow

## Event Flow UML Prompt
Sequence diagram:

Python Core emits events ->
RabbitMQ ->
FastAPI ->
SSE stream ->
Frontend UI updates

Focus:
- logs
- status updates
- progress updates

## Attack / Tool Flow (generic flow extension)
Two-stage flow:

1. Selection phase:
User selects target + config in GUI
FastAPI validates + sends command via RabbitMQ

2. Execution phase:
Core system executes tool/operation
Events streamed back via SSE

## Future Extension Flow
Optional:
WebSocket bidirectional upgrade path
Microservice expansion via RabbitMQ routing keys
```

---

## File: `01_flow_slide_markdown/03_architecture_decisions.md`

```text
# Architecture Decision Records Summary

ADR-001: React + Vite
- Chosen for simplicity and maintainability
- Avoid Angular overhead

ADR-002: No Next.js (current phase)
- No SSR or SEO needs
- Internal system only
- Simpler architecture preferred

ADR-003: FastAPI BFF
- Python ecosystem alignment
- Direct RabbitMQ integration

ADR-004: REST + SSE
- REST for commands (discrete actions)
- SSE for events (streaming updates)
- WebSocket reserved for future needs

ADR-005: Network Independence
- RabbitMQ enables cross-zone communication
- Future deployment flexibility
```

---

## File: `01_flow_slide_markdown/04_diagram_image_prompts.md`

```text
# Image Generation Prompts for Architecture Diagrams

## 1. High Level Architecture
"Enterprise system architecture diagram, clean minimal style, showing React frontend, FastAPI backend for frontend, RabbitMQ message broker, and Python core backend. Show directional arrows for REST commands and SSE events. Modern dark theme, technical diagram, high clarity."

## 2. Command Flow Diagram
"Sequence diagram showing user action in React UI sending REST request to FastAPI, then to RabbitMQ, then Python backend processing and response returning back through SSE stream. Clean UML style, white background, professional engineering diagram."

## 3. Event Streaming Diagram
"Event-driven architecture diagram showing Python backend emitting events into RabbitMQ, FastAPI consuming events and streaming via SSE to frontend. Emphasize one-way streaming flow, logs and status updates."

## 4. Full System Flow
"End-to-end system flow diagram showing UI, API gateway, message broker, backend core. Highlight separation of concerns and minimal coupling. Enterprise architecture style."

## 5. Future Architecture Expansion
"Scalable architecture diagram showing RabbitMQ enabling multiple backend services, microservices expansion, optional WebSocket layer for bidirectional communication, modular enterprise system design."
```

---

## File: `01_flow_slide_markdown/BIG_prompt_to_slide`

```text

You are a senior enterprise solution architect creating a High-Level Design presentation.

Your goal is to generate a 12–15 slide executive presentation for Engineering Managers and Technical Leads.

The presentation must focus on SYSTEM FLOWS, not just architecture descriptions.

====================================================
CONTEXT
====================================================
We are building a modern GUI system for an existing Python-based backend system.

Core architecture:
- Frontend: React + Vite
- Backend For Frontend (BFF): FastAPI
- Messaging: RabbitMQ
- Core System: Existing Python backend (unchanged)

Key principle:
- Business logic remains in the Python core
- FastAPI only translates REST/SSE ↔ RabbitMQ
- Frontend is UI only (no business logic)

====================================================
CRITICAL REQUIREMENT
====================================================
The MOST IMPORTANT part of the presentation is FLOW VISUALIZATION:

You must clearly explain and visualize:

1. COMMAND FLOW (User action → system execution)
   Browser → REST → FastAPI → RabbitMQ → Python Core → Response

2. EVENT FLOW (Real-time updates)
   Python Core → RabbitMQ → FastAPI → SSE → Browser

3. System interaction lifecycle (Run / Status / Completion)

4. Separation between:
   - Commands (REST)
   - Events (SSE)
   - Messaging backbone (RabbitMQ)

====================================================
SLIDE REQUIREMENTS
====================================================

Create 12–15 slides:

1. Project Overview
2. Business Problem
3. Existing System (Python Core)
4. Requirements & Constraints
5. High-Level Architecture Diagram
6. Command Flow (DETAILED diagram + explanation)
7. Event Flow (DETAILED diagram + explanation)
8. Component Breakdown (React / FastAPI / RabbitMQ / Core)
9. Design Decision: REST vs SSE vs WebSocket
10. Design Decision: React + Vite vs Next.js
11. Design Decision: FastAPI vs Next.js Server
12. Tradeoffs Summary
13. Network / Deployment Flexibility (RabbitMQ decoupling)
14. Final Architecture Summary
15. Key Benefits

====================================================
VISUAL REQUIREMENTS
====================================================
For each FLOW slide, generate a diagram:

- Use arrows
- Show direction of data clearly
- Highlight RabbitMQ as central backbone
- Emphasize FastAPI as translation layer

Preferred diagram style:
- Clean enterprise architecture diagrams
- Minimal text inside diagrams
- Clear separation of layers

====================================================
EXPLANATION STYLE
====================================================
For every architectural decision include:

- Problem
- Alternatives
- Pros / Cons
- Final decision

BUT keep text minimal (executive level).

====================================================
IMPORTANT EMPHASIS
====================================================
- Keep backend unchanged (very important constraint)
- RabbitMQ is the integration backbone
- FastAPI is NOT business logic
- React is UI only
- System must remain scalable and future extensible

====================================================
OUTPUT STYLE
====================================================
- Executive enterprise presentation
- Minimal text per slide
- Strong focus on diagrams
- Clear flow-centric thinking

“Each flow must be explained as a sequence diagram AND a layered architecture diagram”
```

---

## File: `03_prompts/ADR_Tradeoffs_Diagram`

```text
Architecture decision comparison slide.

Title: Key Architectural Decisions & Tradeoffs

Show 3 comparison blocks:

1. Frontend:
React + Vite vs Angular vs Next.js

2. Backend:
FastAPI vs Next.js Server

3. Real-time communication:
REST vs SSE vs WebSockets

For each block show:
- Pros
- Cons
- Final decision highlighted

Style:
- Executive presentation slide
- Minimal text
- Clean comparison tables
- Highlight selected option in green
- Grey out alternatives
- Modern enterprise design
```

---

## File: `03_prompts/Component_Architecture_Breakdown`

```text
Component architecture diagram for enterprise system.

Show 4 main components:

- React + Vite Frontend (UI Layer)
- FastAPI Backend For Frontend (API translation layer)
- RabbitMQ Message Broker (integration layer)
- Python Core System (business logic engine)

Include responsibilities:

Frontend:
- UI only
- No business logic

FastAPI:
- REST endpoints
- SSE streaming
- Message translation

RabbitMQ:
- Decoupling layer
- Async communication

Python Core:
- Business logic
- Execution engine

Style:
- Clean boxes
- Layered architecture
- Minimal text
- Enterprise diagram style
```

---

## File: `03_prompts/Event_Flow_Diagram`

```text
Real-time event streaming architecture diagram.

Title: Event Flow - Real Time Updates

Components:
- Python Core System
- RabbitMQ message broker
- FastAPI SSE layer
- React Frontend UI

Flow:

Python Core emits events →
RabbitMQ distributes events →
FastAPI subscribes and transforms events →
SSE stream pushes updates →
Browser UI updates in real time

Style:
- Streaming / pipeline visualization
- Right to left or bottom to top flow
- Emphasize continuous data flow (not request/response)
- Use wave or stream visual metaphor
- Modern enterprise UI architecture style
```

---

## File: `03_prompts/High Level Architecture Diagram`

```text
High level enterprise system architecture diagram.

Show a modern internal web application architecture.

Layers from top to bottom:

1. React + Vite Frontend (browser UI)
2. FastAPI Backend For Frontend (BFF)
3. RabbitMQ message broker
4. Existing Python Core system

Arrows:

- User actions flow:
Browser → REST API → FastAPI → RabbitMQ → Python Core

- Real-time events flow:
Python Core → RabbitMQ → FastAPI → Server Sent Events (SSE) → Browser

Design style:
- Clean enterprise architecture diagram
- Minimal text
- White background
- Blue/gray modern boxes
- Clear directional arrows
- Separate command flow and event flow visually
- Professional system design presentation style
```

---

## File: `03_prompts/prompt_for_Command Flow Diagram_STOP_ACTIONS)`

```text
Sequence diagram style architecture flow.

Title: Command Flow - User Action Execution

Actors:
- React UI (Browser)
- FastAPI BFF
- RabbitMQ Queue
- Python Core System

Flow steps:

1. User clicks "Run"
2. React sends REST request to FastAPI
3. FastAPI publishes command to RabbitMQ
4. Python Core consumes message and executes action
5. Optional response/status returned

Style:
- Clean sequence diagram
- Left to right flow
- Numbered steps
- Enterprise architecture visualization
- Minimal text
- Focus on simplicity and clarity
```

---

## File: `03_prompts/prompt_for_End-to-End System Story`

```text
End-to-end system architecture story diagram.

Show full lifecycle:

User → React UI → FastAPI → RabbitMQ → Python Core → RabbitMQ → FastAPI → SSE → UI

Divide into two lanes:

Top lane: Command execution flow
Bottom lane: Real-time event feedback loop

Style:
- Storytelling architecture diagram
- Clean arrows
- Split lanes (commands vs events)
- Enterprise dashboard aesthetic
- Very minimal text
- Focus on flow clarity over detail
```

---

## File: `99_original_notes/zip-need-to-be.txt`

```text
/architecture-pack
 ├── 01_System_Architecture_Overview.docx
 ├── 02_Architecture_Decision_Record.docx
 ├── 03_Tradeoffs.docx
 ├── 04_Presentation_Guidance.docx
 ├── 05_NotebookLM_Prompt.docx
 ├── FLOW_NOTES.md   (חדש - תוסיף בהמשך אם יש לך flow נוסף)
 └── diagrams/       (אופציונלי)
      ├── command_flow.png
      ├── event_flow.png
      └── system_overview.png
```
