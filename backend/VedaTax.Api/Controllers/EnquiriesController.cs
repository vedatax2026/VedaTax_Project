using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VedaTax.Api.Data;
using VedaTax.Api.Dtos;
using VedaTax.Api.Models;

namespace VedaTax.Api.Controllers;

[ApiController]
[Route("api/enquiries")]
public class EnquiriesController(AppDbContext db) : ControllerBase
{
    /// <summary>Submitted from the "Request a free consultation" pop-up. Anonymous; linked to the user if signed in.</summary>
    [HttpPost]
    public async Task<ActionResult<EnquiryDto>> Create(CreateEnquiryRequest req)
    {
        var code = req.CountryCode.ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(req.ServiceSlug))
        {
            var exists = await db.TaxServices.AnyAsync(s => s.Slug == req.ServiceSlug && s.Country!.Code == code);
            if (!exists) return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [nameof(req.ServiceSlug)] = ["Selected service does not belong to the selected country."]
            }));
        }

        var e = new Enquiry
        {
            FullName = req.FullName.Trim(),
            Email = req.Email.Trim().ToLowerInvariant(),
            Phone = req.Phone?.Trim(),
            CountryCode = code,
            ServiceSlug = string.IsNullOrWhiteSpace(req.ServiceSlug) ? null : req.ServiceSlug,
            Message = req.Message?.Trim(),
            UserId = CurrentUserId()
        };
        db.Enquiries.Add(e);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Mine), null, ToDto(e));
    }

    /// <summary>Enquiries for the signed-in client (matched by account or email).</summary>
    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<EnquiryDto>>> Mine()
    {
        var id = CurrentUserId();
        var email = User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? User.FindFirstValue(ClaimTypes.Email);
        var list = await db.Enquiries.AsNoTracking()
            .Where(x => x.UserId == id || x.Email == email)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
        return Ok(list.Select(ToDto));
    }

    /// <summary>All enquiries, for staff.</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EnquiryDto>>> All()
    {
        var list = await db.Enquiries.AsNoTracking().OrderByDescending(x => x.CreatedAt).Take(500).ToListAsync();
        return Ok(list.Select(ToDto));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<EnquiryDto>> UpdateStatus(int id, UpdateEnquiryStatusRequest req)
    {
        var e = await db.Enquiries.FirstOrDefaultAsync(x => x.Id == id);
        if (e is null) return NotFound();
        e.Status = req.Status;
        await db.SaveChangesAsync();
        return Ok(ToDto(e));
    }

    private int? CurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : null;
    }

    private static EnquiryDto ToDto(Enquiry e) =>
        new(e.Id, e.FullName, e.Email, e.Phone, e.CountryCode, e.ServiceSlug, e.Message, e.Status, e.CreatedAt);
}
