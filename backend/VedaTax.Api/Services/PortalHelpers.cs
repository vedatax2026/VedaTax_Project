using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VedaTax.Api.Data;
using VedaTax.Api.Dtos;
using VedaTax.Api.Models;

namespace VedaTax.Api.Services;

public static class ClaimsExtensions
{
    public static int? UserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : null;
    }
}

public static class PortalMapper
{
    public static FilingDto ToDto(ClientFiling f) => new(
        f.Id, f.CountryCode, PortalCatalog.CountryName(f.CountryCode), f.TaxYear,
        PortalCatalog.YearLabel(f.CountryCode, f.TaxYear), f.Status, FilingStages.IndexOf(f.Status), f.CreatedAt,
        string.IsNullOrWhiteSpace(f.ConsultantName) ? null : new ConsultantDto(f.ConsultantName!, f.ConsultantEmail, f.ConsultantPhone));

    public static DocumentDto ToDto(ClientDocument d, string countryCode, int currentUserId) => new(
        d.Id, d.Category, d.DocumentType, PortalCatalog.DocumentTypeLabel(countryCode, d.DocumentType), d.FileName,
        d.ContentType, d.SizeBytes, d.Comments, d.CreatedAt,
        d.Category == DocumentCategories.Client && d.UploadedByUserId == currentUserId);

    public static InvoiceDto ToDto(Invoice i)
    {
        var items = i.Items.OrderBy(x => x.SortOrder).Select(x => new InvoiceItemDto(x.Description, x.Amount)).ToList();
        var subtotal = items.Sum(x => x.Amount);
        return new InvoiceDto(i.Id, i.InvoiceNumber, i.InvoiceDate, i.Currency, i.Status, i.PaidAt, items, subtotal,
            i.ReferralBonus, Math.Max(0, subtotal - i.ReferralBonus));
    }
}

/// <summary>Works out each referral's status from live data, so nothing has to be kept in sync.</summary>
public class ReferralService(AppDbContext db)
{
    public async Task<List<ReferralDto>> ForUserAsync(int userId, CancellationToken ct = default)
    {
        var referrals = await db.Referrals.AsNoTracking()
            .Where(r => r.ReferrerUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);
        if (referrals.Count == 0) return [];

        var emails = referrals.Select(r => r.Email).Distinct().ToList();
        var users = await db.Users.AsNoTracking()
            .Where(u => emails.Contains(u.Email) && u.Id != userId)
            .Select(u => new { u.Id, u.Email })
            .ToListAsync(ct);
        var userIds = users.Select(u => u.Id).ToList();

        // First paid invoice of each referred user decides the bonus currency.
        var paid = await db.Invoices.AsNoTracking()
            .Where(i => i.Status == "Paid" && userIds.Contains(i.Filing!.UserId))
            .OrderBy(i => i.PaidAt)
            .Select(i => new { i.Filing!.UserId, i.Filing.CountryCode })
            .ToListAsync(ct);

        return referrals.Select(r =>
        {
            var u = users.FirstOrDefault(x => x.Email == r.Email);
            var p = u is null ? null : paid.FirstOrDefault(x => x.UserId == u.Id);
            var status = p is not null ? "Paid" : u is not null ? "Registered" : "Invited";
            var bonus = p is null ? null
                : new MoneyDto(PortalCatalog.Currency(p.CountryCode), PortalCatalog.ReferralBonus(p.CountryCode));
            return new ReferralDto(r.Id, r.Name, r.Email, r.Phone, r.CreatedAt, status, bonus);
        }).ToList();
    }

    public static ReferralStatsDto Stats(IReadOnlyList<ReferralDto> list) => new(
        list.Count,
        list.Count(r => r.Status != "Invited"),
        list.Count(r => r.Status == "Paid"),
        list.Where(r => r.Bonus is not null)
            .GroupBy(r => r.Bonus!.Currency)
            .Select(g => new MoneyDto(g.Key, g.Sum(x => x.Bonus!.Amount)))
            .ToList());

    /// <summary>Earned bonus in a currency minus what has already been deducted on the user's invoices.</summary>
    public async Task<decimal> AvailableBonusAsync(int userId, string currency, int? excludeInvoiceId, CancellationToken ct = default)
    {
        var earned = Stats(await ForUserAsync(userId, ct)).Bonus.FirstOrDefault(b => b.Currency == currency)?.Amount ?? 0;
        var used = await db.Invoices
            .Where(i => i.Filing!.UserId == userId && i.Currency == currency && i.Id != excludeInvoiceId)
            .SumAsync(i => (decimal?)i.ReferralBonus, ct) ?? 0;
        return Math.Max(0, earned - used);
    }
}
