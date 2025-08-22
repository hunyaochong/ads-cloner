# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Guidance

* To save main context space, for code searches, inspections, troubleshooting or analysis, use code-searcher subagent where appropriate - giving the subagent full context background for the task(s) you assign it.
* After receiving tool results, carefully reflect on their quality and determine optimal nextre p steps beforoceeding. Use your thinking to plan and iterate based on this new information, and then take the best next action.
* For maximum efficiency, whenever you need to perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially.
* Before you finish, please verify your solution
* Ensure each stop point or new feature utilizes the quality control agent.
* Do what has been asked; nothing more, nothing less.
* NEVER create files unless they're absolutely necessary for achieving your goal.
* ALWAYS prefer editing an existing file to creating a new one.
* NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
* When you update or modify core context files, also update markdown documentation and memory bank
* When asked to commit changes, exclude CLAUDE.md and CLAUDE-*.md referenced memory bank system files from any commits. Never delete these files.

## Memory Bank System

This project uses a structured memory bank system with specialized context files. Always check these files for relevant information before starting work:

### Core Context Files

* **CLAUDE-troubleshooting.md** - Common issues and proven solutions (optimized)
* **CLAUDE-config-variables.md** - Configuration variables reference
* **archive/resolved-issues.md** - Historical troubleshooting cases (archived)

**Important:** Check these files for relevant information before starting work to understand the current system architecture and troubleshooting patterns.

### Memory Bank System Backups

When asked to backup Memory Bank System files, you will copy the core context files above and @.claude settings directory to directory @/path/to/backup-directory. If files already exist in the backup directory, you will overwrite them.

## Project Overview

### Facebook Ad Manager Application

A comprehensive web application for scraping Facebook Ad Library data, downloading media files locally, and managing ad content with advanced filtering and preview capabilities.

**Architecture**: React + TypeScript frontend, Node.js/Express backend, Supabase PostgreSQL + Storage, n8n workflow integration, Python media downloader

**Key Features**:
- Meta Ad Library URL scraping via n8n workflow (ID: 8xTPT55gwzaepe62)
- Real-time ad table with progressive thumbnail loading
- Media type filtering (All/Video/Image)
- Clickable thumbnails with Facebook-style preview modal
- Bulk selection and 1:1 ad cloning functionality
- Local media storage in Supabase Storage for reliability

**Implementation Phases**: 7 phases detailed in docs/PLAN.md
- Phase 1: Foundation & Database Setup
- Phase 2: Core Scraping & Data Flow
- Phase 3: UI Components & Table Features
- Phase 4: Preview Modal & Media Display
- Phase 5: Advanced Features & Clone Functionality
- Phase 6: Error Handling & Polish
- Phase 7: Testing & Deployment

**Core Files**:
- `ad_media_downloader.py` - Existing Python script for Facebook media downloads
- `docs/PLAN.md` - Complete implementation plan with technical specifications
- `fb_ad_downloads/` - Sample downloaded media files

**Database Schema**: Job-based tracking with `scraping_jobs` and `ads` tables, using job_id foreign keys to maintain audit trails of scraping sessions.

**Data Flow**: URL input → n8n scraping → immediate table display → background media downloads → real-time thumbnail updates

**Development Priority**: Follow phases in docs/PLAN.md for systematic implementation with clear deliverables and success criteria.