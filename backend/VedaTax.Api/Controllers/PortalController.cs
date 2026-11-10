using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VedaTax.Api.Data;
using VedaTax.Api.Dtos;
using VedaTax.Api.Models;
using VedaTax.Api.Services;

namespace VedaTax.Api.Controllers;

/// <summary>Client portal: filings, dashboard, tax organizer, documents, invoice, referrals and profile.</summary>
[ApiController]
[Authorize]
[Route("api/portal")]
public class PortalController(AppDbContext db, FileStorage storage, ReferralService referrals,
    IOptions<CompanyOptions> company) : ControllerBase
{
    private int Me => User.UserId() ?? throw new UnauthorizedAccessException();

    private Task<ClientFiling?> OwnFiling(int id, CancellationToken ct) =>
        db.Filings.FirstOrDefaultAsync(f => f.Id == id && f.UserId == Me, ct);

    // ---------- Filings (the tax-year selector) ----------

    [HttpGet("filings")]
    public async Task<ActionResult<IEnumerable<FilingDto>>> Filings(CancellationToken ct)
    {
        var list = await db.Filings.AsNoTracking().Where(f => f.UserId == Me)
            .OrderByDescending(f => f.UpdatedAt).ToListAsync(ct);
        return Ok(list.Select(PortalMapper.ToDto));
    }

    /// <summary>Countries and tax years a client can start a filing for.</summary>
    [HttpGet("filing-options")]
    public async Task<ActionResult<IEnumerable<FilingCountryOptionDto>>> FilingOptions(CancellationToken ct)
    {
        var existing = await db.Filings.AsNoTracking().Where(f => f.UserId == Me)
            .Select(f => new { f.CountryCode, f.TaxYear }).ToListAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return Ok(PortalCatalog.CountryCodes.Select(c => new FilingCountryOptionDto(c, PortalCatalog.CountryName(c),
            PortalCatalog.AvailableYears(c, today)
                .Select(y => new FilingYearOptionDto(y, PortalCatalog.YearLabel(c, y),
                    existing.Any(e => e.CountryCode == c && e.TaxYear == y)))
                .ToList())));
    }

    [HttpPost("filings")]
    public async Task<ActionResult<FilingDto>> CreateFiling(CreateFilingRequest req, CancellationToken ct)
    {
        var code = req.CountryCode.ToLowerInvariant();
        var allowed = PortalCatalog.AvailableYears(code, DateOnly.FromDateTime(DateTime.UtcNow));
        if (!allowed.Contains(req.TaxYear))
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [nameof(req.TaxYear)] = [$"Tax year must be one of: {string.Join(", ", allowed.Select(y => PortalCatalog.YearLabel(code, y)))}."]
            }));

        var existing = await db.Filings.FirstOrDefaultAsync(f => f.UserId == Me && f.CountryCode == code && f.TaxYear == req.TaxYear, ct);
        if (existing is not null) return Ok(PortalMapper.ToDto(existing));

        var filing = new ClientFiling { UserId = Me, CountryCode = code, TaxYear = req.TaxYear };
        db.Filings.Add(filing);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Overview), new { id = filing.Id }, PortalMapper.ToDto(filing));
    }

    // ---------- Dashboard ----------

    [HttpGet("filings/{id:int}/overview")]
    public async Task<ActionResult<OverviewDto>> Overview(int id, CancellationToken ct)
    {
        var f = await db.Filings.AsNoTracking().Include(x => x.Invoice)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == Me, ct);
        if (f is null) return NotFound();

        var docCount = await db.Documents.CountAsync(d => d.FilingId == id && d.Category == DocumentCategories.Client, ct);
        var refs = await referrals.ForUserAsync(Me, ct);
        var due = PortalCatalog.DueDate(f.CountryCode, f.TaxYear);
        var days = due.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber;

        return Ok(new OverviewDto(PortalMapper.ToDto(f), due, days, PortalCatalog.AuthorityName(f.CountryCode),
            FilingStages.All, docCount, f.Invoice?.Status, ReferralService.Stats(refs)));
    }

    // ---------- Tax organizer ----------

    [HttpGet("filings/{id:int}/organizer")]
    public async Task<IActionResult> Organizer(int id, CancellationToken ct)
    {
        var f = await OwnFiling(id, ct);
        if (f is null) return NotFound();
        var user = await db.Users.AsNoTracking().FirstAsync(u => u.Id == Me, ct);
        var bytes = OrganizerBuilder.Build(f.CountryCode, f.TaxYear, user.FullName);
        var name = $"VedaTax_TaxOrganizer_{f.CountryCode.ToUpperInvariant()}_{f.TaxYear}.docx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", name);
    }

    // ---------- Documents ----------

    [HttpGet("filings/{id:int}/document-types")]
    public async Task<ActionResult<IEnumerable<DocumentTypeDto>>> DocumentTypes(int id, CancellationToken ct)
    {
        var f = await OwnFiling(id, ct);
        if (f is null) return NotFound();
        return Ok(PortalCatalog.DocumentTypes(f.CountryCode).Select(t => new DocumentTypeDto(t.Value, t.Label, t.Group)));
    }

    [HttpGet("filings/{id:int}/documents")]
    public async Task<ActionResult<IEnumerable<DocumentDto>>> Documents(int id, CancellationToken ct)
    {
        var f = await OwnFiling(id, ct);
        if (f is null) return NotFound();
        var docs = await db.Documents.AsNoTracking().Where(d => d.FilingId == id)
            .OrderByDescending(d => d.CreatedAt).ToListAsync(ct);
        return Ok(docs.Select(d => PortalMapper.ToDto(d, f.CountryCode, Me)));
    }

    [HttpPost("filings/{id:int}/documents")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<ActionResult<DocumentDto>> Upload(int id, [FromForm] string documentType, IFormFile? file,
        [FromForm] string? comments, CancellationToken ct)
    {
        var f = await OwnFiling(id, ct);
        if (f is null) return NotFound();

        var errors = new Dictionary<string, string[]>();
        if (!PortalCatalog.IsValidDocumentType(f.CountryCode, documentType ?? ""))
            errors["documentType"] = ["Please select a document type."];
        if (file is null || file.Length == 0)
            errors["file"] = ["Please choose a file to upload."];
        else if (file.Length > storage.MaxFileBytes)
            errors["file"] = [$"Files must be {storage.MaxFileBytes / (1024 * 1024)} MB or smaller."];
        else if (!FileStorage.AllowedExtensions.Contains(Path.GetExtension(file.FileName)))
            errors["file"] = ["Allowed file types: PDF, images, Word, Excel, CSV, TXT and ZIP."];
        if (comments?.Length > 1000) errors["comments"] = ["Comments must be 1000 characters or fewer."];
        if (errors.Count > 0) return ValidationProblem(new ValidationProblemDetails(errors));

        var stored = await storage.SaveAsync(f.Id, file!, ct);
        var doc = new ClientDocument
        {
            FilingId = f.Id,
            Category = DocumentCategories.Client,
            DocumentType = documentType!,
            FileName = Path.GetFileName(file!.FileName),
            StoredName = stored,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            SizeBytes = file.Length,
            Comments = string.IsNullOrWhiteSpace(comments) ? null : comments.Trim(),
            UploadedByUserId = Me
        };
        db.Documents.Add(doc);
        if (f.Status == FilingStages.Registered) f.Status = FilingStages.DocumentsUploaded;
        f.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(PortalMapper.ToDto(doc, f.CountryCode, Me));
    }

    [HttpGet("documents/{docId:int}/download")]
    public async Task<IActionResult> Download(int docId, CancellationToken ct)
    {
        var d = await db.Documents.AsNoTracking().FirstOrDefaultAsync(x => x.Id == docId && x.Filing!.UserId == Me, ct);
        if (d is null) return NotFound();
        var path = storage.PathFor(d.FilingId, d.StoredName);
        if (path is null) return NotFound(new ProblemDetails { Title = "The file is no longer available." });
        return PhysicalFile(path, d.ContentType, d.FileName);
    }

    [HttpDelete("documents/{docId:int}")]
    public async Task<IActionResult> DeleteDocument(int docId, CancellationToken ct)
    {
        var d = await db.Documents.FirstOrDefaultAsync(x => x.Id == docId && x.Filing!.UserId == Me, ct);
        if (d is null) return NotFound();
        if (d.Category != DocumentCategories.Client)
            return StatusCode(403, new ProblemDetails { Title = "Only documents you uploaded can be deleted." });
        db.Documents.Remove(d);
        await db.SaveChangesAsync(ct);
        storage.Delete(d.FilingId, d.StoredName);
        return NoContent();
    }

    // ---------- Invoice ----------

    [HttpGet("filings/{id:int}/invoice")]
    public async Task<ActionResult<InvoiceViewDto>> Invoice(int id, CancellationToken ct)
    {
        var f = await db.Filings.AsNoTracking().Include(x => x.User).Include(x => x.Invoice!).ThenInclude(i => i.Items)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == Me, ct);
        if (f is null) return NotFound();
        return Ok(new InvoiceViewDto(company.Value, f.User!.FullName, f.User.Email, f.User.Phone,
            PortalCatalog.YearLabel(f.CountryCode, f.TaxYear), PortalCatalog.CountryName(f.CountryCode),
            f.Invoice is null ? null : PortalMapper.ToDto(f.Invoice)));
    }

    // ---------- Refer & Earn ----------

    [HttpGet("referrals")]
    public async Task<ActionResult<IEnumerable<ReferralDto>>> Referrals(CancellationToken ct) =>
        Ok(await referrals.ForUserAsync(Me, ct));

    [HttpPost("referrals")]
    public async Task<ActionResult<CreateReferralsResult>> AddReferrals(CreateReferralsRequest req, CancellationToken ct)
    {
        var me = await db.Users.AsNoTracking().FirstAsync(u => u.Id == Me, ct);
        var existing = await db.Referrals.Where(r => r.ReferrerUserId == Me).Select(r => r.Email).ToListAsync(ct);
        var seen = new HashSet<string>(existing);
        var skipped = new List<string>();
        var added = 0;

        foreach (var r in req.Referrals)
        {
            var email = r.Email.Trim().ToLowerInvariant();
            if (email == me.Email) { skipped.Add($"{email} (that's your own email)"); continue; }
            if (!seen.Add(email)) { skipped.Add($"{email} (already referred)"); continue; }
            db.Referrals.Add(new Referral { ReferrerUserId = Me, Name = r.Name.Trim(), Email = email, Phone = r.Phone?.Trim() });
            added++;
        }
        await db.SaveChangesAsync(ct);
        return Ok(new CreateReferralsResult(added, skipped));
    }

    // ---------- Profile ----------

    [HttpGet("profile")]
    public async Task<ActionResult<ProfileDto>> Profile(CancellationToken ct)
    {
        var u = await db.Users.AsNoTracking().FirstAsync(x => x.Id == Me, ct);
        return Ok(new ProfileDto(u.FullName, u.Email, u.Phone, u.AlternatePhone));
    }

    [HttpPut("profile")]
    public async Task<ActionResult<ProfileDto>> UpdateProfile(UpdateProfileRequest req, CancellationToken ct)
    {
        var u = await db.Users.FirstAsync(x => x.Id == Me, ct);
        u.FullName = req.FullName.Trim();
        u.Phone = req.Phone.Trim();
        u.AlternatePhone = string.IsNullOrWhiteSpace(req.AlternatePhone) ? null : req.AlternatePhone.Trim();
        await db.SaveChangesAsync(ct);
        return Ok(new ProfileDto(u.FullName, u.Email, u.Phone, u.AlternatePhone));
    }
}
