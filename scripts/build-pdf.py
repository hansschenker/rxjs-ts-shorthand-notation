#!/usr/bin/env python3
"""Build the printable course handbook directly from the reviewed JSON catalog.

Usage: python scripts/build-pdf.py
Requires ReportLab and the DejaVu Sans / Sans Mono fonts. Set
RXJS_PDF_FONT_DIR if the fonts are installed outside the usual Linux directory.
All operator prose, source links, metadata, and coverage come from catalog/.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import textwrap
from collections import defaultdict
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog"
DEFAULT_OUTPUT = ROOT / "output" / "pdf" / "rxjs-deep-dive-handbook.pdf"
CATALOG_NAMES = ("creation", "transformation", "filtering-join", "support")
PAGE_W, PAGE_H = A4
MARGIN = 40.0
TOP = 48.0
BOTTOM = 45.0
WIDTH = PAGE_W - 2 * MARGIN
HEIGHT = PAGE_H - TOP - BOTTOM

INK = colors.HexColor("#132C43")
TEXT = colors.HexColor("#26384A")
MUTED = colors.HexColor("#596B7B")
TEAL = colors.HexColor("#087E88")
LINE = colors.HexColor("#D7E0E5")
CODE_BG = colors.HexColor("#EFF5F7")
EXAMPLE_BG = colors.HexColor("#F7F8FA")
AMBER = colors.HexColor("#936015")


def normalize(value: str) -> str:
    """Keep printed punctuation portable and avoid nonbreaking-hyphen glyphs."""
    for old in ("\u2010", "\u2011", "\u2012", "\u2013", "\u2014", "\u2212"):
        value = value.replace(old, "-")
    return value.replace("\u00a0", " ").replace("\t", "    ")


def markup(value: str) -> str:
    return escape(normalize(value)).replace("\n", "<br/>")


def font_setup() -> None:
    choices = [
        Path(os.environ.get("RXJS_PDF_FONT_DIR", "/usr/share/fonts/truetype/dejavu")),
        Path("/usr/local/share/fonts/dejavu"),
        Path("/usr/share/fonts/dejavu"),
    ]
    required = {
        "CourseSans": "DejaVuSans.ttf",
        "CourseSans-Bold": "DejaVuSans-Bold.ttf",
        "CourseMono": "DejaVuSansMono.ttf",
        "CourseMono-Bold": "DejaVuSansMono-Bold.ttf",
    }
    font_dir = next((p for p in choices if all((p / n).is_file() for n in required.values())), None)
    if font_dir is None:
        raise SystemExit(
            "DejaVu fonts are required. Install fonts-dejavu-core or set "
            "RXJS_PDF_FONT_DIR to the directory containing DejaVuSans and DejaVuSansMono."
        )
    for name, filename in required.items():
        pdfmetrics.registerFont(TTFont(name, str(font_dir / filename)))
    pdfmetrics.registerFontFamily(
        "CourseSans", normal="CourseSans", bold="CourseSans-Bold",
        italic="CourseSans", boldItalic="CourseSans-Bold",
    )
    pdfmetrics.registerFontFamily(
        "CourseMono", normal="CourseMono", bold="CourseMono-Bold",
        italic="CourseMono", boldItalic="CourseMono-Bold",
    )


def styles() -> dict[str, ParagraphStyle]:
    base = dict(fontName="CourseSans", fontSize=9.35, leading=12.6,
                textColor=TEXT, allowWidows=0, allowOrphans=0, splitLongWords=1)
    body = ParagraphStyle("Body", **base)
    return {
        "body": body,
        "detail": ParagraphStyle("Detail", parent=body, leftIndent=9, bulletIndent=0,
                                  bulletFontName="CourseSans", bulletFontSize=6.5),
        "scope": ParagraphStyle("Scope", parent=body, fontSize=8.4, leading=11.4, textColor=MUTED),
        "tiny": ParagraphStyle("Tiny", parent=body, fontSize=7.3, leading=10, textColor=MUTED),
        "small": ParagraphStyle("Small", parent=body, fontSize=8.7, leading=11.9),
        "heading": ParagraphStyle("Heading", parent=body, fontName="CourseSans-Bold",
                                   fontSize=20, leading=26, textColor=INK, spaceAfter=10),
        "subheading": ParagraphStyle("Subheading", parent=body, fontName="CourseSans-Bold",
                                      fontSize=11.3, leading=15, textColor=INK,
                                      spaceBefore=10, spaceAfter=7, keepWithNext=1),
        "legendTerm": ParagraphStyle("LegendTerm", parent=body, fontName="CourseMono",
                                      fontSize=8.4, leading=11.7),
        "legendDescription": ParagraphStyle("LegendDescription", parent=body, fontSize=9, leading=12.2),
        "toc": ParagraphStyle("Contents", parent=body, fontName="CourseSans",
                               fontSize=9.4, leading=13.5, spaceBefore=7,
                               leftIndent=0, firstLineIndent=0, rightIndent=0),
    }


def load_catalog() -> tuple[dict, dict, list[dict], dict[str, list[dict]], set[str]]:
    metadata = json.loads((CATALOG / "metadata.json").read_text(encoding="utf-8"))
    scope = json.loads((CATALOG / "scope.json").read_text(encoding="utf-8"))
    cards = []
    for name in CATALOG_NAMES:
        cards.extend(json.loads((CATALOG / f"{name}.json").read_text(encoding="utf-8")))
    by_id = {c["id"]: c for c in cards}
    if len(by_id) != len(cards):
        raise ValueError("Catalog IDs must be unique")
    requested = {identifier for group in scope["requested"].values() for identifier in group}
    missing = requested.difference(by_id)
    if missing:
        raise ValueError(f"Missing requested cards: {sorted(missing)}")
    by_category = defaultdict(list)
    for category in scope["categories"]:
        preferred = scope["requested"].get(category, [])
        entries = [c for c in cards if c["category"] == category]
        ranks = {identifier: i for i, identifier in enumerate(preferred)}
        entries.sort(key=lambda c: (0, ranks[c["id"]]) if c["id"] in ranks else (1, c["id"].casefold()))
        by_category[category] = entries
    if sum(map(len, by_category.values())) != len(cards):
        raise ValueError("A catalog card has a category absent from scope.json")
    return metadata, scope, cards, dict(by_category), requested


class CodeBlock(Flowable):
    def __init__(self, value: str, *, signature: bool = False):
        super().__init__()
        self.value = normalize(value)
        self.signature = signature
        self.font = "CourseMono-Bold" if signature else "CourseMono"
        self.size = 8.65 if signature else 8.0
        self.leading = 12.0 if signature else 10.9
        self.padding = 6

    def wrap(self, availWidth, availHeight):
        self.width = availWidth
        character_width = pdfmetrics.stringWidth("M", self.font, self.size)
        available_chars = max(20, int((availWidth - 2 * self.padding) / character_width))
        self.lines = []
        for original in self.value.split("\n"):
            indent = original[:len(original) - len(original.lstrip())]
            wrapper = textwrap.TextWrapper(
                width=available_chars, initial_indent=indent,
                subsequent_indent=indent + ("  " if self.signature else ""),
                break_long_words=True, break_on_hyphens=False,
                replace_whitespace=False, drop_whitespace=True,
            )
            self.lines.extend(wrapper.wrap(original.lstrip()) or [""])
        self.height = len(self.lines) * self.leading + 2 * self.padding
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.setFillColor(CODE_BG if self.signature else EXAMPLE_BG)
        c.roundRect(0, 0, self.width, self.height, 3, stroke=0, fill=1)
        c.setFillColor(INK if self.signature else TEXT)
        c.setFont(self.font, self.size)
        y = self.height - self.padding - self.size
        for line in self.lines:
            c.drawString(self.padding, y, line)
            y -= self.leading


class OperatorCard(Flowable):
    """An indivisible teaching card; its natural height controls pagination."""

    def __init__(self, card, style, requested, metadata, all_ids):
        super().__init__()
        self.card = card
        self.style = style
        self.requested = card["id"] in requested
        self.metadata = metadata
        self.all_ids = all_ids
        self.spaceAfter = 10
        self.padding = 8
        self._parts = None

    def wrap(self, availWidth, availHeight):
        self.width = availWidth
        inner_width = availWidth - 2 * self.padding
        card = self.card
        parts: list[tuple[Flowable, float, float]] = []

        def add(flowable, gap=0):
            _, height = flowable.wrap(inner_width, HEIGHT)
            parts.append((flowable, height, gap))

        heading = ParagraphStyle(
            "CardName", parent=self.style["body"], fontName="CourseSans-Bold",
            fontSize=13, leading=16.7, textColor=INK,
        )
        add(Paragraph(markup(card["name"]), heading), 1)
        kind = card["kind"].replace("-", " ")
        flags = [kind.upper(), card["status"].upper(), "COURSE LIST" if self.requested else "SUPPLEMENT"]
        if card["id"] != card["name"]:
            flags.append(card["id"])
        status_color = AMBER if card["status"] == "deprecated" else TEAL
        meta_style = ParagraphStyle("CardMeta", parent=self.style["tiny"], textColor=status_color,
                                    fontName="CourseSans-Bold", fontSize=7, leading=9.3)
        add(Paragraph(markup("  /  ".join(flags)), meta_style), 5)
        add(CodeBlock(card["signature"], signature=True), 5)
        add(Paragraph(markup(card["behavior"]), self.style["body"]), 4)
        for detail in card["details"]:
            add(Paragraph(markup(detail), self.style["detail"], bulletText="\u2022"), 1.5)
        if card.get("replacement"):
            replacement = '<b>Use now:</b> ' + markup(card["replacement"])
            add(Paragraph(replacement, self.style["scope"]), 4)
        add(CodeBlock(card["example"]), 4)
        if card.get("overloads"):
            add(Paragraph('<b>Scope.</b> ' + markup(card["overloads"]), self.style["scope"]), 3)
        if card.get("related"):
            related = []
            for identifier in card["related"]:
                label = markup(identifier)
                if identifier in self.all_ids:
                    label = f'<link href="#op-{escape(identifier, quote=True)}" color="#087E88">{label}</link>'
                related.append(label)
            add(Paragraph('<b>Related:</b> ' + " / ".join(related), self.style["tiny"]), 2)
        source_url = f'https://github.com/ReactiveX/rxjs/blob/{self.metadata["rxjsVersion"]}/src/{card["source"]}'
        refs = (
            f'<font name="CourseMono">{markup(card["import"])}</font>'
            f'  |  <link href="{escape(card["doc"], quote=True)}" color="#087E88">API docs</link>'
            f'  |  <link href="{escape(source_url, quote=True)}" color="#087E88">Pinned source</link>'
            f'  |  ID: {markup(card["id"])}'
        )
        add(Paragraph(refs, self.style["tiny"]))
        self._parts = parts
        self.height = 2 * self.padding + sum(height + gap for _, height, gap in parts)
        if self.height > HEIGHT - 4:
            raise ValueError(f'Card {card["id"]!r} is too tall for an A4 page: {self.height:.1f} pt')
        return availWidth, self.height

    def draw(self):
        c = self.canv
        c.setStrokeColor(LINE)
        c.setLineWidth(0.55)
        c.setFillColor(colors.white)
        c.roundRect(0, 0, self.width, self.height, 4, stroke=1, fill=1)
        c.setStrokeColor(AMBER if self.card["status"] == "deprecated" else TEAL)
        c.setLineWidth(2)
        c.line(0, self.height - 10, 0, self.height - 35)
        y = self.height - self.padding
        for flowable, height, gap in self._parts:
            y -= height
            flowable.drawOn(c, self.padding, y)
            y -= gap


class SectionIntro(Flowable):
    def __init__(self, title, description, number, count, style, *, key=None):
        super().__init__()
        self.title = title
        self.description = description
        self.number = number
        self.count = count
        self.style = style
        self.key = key or f"category-{number:02d}"
        self.keepWithNext = 1
        self.spaceBefore = 8
        self.spaceAfter = 10

    def wrap(self, availWidth, availHeight):
        self.width = availWidth
        self.caption = Paragraph(
            markup(f"{self.number:02d}  /  {self.count} entries"),
            ParagraphStyle("SectionCaption", parent=self.style["tiny"],
                           fontName="CourseSans-Bold", textColor=TEAL, leading=10),
        )
        self.heading = Paragraph(
            markup(self.title),
            ParagraphStyle("SectionTitle", parent=self.style["heading"],
                           fontSize=16, leading=20, spaceAfter=0),
        )
        self.intro = Paragraph(markup(self.description), self.style["body"])
        self.parts = []
        for p, gap in [(self.caption, 4), (self.heading, 5), (self.intro, 0)]:
            _, height = p.wrap(availWidth, HEIGHT)
            self.parts.append((p, height, gap))
        self.height = sum(height + gap for _, height, gap in self.parts)
        return availWidth, self.height

    def draw(self):
        y = self.height
        for p, height, gap in self.parts:
            y -= height
            p.drawOn(self.canv, 0, y)
            y -= gap


class Cover(Flowable):
    def __init__(self, metadata, cards, requested, style):
        super().__init__()
        self.metadata = metadata
        self.cards = cards
        self.requested = requested
        self.style = style
        self.width = WIDTH
        self.height = HEIGHT - 1

    def draw(self):
        c = self.canv
        m = self.metadata
        c.setFillColor(TEAL)
        c.rect(0, self.height - 24, 39, 4, stroke=0, fill=1)
        c.setFillColor(MUTED)
        c.setFont("CourseSans-Bold", 8.5)
        c.drawString(0, self.height - 46, "COURSE REFERENCE  /  PRINT EDITION")
        title_style = ParagraphStyle("CoverTitle", parent=self.style["heading"], fontSize=30,
                                     leading=37, textColor=INK)
        course = Paragraph(markup(m["course"]), title_style)
        _, height = course.wrap(WIDTH, HEIGHT)
        course.drawOn(c, 0, self.height - 96 - height)
        subtitle_text = m["title"].split(":", 1)[-1].strip()
        subtitle = Paragraph(markup(subtitle_text), ParagraphStyle(
            "CoverSubtitle", parent=self.style["heading"], fontName="CourseSans",
            fontSize=22, leading=28, textColor=INK,
        ))
        _, sub_height = subtitle.wrap(WIDTH - 35, HEIGHT)
        subtitle.drawOn(c, 0, self.height - 153 - sub_height)
        c.setFillColor(CODE_BG)
        c.roundRect(0, self.height - 337, WIDTH, 91, 5, stroke=0, fill=1)
        c.setFont("CourseMono-Bold", 26)
        c.setFillColor(TEAL)
        c.drawString(20, self.height - 295, "A* => B*")
        c.setFont("CourseSans", 9.7)
        c.setFillColor(TEXT)
        c.drawString(20, self.height - 318, "TYPE SHAPE   +   BEHAVIOR   +   EXECUTION DETAILS")
        description = Paragraph(markup(m["notationSummary"]), ParagraphStyle(
            "CoverDescription", parent=self.style["body"], fontSize=11, leading=15.5,
        ))
        _, desc_height = description.wrap(WIDTH - 30, HEIGHT)
        description.drawOn(c, 0, self.height - 370 - desc_height)
        current = sum(card["status"] == "current" for card in self.cards)
        stats = [
            f'{len(self.cards)} entries across {len(set(card["category"] for card in self.cards))} operator families',
            f'{len(self.requested)} course-list entries + {len(self.cards) - len(self.requested)} supplements',
            f'{current} current APIs + {len(self.cards) - current} deprecated APIs with replacements',
        ]
        y = self.height - 470
        for stat in stats:
            c.setFont("CourseSans", 10)
            c.setFillColor(TEXT)
            c.drawString(0, y, stat)
            y -= 19
        c.setFont("CourseSans-Bold", 9)
        c.setFillColor(INK)
        c.drawString(0, 105, f'RxJS {m["rxjsVersion"]}  /  Edition {m["edition"]}  /  {m["date"]}')
        c.setFont("CourseSans", 9)
        c.setFillColor(MUTED)
        c.drawString(0, 84, f'Course direction: {m["owner"]}')
        repo = Paragraph(
            f'<link href="{escape(m["repository"], quote=True)}" color="#087E88">{markup(m["repository"])}</link>',
            self.style["small"],
        )
        _, rh = repo.wrap(WIDTH, HEIGHT)
        repo.drawOn(c, 0, 53 - rh)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.5)
        c.line(0, 28, WIDTH, 28)
        footnote = Paragraph('1. ' + markup(m["attribution"]), self.style["small"])
        _, fh = footnote.wrap(WIDTH, HEIGHT)
        footnote.drawOn(c, 0, 17 - fh)


class OperatorIndex(Flowable):
    def __init__(self, cards, doc, style):
        super().__init__()
        self.cards = sorted(cards, key=lambda card: card["id"].casefold())
        self.doc = doc
        self.style = style

    def wrap(self, availWidth, availHeight):
        self.width = availWidth
        self.rows = (len(self.cards) + 2) // 3
        self.row_height = 12.5
        self.height = self.rows * self.row_height
        if self.height > HEIGHT - 95:
            raise ValueError("Alphabetical index exceeds one page; split its layout before adding more entries")
        return availWidth, self.height

    def draw(self):
        c = self.canv
        column_width = self.width / 3
        for i, card in enumerate(self.cards):
            column, row = divmod(i, self.rows)
            x = column * column_width
            y = self.height - (row + 1) * self.row_height + 3
            label = card["id"]
            page = str(self.doc.operator_pages.get(label, "?"))
            font_size = 7.9
            allowed = column_width - 28
            while pdfmetrics.stringWidth(label, "CourseSans", font_size) > allowed and font_size > 6.7:
                font_size -= 0.2
            c.setFont("CourseSans", font_size)
            c.setFillColor(TEAL)
            c.drawString(x, y, label)
            c.setFillColor(MUTED)
            c.drawRightString(x + column_width - 12, y, page)
            c.linkRect("", f'op-{label}', (x, y - 2, x + column_width - 10, y + 9), relative=1, thickness=0)


class StableCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        kwargs["invariant"] = 1
        kwargs["pageCompression"] = 1
        super().__init__(*args, **kwargs)


class HandbookDoc(BaseDocTemplate):
    def __init__(self, output, metadata, style, **kwargs):
        self.metadata = metadata
        self.style = style
        self.operator_pages = {}
        self.category_pages = {}
        self.card_heights = {}
        super().__init__(
            str(output), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
            topMargin=TOP, bottomMargin=BOTTOM, title=metadata["title"],
            author=f'{metadata["owner"]}; GPT-6 Astra',
            subject=metadata["notationSummary"],
            creator="rxjs-ts-shorthand-notation / scripts/build-pdf.py",
            allowSplitting=1, **kwargs,
        )
        frame = Frame(MARGIN, BOTTOM, WIDTH, HEIGHT, leftPadding=0, bottomPadding=0,
                      rightPadding=0, topPadding=0, id="page")
        self.addPageTemplates(PageTemplate(id="handbook", frames=frame, onPage=self.page_furniture))

    def page_furniture(self, c, doc):
        if doc.page == 1:
            return
        c.saveState()
        c.setFont("CourseSans-Bold", 7.3)
        c.setFillColor(MUTED)
        c.drawString(MARGIN, PAGE_H - 27, self.metadata["course"].upper())
        c.setFont("CourseSans", 7.3)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 27, "STREAM SIGNATURE REFERENCE")
        c.setStrokeColor(LINE)
        c.setLineWidth(0.45)
        c.line(MARGIN, PAGE_H - 33, PAGE_W - MARGIN, PAGE_H - 33)
        c.line(MARGIN, 33, PAGE_W - MARGIN, 33)
        c.setFillColor(MUTED)
        c.setFont("CourseSans", 7.3)
        c.drawString(MARGIN, 21, f'RxJS {self.metadata["rxjsVersion"]}  |  Edition {self.metadata["edition"]}')
        c.drawRightString(PAGE_W - MARGIN, 21, str(doc.page))
        c.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, SectionIntro):
            self.canv.bookmarkPage(flowable.key)
            self.canv.addOutlineEntry(flowable.title, flowable.key, 0, False)
            self.category_pages[flowable.title] = self.page
            self.notify("TOCEntry", (0, f'{flowable.number:02d}  {flowable.title}', self.page, flowable.key))
        elif isinstance(flowable, OperatorCard):
            card = flowable.card
            key = f'op-{card["id"]}'
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(card["id"], key, 1, False)
            self.operator_pages[card["id"]] = self.page
            self.card_heights[card["id"]] = flowable.height
        elif getattr(flowable, "bookmark_key", None):
            self.canv.bookmarkPage(flowable.bookmark_key)
            self.canv.addOutlineEntry(flowable.getPlainText(), flowable.bookmark_key, 0, False)


def heading(text, style, key):
    p = Paragraph(markup(text), style["heading"])
    p.bookmark_key = key
    return p


def legend_table(rows, style, *, column_width=154):
    content = [
        [Paragraph('<b>Notation</b>', style["small"]), Paragraph('<b>Read it as</b>', style["small"])]
    ]
    content.extend([
        Paragraph(markup(term), style["legendTerm"]),
        Paragraph(markup(description), style["legendDescription"]),
    ] for term, description in rows)
    table = Table(content, colWidths=[column_width, WIDTH - column_width], repeatRows=1,
                  hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("BACKGROUND", (0, 0), (-1, 0), CODE_BG),
        ("LINEBELOW", (0, 0), (-1, 0), 0.7, LINE),
        ("LINEBELOW", (0, 1), (-1, -1), 0.35, LINE),
    ]))
    return table


def build(output: Path) -> dict:
    font_setup()
    style = styles()
    metadata, scope, cards, by_category, requested = load_catalog()
    output.parent.mkdir(parents=True, exist_ok=True)
    doc = HandbookDoc(output, metadata, style)
    story = [Cover(metadata, cards, requested, style), PageBreak()]

    story.append(heading("Contents and reading guide", style, "contents"))
    story.append(Paragraph(
        f'{len(cards)} entries. The category links and alphabetical index open the corresponding pages. '
        'A SUPPLEMENT label identifies an entry added to the supplied course list.', style["body"],
    ))
    story.append(Spacer(1, 5))
    toc = TableOfContents()
    toc.levelStyles = [style["toc"]]
    toc.dotsMinLevel = 0
    story.append(toc)
    story.append(Spacer(1, 9))
    story.append(Paragraph("Read the shape and the policy together", style["subheading"]))
    for note in metadata["globalNotes"]:
        story.append(Paragraph(markup(note), style["detail"], bulletText="\u2022"))
        story.append(Spacer(1, 4))
    story.append(PageBreak())

    story.append(heading("Read the notation", style, "notation"))
    story.append(Paragraph(markup(metadata["notationSummary"]), style["body"]))
    story.append(Spacer(1, 12))
    story.append(legend_table(metadata["legend"], style))
    story.append(PageBreak())

    all_ids = {card["id"] for card in cards}
    for number, category in enumerate(scope["categories"], start=1):
        category_cards = by_category[category]
        story.append(SectionIntro(category, metadata["categoryIntros"][category],
                                  number, len(category_cards), style))
        story.extend(OperatorCard(card, style, requested, metadata, all_ids) for card in category_cards)

    if metadata.get("glossary"):
        story.append(PageBreak())
        story.append(heading("Named types and supporting notation", style, "named-types"))
        glossary = metadata["glossary"]
        if isinstance(glossary, dict):
            glossary = list(glossary.items())
        story.append(legend_table(glossary, style, column_width=169))

    story.append(PageBreak())
    story.append(heading("Alphabetical operator index", style, "operator-index"))
    story.append(Paragraph(
        'Names with an -operator suffix distinguish legacy pipeable forms from standalone functions. '
        'Select an entry to open its teaching card.', style["body"],
    ))
    story.append(Spacer(1, 15))
    story.append(OperatorIndex(cards, doc, style))
    doc.multiBuild(story, canvasmaker=StableCanvas)
    if set(doc.operator_pages) != all_ids:
        raise AssertionError("Not every operator card was placed in the document")
    return {
        "output": str(output),
        "cards": len(cards),
        "requested": len(requested),
        "supplements": len(cards) - len(requested),
        "pages": doc.page,
        "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "largestCardPt": round(max(doc.card_heights.values()), 1),
        "categoryPages": doc.category_pages,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    arguments = parser.parse_args()
    print(json.dumps(build(arguments.output.resolve()), indent=2))
