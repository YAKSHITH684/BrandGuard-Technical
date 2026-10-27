import os
import sys
import json
from datetime import date

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.database import init_db, SessionLocal
from app.models.workspace import Workspace
from app.models.user import User
from app.models.source import GlossaryTerm, SourceDocument
from app.models.draft import Draft, DraftVersion
from app.models.finding import Finding, FindingAction
from app.models.comment import Comment
from app.models.approval import Approval
from app.routers.auth import hash_password
from app.services.ingestion import ingest_source_document
from app.services.review_pipeline import run_brandguard_review

def ensure_seed_data():
    init_db()
    db = SessionLocal()

    # 1. Workspace
    ws = db.query(Workspace).filter(Workspace.name == "Acme Cloud & AI").first()
    if not ws:
        ws = db.query(Workspace).first()
    if not ws:
        ws = Workspace(name="Acme Cloud & AI", readability_target=60.0, confidence_threshold=0.65)
        db.add(ws)
        db.commit()
        db.refresh(ws)

    # 2. Users: Creator, Manager, Reviewer
    users = {
        "creator@brandguard.io": ("Alex Vance (Creator)", "creator"),
        "manager@brandguard.io": ("Elena Rostova (Brand Manager)", "brand_manager"),
        "reviewer@brandguard.io": ("Marcus Sterling (Legal Reviewer)", "reviewer"),
    }

    user_objs = {}
    for email, (name, role) in users.items():
        u = db.query(User).filter(User.email == email).first()
        if not u:
            u = User(
                workspace_id=ws.id,
                name=name,
                email=email,
                password_hash=hash_password("password123"),
                role=role
            )
            db.add(u)
            db.commit()
            db.refresh(u)
        user_objs[role] = u

    # Also associate any other existing users in DB to this workspace
    for other_user in db.query(User).filter(User.workspace_id == None).all():
        other_user.workspace_id = ws.id
    db.commit()

    creator = user_objs["creator"]
    manager = user_objs["brand_manager"]
    reviewer = user_objs["reviewer"]

    # 3. Ingest Guidelines and Fact Sheet if not yet ingested
    seed_dir = os.path.dirname(__file__)
    has_guidelines = db.query(SourceDocument).filter(SourceDocument.workspace_id == ws.id).count() > 0

    if not has_guidelines:
        with open(os.path.join(seed_dir, "brand_guideline.md"), "r", encoding="utf-8") as f:
            guideline_content = f.read()
        with open(os.path.join(seed_dir, "fact_sheet.md"), "r", encoding="utf-8") as f:
            fact_sheet_content = f.read()
        with open(os.path.join(seed_dir, "glossary.json"), "r", encoding="utf-8") as f:
            glossary_items = json.load(f)

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

    # 4. Populate Review Queue Applications (Live Test Cases)
    # Case A: LiveSync 2.0 (IN_REVIEW, Disputed rule)
    d1 = db.query(Draft).filter(Draft.title == "Q2 Press Release: Acme LiveSync 2.0 Launch").first()
    if not d1:
        d1 = Draft(
            workspace_id=ws.id,
            author_id=creator.id,
            title="Q2 Press Release: Acme LiveSync 2.0 Launch",
            status="IN_REVIEW",
            current_version=1
        )
        db.add(d1)
        db.commit()
        db.refresh(d1)

        v1 = DraftVersion(
            draft_id=d1.id,
            version_no=1,
            content=(
                "# Introducing Acme LiveSync 2.0: The World's Best Streaming Engine\n\n"
                "We are thrilled to announce HyperSync 2.0, the fastest data replication engine on the planet. "
                "Unlike cheap alternatives, our platform delivers guaranteed results.\n\n"
                "Acme LiveSync processes 2.4 million events per second with sub-5ms latency across 12 regions. "
                "Our historical cloud uptime maintained a 99.85% guarantee.\n\n"
                "To upgrade your existing cluster or talk to Alex at alex.vance@acmecorp.internal, click here."
            )
        )
        db.add(v1)
        db.commit()
        db.refresh(v1)

        run_brandguard_review(
            db=db,
            workspace_id=ws.id,
            draft_version_id=v1.id,
            raw_content=v1.content,
            actor_id=creator.id,
            color_pairs=[{"foreground": "#9CA3AF", "background": "#FFFFFF", "label": "Low Contrast Caption"}]
        )

    # Case B: Sensitive Claims Draft in Review Queue requiring Legal Review
    d2 = db.query(Draft).filter(Draft.title == "Global Performance Benchmark Pitch").first()
    if not d2:
        d2 = Draft(
            workspace_id=ws.id,
            author_id=creator.id,
            title="Global Performance Benchmark Pitch",
            status="IN_REVIEW",
            current_version=1
        )
        db.add(d2)
        db.commit()
        db.refresh(d2)

        v2 = DraftVersion(
            draft_id=d2.id,
            version_no=1,
            content=(
                "# Acme Benchmark Study\n\n"
                "Independent tests prove Acme is the #1 world's best solution with 100% guaranteed zero risk. "
                "We deliver 50% faster streaming than any competitor."
            )
        )
        db.add(v2)
        db.commit()
        db.refresh(v2)

        run_brandguard_review(
            db=db,
            workspace_id=ws.id,
            draft_version_id=v2.id,
            raw_content=v2.content,
            actor_id=creator.id
        )

    # Case C: Clean Compliant Draft (IN_REVIEW ready for Brand Manager Approval)
    d3 = db.query(Draft).filter(Draft.title == "Enterprise Security Overview").first()
    if not d3:
        d3 = Draft(
            workspace_id=ws.id,
            author_id=creator.id,
            title="Enterprise Security Overview",
            status="IN_REVIEW",
            current_version=1
        )
        db.add(d3)
        db.commit()
        db.refresh(d3)

        v3 = DraftVersion(
            draft_id=d3.id,
            version_no=1,
            content=(
                "# Enterprise Security Architecture\n\n"
                "Acme serves 4,200 enterprise customers across 45 countries with an active SOC2 Type II certification. "
                "Data at rest is secured via AES-256 encryption with customer-managed keys."
            )
        )
        db.add(v3)
        db.commit()
        db.refresh(v3)

        run_brandguard_review(
            db=db,
            workspace_id=ws.id,
            draft_version_id=v3.id,
            raw_content=v3.content,
            actor_id=creator.id
        )

    # Case D: Changes Requested Draft
    d4 = db.query(Draft).filter(Draft.title == "Cloud Cost Optimization Guide").first()
    if not d4:
        d4 = Draft(
            workspace_id=ws.id,
            author_id=creator.id,
            title="Cloud Cost Optimization Guide",
            status="CHANGES_REQUESTED",
            current_version=1
        )
        db.add(d4)
        db.commit()
        db.refresh(d4)

        v4 = DraftVersion(
            draft_id=d4.id,
            version_no=1,
            content="Read more about our pricing tiers here."
        )
        db.add(v4)
        db.commit()
        db.refresh(v4)

        appr = Approval(
            draft_id=d4.id,
            version_id=v4.id,
            approver_id=manager.id,
            decision="changes_requested",
            note="Please replace generic link text and add audited compute efficiency benchmarks."
        )
        db.add(appr)
        db.commit()

    # Case E: Multimodal Visual Campaign (ClaimCheck OCR, Visual Brand Violations, Image Privacy Redaction)
    d5 = db.query(Draft).filter(Draft.title == "Q4 Multimodal Campaign: Infographic & Video Banner").first()
    if not d5:
        d5 = Draft(
            workspace_id=ws.id,
            author_id=creator.id,
            title="Q4 Multimodal Campaign: Infographic & Video Banner",
            status="IN_REVIEW",
            current_version=1
        )
        db.add(d5)
        db.commit()
        db.refresh(d5)

        v5 = DraftVersion(
            draft_id=d5.id,
            version_no=1,
            content=(
                "# Acme Enterprise Cloud Acceleration: 2026 Visual Campaign\n\n"
                "Accelerate your data infrastructure with next-generation event replication.\n\n"
                "![Q4 Enterprise Performance Infographic](infographic_banner.png)\n\n"
                "![Customer Success Testimonial Photo](alex_vance_photo.png)\n\n"
                "Explore our high-throughput architecture documentation to get started."
            )
        )
        db.add(v5)
        db.commit()
        db.refresh(v5)

        sample_images = [
            {
                "name": "infographic_banner.png",
                "agency": "Starlight Media",
                "alt_text": "banner",  # Generic alt text
                "colors": ["#FF007F", "#10B981"],  # Off-palette neon magenta
                "logo_identifier": "2021 Acme Circular Crest",  # Deprecated logo
                "aspect_ratio_skew": 0.22,  # Skewed
                "contrast_ratio": 3.2,  # Low contrast
                "has_face": False,
                "has_license_plate": False,
                "ocr_text": "Acme guarantees 99.999% uptime with zero downtime. Rated #1 Cloud Platform in 2023 Benchmark study. Contact alex.vance@acmecorp.internal"
            },
            {
                "name": "alex_vance_photo.png",
                "agency": "Internal Creative Studio",
                "alt_text": "Lead enterprise architect customer testimonial portrait",
                "colors": ["#10B981", "#0F172A"],
                "logo_identifier": "2025 Acme Geometric Wordmark",
                "aspect_ratio_skew": 0.0,
                "contrast_ratio": 7.4,
                "has_face": True,  # Triggers face blurring
                "has_license_plate": False,
                "ocr_text": "Alex Vance — Lead Enterprise Architect, internal employee workstation #EMP-8821 with API key gsk_live_secret_key_88921."
            }
        ]

        run_brandguard_review(
            db=db,
            workspace_id=ws.id,
            draft_version_id=v5.id,
            raw_content=v5.content,
            actor_id=creator.id,
            images=sample_images
        )

    db.close()
    print("Demo test cases successfully populated!")

if __name__ == "__main__":
    ensure_seed_data()
