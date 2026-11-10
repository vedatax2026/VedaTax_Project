using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VedaTax.Api.Data;
using VedaTax.Api.Dtos;

namespace VedaTax.Api.Controllers;

[ApiController]
[Route("api/services")]
public class ServicesController(AppDbContext db) : ControllerBase
{
    /// <summary>Data for the header Services mega-menu: US / Canada / India Taxation with their submenus.</summary>
    [HttpGet("menu")]
    public async Task<ActionResult<IEnumerable<MenuCountryDto>>> GetMenu()
    {
        var countries = await db.Countries.AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .Select(c => new MenuCountryDto(c.Code, c.Name, c.MenuTitle, c.Tagline,
                c.Services.Where(s => s.IsActive).OrderBy(s => s.SortOrder)
                    .Select(s => new MenuServiceDto(s.Slug, s.Title, s.ShortDescription)).ToList()))
            .ToListAsync();
        return Ok(countries);
    }

    /// <summary>Country landing data (hero copy + service cards), e.g. /api/services/in.</summary>
    [HttpGet("{country:length(2)}")]
    public async Task<ActionResult<CountryDto>> GetCountry(string country)
    {
        var code = country.ToLowerInvariant();
        var dto = await db.Countries.AsNoTracking()
            .Where(c => c.Code == code)
            .Select(c => new CountryDto(c.Code, c.Name, c.MenuTitle, c.Tagline, c.HeroEyebrow, c.HeroTitle,
                c.HeroSubtitle, c.Currency, c.CurrencySymbol,
                c.Services.Where(s => s.IsActive).OrderBy(s => s.SortOrder)
                    .Select(s => new ServiceSummaryDto(s.Slug, s.Title, s.ShortDescription, s.Highlights,
                        s.StartingPrice, s.PriceUnit)).ToList()))
            .FirstOrDefaultAsync();
        return dto is null ? NotFound() : Ok(dto);
    }

    /// <summary>Full service page, e.g. /api/services/us/itin-services.</summary>
    [HttpGet("{country:length(2)}/{slug}")]
    public async Task<ActionResult<ServiceDetailDto>> GetService(string country, string slug)
    {
        var code = country.ToLowerInvariant();
        var s = await db.TaxServices.AsNoTracking()
            .Include(x => x.Country)
            .Include(x => x.Faqs)
            .FirstOrDefaultAsync(x => x.Country!.Code == code && x.Slug == slug && x.IsActive);
        if (s is null) return NotFound();

        var related = await db.TaxServices.AsNoTracking()
            .Where(x => x.CountryId == s.CountryId && x.Id != s.Id && x.IsActive)
            .OrderBy(x => x.SortOrder)
            .Select(x => new MenuServiceDto(x.Slug, x.Title, x.ShortDescription))
            .ToListAsync();

        var c = s.Country!;
        return Ok(new ServiceDetailDto(c.Code, c.Name, c.MenuTitle, c.Currency, c.CurrencySymbol, s.Slug, s.Title,
            s.PageTitle, s.ShortDescription, s.Overview, s.HowItWorks, s.WhatToPrepare, s.Highlights,
            s.StartingPrice, s.PriceUnit, s.OfficialResourceName, s.OfficialResourceUrl,
            s.Faqs.OrderBy(f => f.SortOrder).Select(f => new FaqDto(f.Question, f.Answer)).ToList(),
            related));
    }
}
