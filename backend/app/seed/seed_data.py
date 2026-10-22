import json
import os
import sys
from datetime import date, datetime

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.database import init_db, SessionLocal
from app.models.workspace import Workspace
from app.models.user import User
from app.models.source import GlossaryTerm
from app.models.draft import Draft, DraftVersion
from app.models.finding import Finding, FindingAction
from app.models.comment import Comment
from app.models.approval import Approval
from app.routers.auth import hash_password
from app.services.ingestion import ingest_source_document
from app.services.review_pipeline import run_brandguard_review
from app.services.audit import log_audit_event

def seed():
    init_db()
    db = SessionLocal()

    print("Seeding BrandGuard database...")

    # Check if demo workspace exists
    ws = db.query(Workspace).filter(Workspace.name == "Acme Cloud & AI").first()
    if ws:
        print("Demo workspace already exists. Skipping seed.")
        db.close()
        return

    # 1. Create Workspace
    ws = Workspace(
        name="Acme Cloud & AI",
        readability_target=60.0,
        confidence_threshold=0.65
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    print(f"Created Workspace: {ws.name} ({ws.id})")

    # 2. Create Users
    creator = User(
        workspace_id=ws.id,
        name="Alex Vance (Creator)",
        email="creator@brandguard.io",
        password_hash=hash_password("password123"),
        role="creator"
    )
    manager = User(
        workspace_id=ws.id,
        name="Elena Rostova (Brand Manager)",
        email="manager@brandguard.io",
        password_hash=hash_password("password123"),
        role="brand_manager"
    )
    reviewer = User(
        workspace_id=ws.id,
        name="Marcus Sterling (Legal Reviewer)",
        email="reviewer@brandguard.io",
        password_hash=hash_password("password123"),
        role="reviewer"
    )
    db.add_all([creator, manager, reviewer])
    db.commit()
    db.refresh(creator)
    db.refresh(manager)
    db.refresh(reviewer)
    print("Created demo users: creator@brandguard.io, manager@brandguard.io, reviewer@brandguard.io (pwd: password123)")

    # 3. Ingest Guidelines and Fact Sheet
    seed_dir = os.path.dirname(__file__)
    guideline_path = os.path.join(seed_dir, "brand_guideline.md")
    fact_sheet_path = os.path.join(seed_dir, "fact_sheet.md")
    glossary_path = os.path.join(seed_dir, "glossary.json")

    with open(guideline_path, "r", encoding="utf-8") as f:
        guideline_content = f.read()
    with open(fact_sheet_path, "r", encoding="utf-8") as f:
        fact_sheet_content = f.read()
    with open(glossary_path, "r", encoding="utf-8") as f:
        glossary_items = json.load(f)

    # Ingest guideline
    ingest_source_document(
        db=db,
        workspace_id=ws.id,
        title="Acme Brand Voice & Tone Guidelines 2025",
        source_type="guideline",
        content=guideline_content,
        uploaded_by=manager.id,
        effective_date=date(2025, 1, 1),
        expires_on=date(2026, 12, 31)
    )

    # Ingest fact sheet
    ingest_source_document(
        db=db,
        workspace_id=ws.id,
        title="Acme Enterprise Verified Fact Sheet (2025 - 2026)",
        source_type="fact_sheet",
        content=fact_sheet_content,
        uploaded_by=manager.id,
        effective_date=date(2025, 1, 1),
        expires_on=date(2026, 12, 31)
    )

    # Ingest glossary terms
    for item in glossary_items:
        g = GlossaryTerm(
            workspace_id=ws.id,
            term=item["term"],
            type=item["type"],
            replacement=item.get("replacement"),
            note=item.get("note")
        )
        db.add(g)
    db.commit()
    print("Ingested Guidelines, Fact Sheet, and Glossary terms into vector store.")

    # 4. Create Sample Draft 1 (Live Demo with rich violations and overrides)
    sample_text_1 = """# Introducing Acme LiveSync 2.0: The World's Best Streaming Engine

We are thrilled to announce HyperSync 2.0, the fastest data replication engine on the planet. Unlike cheap alternatives and inferior legacy architectures, our platform delivers guaranteed results with zero downtime.

Acme LiveSync processes 2.4 million events per second with sub-5ms latency across 12 regions, verified in independent tests. Our cloud infrastructure maintains a 99.85% uptime guarantee, ensuring your mission-critical applications run seamlessly.

To upgrade your existing cluster or talk to our lead enterprise architect Alex (reach out at alex.vance@acmecorp.internal or call 415-555-0199), click here right now.

![Performance Benchmark Graph]()
"""
    color_pairs = [
        {"foreground": "#9CA3AF", "background": "#FFFFFF", "label": "Caption Gray on White", "font_size": "normal"}, # Fails AA (approx 2.5:1)
        {"foreground": "#059669", "background": "#FFFFFF", "label": "Brand Emerald on White", "font_size": "normal"}  # Passes AA (4.5+:1)
    ]

    draft1 = Draft(
        workspace_id=ws.id,
        author_id=creator.id,
        title="Q2 Press Release: Acme LiveSync 2.0 Launch",
        status="IN_REVIEW",
        current_version=1
    )
    db.add(draft1)
    db.commit()
    db.refresh(draft1)

    v1 = DraftVersion(
        draft_id=draft1.id,
        version_no=1,
        content=sample_text_1
    )
    db.add(v1)
    db.commit()
    db.refresh(v1)

    findings1, _ = run_brandguard_review(
        db=db,
        workspace_id=ws.id,
        draft_version_id=v1.id,
        raw_content=sample_text_1,
        actor_id=creator.id,
        color_pairs=color_pairs
    )

    # Simulate creator actions on findings (accept some, dispute one with reason)
    for f in findings1:
        if "HyperSync" in f.rule or "Banned Term" in f.rule:
            act = FindingAction(
                finding_id=f.id,
                actor_id=creator.id,
                action="accept",
                reason="Replaced legacy product name with Acme LiveSync"
            )
            db.add(act)
        elif "World's Best" in f.rule or "Claims Policy" in f.rule:
            act = FindingAction(
                finding_id=f.id,
                actor_id=creator.id,
                action="dispute",
                reason="Marketing team feels 'world's best' conveys strong visionary leadership. Guideline rule is too rigid."
            )
            db.add(act)
        elif "click here" in f.rule:
            act = FindingAction(
                finding_id=f.id,
                actor_id=creator.id,
                action="accept",
                reason="Changed to 'explore our migration documentation'"
            )
            db.add(act)
    db.commit()

    # Add threaded comment
    c1 = Comment(
        draft_id=draft1.id,
        author_id=manager.id,
        body="Please ensure the 99.85% SLA claim is upgraded to the current 2025 99.95% audited number before legal signs off."
    )
    c2 = Comment(
        draft_id=draft1.id,
        author_id=creator.id,
        body="Understood Elena, updating the SLA benchmark in version 2."
    )
    db.add_all([c1, c2])
    db.commit()

    # Create Sample Draft 2 (Already Approved)
    sample_text_2 = """# Enterprise SOC2 Compliance & Architecture Summary

Acme serves over 4,200 enterprise organizations across 45 countries with an audited SOC2 Type II attestation. All customer data at rest utilizes AES-256 encryption with dedicated customer-managed encryption keys.

For detailed audit reports and third-party certifications, explore the Acme Trust Center.
"""
    draft2 = Draft(
        workspace_id=ws.id,
        author_id=creator.id,
        title="Acme Security Architecture & SOC2 Attestation",
        status="APPROVED",
        current_version=1
    )
    db.add(draft2)
    db.commit()
    db.refresh(draft2)

    v2 = DraftVersion(
        draft_id=draft2.id,
        version_no=1,
        content=sample_text_2
    )
    db.add(v2)
    db.commit()
    db.refresh(v2)

    findings2, _ = run_brandguard_review(
        db=db,
        workspace_id=ws.id,
        draft_version_id=v2.id,
        raw_content=sample_text_2,
        actor_id=creator.id
    )

    appr = Approval(
        draft_id=draft2.id,
        version_id=v2.id,
        approver_id=reviewer.id,
        decision="approved",
        note="All compliance claims validated against 2025 audited fact sheet. Clear for public distribution."
    )
    db.add(appr)
    db.commit()

    print("Seed complete! Demo workspace, sources, users, drafts, and findings initialized.")
    db.close()

if __name__ == "__main__":
    seed()
