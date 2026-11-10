using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace VedaTax.Api.Services;

/// <summary>Builds the downloadable Tax Organizer (.docx) for a country and tax year.</summary>
public static class OrganizerBuilder
{
    private const string Navy = "0B2D57";
    private const string Green = "0DB073";

    public static byte[] Build(string countryCode, int taxYear, string clientName)
    {
        using var ms = new MemoryStream();
        using (var doc = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document))
        {
            var main = doc.AddMainDocumentPart();
            var body = new Body();
            main.Document = new Document(body);

            var yearLabel = PortalCatalog.YearLabel(countryCode, taxYear);
            var country = PortalCatalog.CountryName(countryCode);

            body.Append(Para("VEDATAX", 36, Navy, bold: true));
            body.Append(Para("Simplify • Plan • Grow", 18, Green));
            body.Append(Para($"Tax Organizer — {country} — {yearLabel}", 30, Navy, bold: true, spaceBefore: 240));
            body.Append(Para($"Prepared for: {clientName}", 20, "3D4A5C"));
            body.Append(Para(
                "Please answer each question that applies to you, save this file and upload it from Client portal → Tax Organizer → Upload. " +
                "Attach the supporting documents (slips, certificates, statements) under Documents. Leave a question blank if it does not apply.",
                20, "3D4A5C", spaceBefore: 120));

            foreach (var section in PortalCatalog.OrganizerSections(countryCode))
            {
                body.Append(Para(section.Title, 24, Navy, bold: true, spaceBefore: 320));
                body.Append(QuestionTable(section.Questions));
            }

            body.Append(Para("Anything else we should know? (life events, notices received, questions for your consultant)", 20, Navy, bold: true, spaceBefore: 320));
            body.Append(QuestionTable(["Notes"]));
            body.Append(Para(
                "Declaration: the information provided is true and complete to the best of my knowledge.   Signature: ____________________   Date: ____________",
                18, "3D4A5C", spaceBefore: 360));

            body.Append(new SectionProperties(
                new PageMargin { Top = 1080, Bottom = 1080, Left = 1080, Right = 1080 }));
            main.Document.Save();
        }
        return ms.ToArray();
    }

    private static Paragraph Para(string text, int halfPoints, string color, bool bold = false, int spaceBefore = 0)
    {
        // Child order matters to Word (CT_RPr sequence): rFonts, b, color, sz.
        var props = new RunProperties(new RunFonts { Ascii = "Calibri", HighAnsi = "Calibri" });
        if (bold) props.Append(new Bold());
        props.Append(new Color { Val = color }, new FontSize { Val = halfPoints.ToString() });
        return new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = spaceBefore.ToString(), After = "80" }),
            new Run(props, new Text(text) { Space = SpaceProcessingModeValues.Preserve }));
    }

    private static Table QuestionTable(IEnumerable<string> questions)
    {
        var border = new TableBorders(
            new TopBorder { Val = BorderValues.Single, Size = 4, Color = "C9D3E0" },
            new BottomBorder { Val = BorderValues.Single, Size = 4, Color = "C9D3E0" },
            new LeftBorder { Val = BorderValues.Single, Size = 4, Color = "C9D3E0" },
            new RightBorder { Val = BorderValues.Single, Size = 4, Color = "C9D3E0" },
            new InsideHorizontalBorder { Val = BorderValues.Single, Size = 4, Color = "C9D3E0" },
            new InsideVerticalBorder { Val = BorderValues.Single, Size = 4, Color = "C9D3E0" });
        var table = new Table(new TableProperties(border, new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct }));
        foreach (var q in questions)
        {
            table.Append(new TableRow(
                Cell(q, 4200, "EAF2FB"),
                Cell("", 5800, null)));
        }
        return table;
    }

    private static TableCell Cell(string text, int width, string? fill)
    {
        var props = new TableCellProperties(new TableCellWidth { Width = width.ToString(), Type = TableWidthUnitValues.Dxa });
        if (fill is not null) props.Append(new Shading { Val = ShadingPatternValues.Clear, Fill = fill });
        return new TableCell(props, new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "60", After = "60" }),
            new Run(new RunProperties(new FontSize { Val = "20" }), new Text(text) { Space = SpaceProcessingModeValues.Preserve })));
    }
}
