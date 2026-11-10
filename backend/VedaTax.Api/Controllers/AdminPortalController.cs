using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VedaTax.Api.Data;
using VedaTax.Api.Dtos;
using VedaTax.Api.Models;
using VedaTax.Api.Services;

namespace VedaTax.Api.Controllers;

/// <summary>Staff endpoints that drive what clients see in the portal: file status, consultant,
/// expert documents / downloads and invoices.</summary>
[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/filings")]
public class AdminPortalController(AppDbContext db, FileStorage storage, ReferralService referrals) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminFilingDto>>> List(CancellationToken ct)
    {
        var rows = await db.Filings.AsNoTracking()
            .OrderByDescending(f => f.UpdatedAt)
            .Select(f => new
            {
                f.Id, f.UserId, f.User!.FullName, f.User.Email, f.CountryCode, f.TaxYear, f.Status, f.CreatedAt,
                f.UpdatedAt, f.ConsultantName,
                Docs = f.Documents.Count(d => d.Category == DocumentCategories.Client),
                InvoiceStatus = f.Invoice == null ? null : f.Invoice.Status
            })
            .Take(1000).ToListAsync(ct);
        return Ok(rows.Select(r => new AdminFilingDto(r.Id, r.UserId, r.FullName, r.Email, r.CountryCode,
            PortalCatalog.YearLabel(r.CountryCode, r.TaxYear), r.Status, r.Docs, r.InvoiceStatus, r.CreatedAt,
            r.UpdatedAt, r.ConsultantName)));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AdminFilingDetailDto>> Get(int id, CancellationToken ct)
    {
        var f = await db.Filings.AsNoTracking()
            .Include(x => x.User).Include(x => x.Documents).Include(x => x.Invoice!).ThenInclude(i => i.Items)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (f is null) return NotFound();
        var u = f.User!;
        var currency = PortalCatalog.Currency(f.CountryCode);
        var available = await referrals.AvailableBonusAsync(f.UserId, currency, f.Invoice?.Id, ct);
        return Ok(new AdminFilingDetailDto(
            PortalMapper.ToDto(f),
            new AdminClientDto(u.Id, u.FullName, u.Email, u.Phone, u.AlternatePhone, u.CreatedAt),
            f.Documents.OrderByDescending(d => d.CreatedAt).Select(d => PortalMapper.ToDto(d, f.CountryCode, -1)).ToList(),
            f.Invoice is null ? null : PortalMapper.ToDto(f.Invoice),
            currency, available, FilingStages.All, PortalCatalog.DueDate(f.CountryCode, f.TaxYear), f.UpdatedAt));
    }

    [HttpGet("~/api/admin/documents/{docId:int}/download")]
    public async Task<IActionResult> Download(int docId, CancellationToken ct)
    {
        var d = await db.Documents.AsNoTracking().FirstOrDefaultAsync(x => x.Id == docId, ct);
        if (d is null) return NotFound();
        var path = storage.PathFor(d.FilingId, d.StoredName);
        if (path is null) return NotFound(new ProblemDetails { Title = "The file is no longer available." });
        return PhysicalFile(path, d.ContentType, d.FileName);
    }

    /// <summary>Remove a file staff shared. Client uploads are left to the client.</summary>
    [HttpDelete("~/api/admin/documents/{docId:int}")]
    public async Task<IActionResult> DeleteDocument(int docId, CancellationToken ct)
    {
        var d = await db.Documents.FirstOrDefaultAsync(x => x.Id == docId, ct);
        if (d is null) return NotFound();
        if (d.Category == DocumentCategories.Client)
            return StatusCode(403, new ProblemDetails { Title = "Documents uploaded by the client can only be deleted by the client." });
        db.Documents.Remove(d);
        await db.SaveChangesAsync(ct);
        storage.Delete(d.FilingId, d.StoredName);
        return NoContent();
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<FilingDto>> Update(int id, UpdateFilingRequest req, CancellationToken ct)
    {
        var f = await db.Filings.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (f is null) return NotFound();
        if (req.Status is not null)
        {
            if (!FilingStages.All.Contains(req.Status))
                return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
                {
                    [nameof(req.Status)] = [$"Status must be one of: {string.Join(", ", FilingStages.All)}."]
                }));
            f.Status = req.Status;
        }
        if (req.ConsultantName is not null) f.ConsultantName = req.ConsultantName.Trim();
        if (req.ConsultantEmail is not null) f.ConsultantEmail = req.ConsultantEmail.Trim();
        if (req.ConsultantPhone is not null) f.ConsultantPhone = req.ConsultantPhone.Trim();
        f.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(PortalMapper.ToDto(f));
    }

    /// <summary>Share a file with the client. category: "expert" (for review) or "download" (final copies).</summary>
    [HttpPost("{id:int}/documents")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<ActionResult<DocumentDto>> Upload(int id, [FromForm] string category, [FromForm] string documentType,
        IFormFile file, [FromForm] string? comments, CancellationToken ct)
    {
        var f = await db.Filings.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (f is null) return NotFound();
        if (category is not (DocumentCategories.Expert or DocumentCategories.Download))
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [nameof(category)] = ["Category must be 'expert' or 'download'."]
            }));
        if (file.Length == 0 || file.Length > storage.MaxFileBytes || !FileStorage.AllowedExtensions.Contains(Path.GetExtension(file.FileName)))
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [nameof(file)] = ["File is empty, too large or of a type that isn't allowed."]
            }));

        var doc = new ClientDocument
        {
            FilingId = f.Id,
            Category = category,
            // Staff may use any label, e.g. "Draft return" or "Filed return".
            DocumentType = string.IsNullOrWhiteSpace(documentType) ? "Document" : documentType.Trim()[..Math.Min(80, documentType.Trim().Length)],
            FileName = Path.GetFileName(file.FileName),
            StoredName = await storage.SaveAsync(f.Id, file, ct),
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            SizeBytes = file.Length,
            Comments = string.IsNullOrWhiteSpace(comments) ? null : comments.Trim(),
            UploadedByUserId = User.UserId() ?? 0
        };
        db.Documents.Add(doc);
        f.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(PortalMapper.ToDto(doc, f.CountryCode, -1));
    }

    /// <summary>Create or replace the filing's invoice.</summary>
    [HttpPut("{id:int}/invoice")]
    public async Task<ActionResult<InvoiceDto>> UpsertInvoice(int id, UpsertInvoiceRequest req, CancellationToken ct)
    {
        var f = await db.Filings.Include(x => x.Invoice!).ThenInclude(i => i.Items).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (f is null) return NotFound();
        if (f.Invoice?.Status == "Paid")
            return Conflict(new ProblemDetails { Title = "This invoice has already been paid and can't be changed." });

        var currency = PortalCatalog.Currency(f.CountryCode);
        var inv = f.Invoice;
        if (inv is null)
        {
            inv = new Invoice { FilingId = f.Id, Currency = currency, InvoiceNumber = "" };
            db.Invoices.Add(inv);
        }
        else
        {
            db.InvoiceItems.RemoveRange(inv.Items);
            inv.Items.Clear();
        }

        var order = 0;
        foreach (var it in req.Items)
            inv.Items.Add(new InvoiceItem { Description = it.Description.Trim(), Amount = it.Amount, SortOrder = order++ });
        var subtotal = inv.Items.Sum(x => x.Amount);
        var bonus = req.ReferralBonus ?? await referrals.AvailableBonusAsync(f.UserId, currency, inv.Id == 0 ? null : inv.Id, ct);
        inv.ReferralBonus = Math.Min(bonus, subtotal);
        inv.InvoiceDate = DateTime.UtcNow;
        f.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        if (string.IsNullOrEmpty(inv.InvoiceNumber))
        {
            inv.InvoiceNumber = $"VT-{f.CountryCode.ToUpperInvariant()}-{f.TaxYear}-{inv.Id:D5}";
            await db.SaveChangesAsync(ct);
        }
        return Ok(PortalMapper.ToDto(inv));
    }

    [HttpPost("{id:int}/invoice/paid")]
    public async Task<ActionResult<InvoiceDto>> MarkPaid(int id, CancellationToken ct)
    {
        var f = await db.Filings.Include(x => x.Invoice!).ThenInclude(i => i.Items).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (f?.Invoice is null) return NotFound();
        f.Invoice.Status = "Paid";
        f.Invoice.PaidAt ??= DateTime.UtcNow;
        if (FilingStages.IndexOf(f.Status) < FilingStages.IndexOf(FilingStages.InvoicePaid)) f.Status = FilingStages.InvoicePaid;
        f.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(PortalMapper.ToDto(f.Invoice));
    }
}
